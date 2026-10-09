import { RecruitmentStatus } from '@common/contracts/constant'
import { SuccessResponse, UserAuth } from '@common/contracts/dto'
import { Errors } from '@common/contracts/error'
import { PaginationParams } from '@common/decorators/pagination.decorator'
import { AppException } from '@common/exceptions/app.exception'
import { AppLogger } from '@common/services/app-logger.service'
import { HelperService } from '@common/services/helper.service'
import { Injectable, Inject } from '@nestjs/common'
import { INotificationService } from '@notification/services/notification.service'
import { JobName, QueueName } from '@queue/contracts/constant'
import { IQueueProducerService } from '@queue/services/queue-producer.service'
import { RECRUITMENT_LIST_PROJECTION } from '@recruitment/contracts/constant'
import { ProcessRecruitmentApplicationDto } from '@recruitment/dto/process-recruitment-application.dto'
import { RejectRecruitmentProcessDto } from '@recruitment/dto/reject-recruitment-process.dto'
import { QueryRecruitmentDto } from '@recruitment/dto/view-recruitment.dto'
import { IRecruitmentRepository } from '@recruitment/repositories/recruitment.repository'
import { Recruitment, RecruitmentDocument } from '@recruitment/schemas/recruitment.schema'
import { SettingKey } from '@setting/contracts/constant'
import { ISettingService } from '@setting/services/setting.service'
import { VN_TIMEZONE } from '@src/config'
import * as moment from 'moment-timezone'
import { FilterQuery, PopulateOptions, QueryOptions, SaveOptions, Types, UpdateQuery } from 'mongoose'

export const IRecruitmentService = Symbol('IRecruitmentService')

export interface IRecruitmentService {
  create(createRecruitmentDto: any, options?: SaveOptions | undefined): Promise<RecruitmentDocument>
  findById(
    recruitmentId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<RecruitmentDocument>
  findOneByApplicationEmailAndStatus(
    applicationEmail: string,
    status: RecruitmentStatus[]
  ): Promise<RecruitmentDocument>
  findByHandledByAndStatus(handledBy: string, status: RecruitmentStatus[]): Promise<RecruitmentDocument[]>
  update(
    conditions: FilterQuery<Recruitment>,
    payload: UpdateQuery<Recruitment>,
    options?: QueryOptions | undefined
  ): Promise<RecruitmentDocument>
  list(pagination: PaginationParams, queryRecruitmentDto: QueryRecruitmentDto)
  processRecruitmentApplication(
    recruitmentId: string,
    processRecruitmentApplicationDto: ProcessRecruitmentApplicationDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse>
  processRecruitmentInterview(recruitmentId: string, userAuth: UserAuth): Promise<SuccessResponse>
  rejectRecruitmentProcess(
    recruitmentId: string,
    rejectRecruitmentProcessDto: RejectRecruitmentProcessDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse>
  expiredRecruitmentProcess(recruitmentId: string, userAuth: UserAuth): Promise<SuccessResponse>
}

@Injectable()
export class RecruitmentService implements IRecruitmentService {
  private readonly appLogger = new AppLogger(RecruitmentService.name)
  constructor(
    private readonly helperService: HelperService,
    @Inject(IRecruitmentRepository)
    private readonly recruitmentRepository: IRecruitmentRepository,
    @Inject(ISettingService)
    private readonly settingService: ISettingService,
    @Inject(IQueueProducerService)
    private readonly queueProducerService: IQueueProducerService,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService
  ) {}

  public async create(createRecruitmentDto: any, options?: SaveOptions | undefined) {
    const recruitment = await this.recruitmentRepository.create(createRecruitmentDto, options)

    this.addAutoExpiredJobWhenCreateRecruitmentApplication(recruitment)
    return recruitment
  }

  public async findById(
    recruitmentId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const recruitment = await this.recruitmentRepository.findOne({
      conditions: {
        _id: recruitmentId
      },
      projection,
      populates
    })
    return recruitment
  }

  findOneByApplicationEmailAndStatus(
    applicationEmail: string,
    status: RecruitmentStatus[]
  ): Promise<RecruitmentDocument> {
    return this.recruitmentRepository.findOne({
      conditions: {
        'applicationInfo.email': applicationEmail,
        status: {
          $in: status
        }
      }
    })
  }

  findByHandledByAndStatus(handledBy: string, status: RecruitmentStatus[]): Promise<RecruitmentDocument[]> {
    return this.recruitmentRepository.findMany({
      conditions: {
        handledBy: new Types.ObjectId(handledBy),
        status: {
          $in: status
        }
      }
    })
  }

  public update(
    conditions: FilterQuery<Recruitment>,
    payload: UpdateQuery<Recruitment>,
    options?: QueryOptions | undefined
  ) {
    return this.recruitmentRepository.findOneAndUpdate(conditions, payload, options)
  }

  async list(
    pagination: PaginationParams,
    queryLearnerDto: QueryRecruitmentDto,
    projection = RECRUITMENT_LIST_PROJECTION
  ) {
    const { name, email, status } = queryLearnerDto
    const filter: Record<string, any> = {}

    const validStatus = status?.filter((status) =>
      [
        RecruitmentStatus.PENDING,
        RecruitmentStatus.INTERVIEWING,
        RecruitmentStatus.SELECTED,
        RecruitmentStatus.EXPIRED,
        RecruitmentStatus.REJECTED
      ].includes(status)
    )
    if (validStatus?.length > 0) {
      filter['status'] = {
        $in: validStatus
      }
    }

    let textSearch = ''
    if (name) textSearch += name.trim()
    if (email) textSearch += ' ' + email.trim()
    if (textSearch) {
      filter['$text'] = {
        $search: textSearch.trim()
      }
    }

    return this.recruitmentRepository.model.paginate(filter, {
      ...pagination,
      projection,
      populate: [
        {
          path: 'handledBy',
          select: ['name']
        }
      ]
    })
  }

  async processRecruitmentApplication(
    recruitmentId: string,
    processRecruitmentApplicationDto: ProcessRecruitmentApplicationDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse> {
    const { meetingUrl, meetingDate } = processRecruitmentApplicationDto
    const { _id, role } = userAuth

    // validate recruitment
    const recruitment = await this.findById(recruitmentId)
    if (!recruitment) throw new AppException(Errors.RECRUITMENT_NOT_FOUND)
    if (recruitment.status !== RecruitmentStatus.PENDING) throw new AppException(Errors.RECRUITMENT_STATUS_INVALID)

    const newRecruitment = await this.recruitmentRepository.findOneAndUpdate(
      { _id: recruitmentId },
      {
        $set: {
          status: RecruitmentStatus.INTERVIEWING,
          handledBy: new Types.ObjectId(_id),
          meetingUrl,
          meetingDate
        },
        $push: {
          histories: {
            status: RecruitmentStatus.INTERVIEWING,
            timestamp: new Date(),
            userId: new Types.ObjectId(_id),
            userRole: role
          }
        }
      },
      { new: true }
    )

    // send notification
    this.notificationService.sendMail({
      to: recruitment?.applicationInfo?.email,
      subject: `[Orchidify] Invitation to Instructor Interview - Orchidify`,
      template: 'viewer/process-recruitment-application',
      context: {
        platform: 'Google Meet',
        meetingUrl: meetingUrl,
        name: recruitment?.applicationInfo?.name
      }
    })

    this.updateAutoExpiredJobWhenCreateRecruitmentApplication(newRecruitment)
    return new SuccessResponse(true)
  }

  async processRecruitmentInterview(recruitmentId: string, userAuth: UserAuth): Promise<SuccessResponse> {
    const { _id, role } = userAuth

    // validate recruitment
    const recruitment = await this.findById(recruitmentId)
    if (!recruitment) throw new AppException(Errors.RECRUITMENT_NOT_FOUND)
    if (recruitment.status !== RecruitmentStatus.INTERVIEWING) throw new AppException(Errors.RECRUITMENT_STATUS_INVALID)

    //BR-18: Staff who verify the CV will be in charge of the recruitment process.
    if (recruitment.handledBy.toString() !== _id)
      throw new AppException(Errors.RECRUITMENT_IS_IN_CHARGED_BY_ANOTHER_STAFF)

    await this.recruitmentRepository.findOneAndUpdate(
      { _id: recruitmentId },
      {
        $set: {
          status: RecruitmentStatus.SELECTED
        },
        $push: {
          histories: {
            status: RecruitmentStatus.SELECTED,
            timestamp: new Date(),
            userId: new Types.ObjectId(_id),
            userRole: role
          }
        }
      }
    )
    // send notification
    this.notificationService.sendMail({
      to: recruitment?.applicationInfo?.email,
      subject: `[Orchidify] Congratulations on becoming a part of Orchidify`,
      template: 'viewer/process-recruitment-interview',
      context: {
        name: recruitment?.applicationInfo?.name
      }
    })

    this.queueProducerService.removeJob(QueueName.RECRUITMENT, recruitment._id?.toString())
    return new SuccessResponse(true)
  }

  async rejectRecruitmentProcess(
    recruitmentId: string,
    rejectRecruitmentProcessDto: RejectRecruitmentProcessDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse> {
    const { rejectReason } = rejectRecruitmentProcessDto
    const { _id, role } = userAuth

    // validate recruitment
    const recruitment = await this.findById(recruitmentId)
    if (!recruitment) throw new AppException(Errors.RECRUITMENT_NOT_FOUND)
    if ([RecruitmentStatus.PENDING, RecruitmentStatus.INTERVIEWING].includes(recruitment.status) === false)
      throw new AppException(Errors.RECRUITMENT_STATUS_INVALID)

    //BR-18: Staff who verify the CV will be in charge of the recruitment process.
    if (recruitment.status === RecruitmentStatus.INTERVIEWING && recruitment.handledBy.toString() !== _id)
      throw new AppException(Errors.RECRUITMENT_IS_IN_CHARGED_BY_ANOTHER_STAFF)

    await this.recruitmentRepository.findOneAndUpdate(
      { _id: recruitmentId },
      {
        $set: {
          status: RecruitmentStatus.REJECTED,
          handledBy: new Types.ObjectId(_id),
          rejectReason
        },
        $push: {
          histories: {
            status: RecruitmentStatus.REJECTED,
            timestamp: new Date(),
            userId: new Types.ObjectId(_id),
            userRole: role
          }
        }
      }
    )
    // send notification
    const mailTemplate =
      recruitment.status === RecruitmentStatus.PENDING
        ? 'viewer/reject-recruitment-application.ejs'
        : 'viewer/reject-recruitment-interview.ejs'
    this.notificationService.sendMail({
      to: recruitment?.applicationInfo?.email,
      subject: `[Orchidify] Notification of Instructor Application Result`,
      template: mailTemplate,
      context: {
        name: recruitment?.applicationInfo?.name
      }
    })

    await this.queueProducerService.removeJob(QueueName.RECRUITMENT, recruitment._id?.toString())
    return new SuccessResponse(true)
  }

  async expiredRecruitmentProcess(recruitmentId: string, userAuth: UserAuth): Promise<SuccessResponse> {
    const { role } = userAuth

    // validate recruitment
    const recruitment = await this.findById(recruitmentId)
    if (!recruitment) throw new AppException(Errors.RECRUITMENT_NOT_FOUND)
    if ([RecruitmentStatus.PENDING, RecruitmentStatus.INTERVIEWING].includes(recruitment.status) === false)
      throw new AppException(Errors.RECRUITMENT_STATUS_INVALID)

    await this.recruitmentRepository.findOneAndUpdate(
      { _id: recruitmentId },
      {
        $set: {
          status: RecruitmentStatus.EXPIRED
        },
        $push: {
          histories: {
            status: RecruitmentStatus.EXPIRED,
            timestamp: new Date(),
            userRole: role
          }
        }
      }
    )

    return new SuccessResponse(true)
  }

  private async getExpiredAt(
    date: Date,
    status: RecruitmentStatus.PENDING | RecruitmentStatus.INTERVIEWING
  ): Promise<Date> {
    const recruitmentProcessAutoExpiration = (
      await this.settingService.findByKey(SettingKey.RecruitmentProcessAutoExpiration)
    ).value || [7, 7]
    const dateMoment = moment.tz(date, VN_TIMEZONE)

    let expiredDate: moment.Moment
    // BR-17: Recruitment for instructors must proceed within 14 work days (7 work days for verifying CV, 7 work days for interview and approval).
    if (status === RecruitmentStatus.PENDING) {
      expiredDate = dateMoment.clone().add(Number(recruitmentProcessAutoExpiration[0]) || 7, 'day')
    } else {
      expiredDate = dateMoment.clone().add(Number(recruitmentProcessAutoExpiration[1]) || 7, 'day')
    }
    let expiredAt = expiredDate.clone()

    // check in weekdays
    let currentDate = dateMoment.clone()
    while (currentDate.isSameOrBefore(expiredDate)) {
      // Sunday: isoWeekday=7
      if (currentDate.clone().isoWeekday() === 7) {
        expiredAt.add(1, 'day')
      }
      currentDate.add(1, 'day')
    }

    return expiredAt.toDate()
  }

  private async addAutoExpiredJobWhenCreateRecruitmentApplication(recruitment: Recruitment) {
    try {
      const expiredAt = await this.getExpiredAt(recruitment['createdAt'], RecruitmentStatus.PENDING)
      const delayTime = this.helperService.getDiffTimeByMilliseconds(expiredAt)

      await this.queueProducerService.addJob(
        QueueName.RECRUITMENT,
        JobName.RecruitmentAutoExpired,
        {
          recruitmentId: recruitment._id,
          expiredAt
        },
        {
          delay: delayTime,
          jobId: recruitment._id.toString()
        }
      )
    } catch (err) {
      this.appLogger.error(JSON.stringify(err))
    }
  }

  private async updateAutoExpiredJobWhenCreateRecruitmentApplication(recruitment: Recruitment) {
    try {
      // Remove old job
      await this.queueProducerService.removeJob(QueueName.RECRUITMENT, recruitment._id?.toString())

      // Add new job with new delay time
      const expiredAt = await this.getExpiredAt(recruitment['updatedAt'], RecruitmentStatus.INTERVIEWING)
      const delayTime = this.helperService.getDiffTimeByMilliseconds(expiredAt)

      await this.queueProducerService.addJob(
        QueueName.RECRUITMENT,
        JobName.RecruitmentAutoExpired,
        {
          recruitmentId: recruitment._id,
          expiredAt
        },
        {
          delay: delayTime,
          jobId: recruitment._id.toString()
        }
      )
    } catch (err) {
      this.appLogger.error(JSON.stringify(err))
    }
  }
}
