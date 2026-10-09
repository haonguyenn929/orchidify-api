import { Injectable, Inject } from '@nestjs/common'
import * as moment from 'moment-timezone'
import * as _ from 'lodash'
import { IPayoutRequestRepository } from '@src/payout-request/repositories/payout-request.repository'
import { PayoutRequest, PayoutRequestDocument } from '@src/payout-request/schemas/payout-request.schema'
import { Connection, FilterQuery, PopulateOptions, QueryOptions, SaveOptions, Types, UpdateQuery } from 'mongoose'
import { CreatePayoutRequestDto } from '@payout-request/dto/create-payout-request.dto'
import { PayoutRequestStatus, StaffStatus, TransactionStatus, UserRole } from '@common/contracts/constant'
import { PaginationParams } from '@common/decorators/pagination.decorator'
import { PAYOUT_REQUEST_LIST_PROJECTION } from '@src/payout-request/contracts/constant'
import { QueryPayoutRequestDto } from '@src/payout-request/dto/view-payout-request.dto'
import { VN_TIMEZONE } from '@src/config'
import { SuccessResponse, UserAuth } from '@common/contracts/dto'
import { RejectPayoutRequestDto } from '@payout-request/dto/reject-payout-request.dto'
import { AppException } from '@common/exceptions/app.exception'
import { Errors } from '@common/contracts/error'
import { AppLogger } from '@common/services/app-logger.service'
import { InjectConnection } from '@nestjs/mongoose'
import { IQueueProducerService } from '@queue/services/queue-producer.service'
import { JobName, QueueName } from '@queue/contracts/constant'
import { ISettingService } from '@setting/services/setting.service'
import { SettingKey } from '@setting/contracts/constant'
import { HelperService } from '@common/services/helper.service'
import { IInstructorService } from '@instructor/services/instructor.service'
import { ITransactionService } from '@transaction/services/transaction.service'
import { BasePayoutDto } from '@transaction/dto/base.transaction.dto'
import { TransactionType } from '@transaction/contracts/constant'
import { FCMNotificationDataType } from '@notification/contracts/constant'
import { INotificationService } from '@notification/services/notification.service'
import { IStaffService } from '@staff/services/staff.service'
import { ReportTag, ReportType } from '@report/contracts/constant'
import { IReportService } from '@report/services/report.service'
import { MarkHasMadePayoutDto } from '@payout-request/dto/mark-has-made-payout.dto'

export const IPayoutRequestService = Symbol('IPayoutRequestService')

export interface IPayoutRequestService {
  createPayoutRequest(
    createPayoutRequestDto: CreatePayoutRequestDto,
    options?: SaveOptions | undefined
  ): Promise<PayoutRequestDocument>
  findById(
    payoutRequestId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<PayoutRequestDocument>
  update(
    conditions: FilterQuery<PayoutRequest>,
    payload: UpdateQuery<PayoutRequest>,
    options?: QueryOptions | undefined
  ): Promise<PayoutRequestDocument>
  list(
    pagination: PaginationParams,
    queryPayoutRequestDto: QueryPayoutRequestDto,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  )
  findMany(
    conditions: FilterQuery<PayoutRequestDocument>,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<PayoutRequestDocument[]>
  countByCreatedByAndDate(createdBy: string, date: Date): Promise<number>
  cancelPayoutRequest(payoutRequestId: string, userAuth: UserAuth): Promise<SuccessResponse>
  expirePayoutRequest(payoutRequestId: string, userAuth: UserAuth): Promise<SuccessResponse>
  approvePayoutRequest(payoutRequestId: string, userAuth: UserAuth): Promise<SuccessResponse>
  rejectPayoutRequest(
    payoutRequestId: string,
    rejectPayoutRequestDto: RejectPayoutRequestDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse>
  markHasMadePayout(
    payoutRequestId: string,
    markHasMadePayoutDto: MarkHasMadePayoutDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse>
  getPayoutUsage({ createdBy, date }: { createdBy: string; date: Date }): Promise<number>
}

@Injectable()
export class PayoutRequestService implements IPayoutRequestService {
  private readonly appLogger = new AppLogger(PayoutRequestService.name)
  constructor(
    @Inject(IPayoutRequestRepository)
    private readonly payoutRequestRepository: IPayoutRequestRepository,
    @Inject(IInstructorService)
    private readonly instructorService: IInstructorService,
    @InjectConnection() readonly connection: Connection,
    @Inject(IQueueProducerService)
    private readonly queueProducerService: IQueueProducerService,
    @Inject(ISettingService)
    private readonly settingService: ISettingService,
    private readonly helperService: HelperService,
    @Inject(ITransactionService)
    private readonly transactionService: ITransactionService,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
    @Inject(IStaffService)
    private readonly staffService: IStaffService,
    @Inject(IReportService)
    private readonly reportService: IReportService
  ) {}

  public async createPayoutRequest(createPayoutRequestDto: CreatePayoutRequestDto, options?: SaveOptions | undefined) {
    const { amount, createdBy } = createPayoutRequestDto
    // BR-55: Instructors can create a payout request when balance is greater than 0.
    const instructor = await this.instructorService.findById(createdBy.toString())
    if (instructor.balance < amount) throw new AppException(Errors.NOT_ENOUGH_BALANCE_TO_CREATE_PAYOUT_REQUEST)

    let payoutRequest: PayoutRequestDocument
    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        payoutRequest = await this.payoutRequestRepository.create(createPayoutRequestDto, { session })

        // BR-59: When a payout request is created, the amount will be deducted from the balance.
        await this.instructorService.update(
          { _id: createdBy },
          {
            $inc: {
              balance: -amount
            }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }
    this.addPayoutRequestAutoExpiredJob(payoutRequest)

    // Send notification to staff
    this.sendNotificationToStaffWhenPayoutRequestIsCreated({ payoutRequest })

    // update payout request report
    this.reportService.update(
      { type: ReportType.PayoutRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(payoutRequest.createdBy) },
      {
        $inc: {
          'data.quantity': 1,
          [`data.${PayoutRequestStatus.PENDING}.quantity`]: 1
        }
      }
    )

    return payoutRequest
  }

  public async findById(
    payoutRequestId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const payoutRequest = await this.payoutRequestRepository.findOne({
      conditions: {
        _id: payoutRequestId
      },
      projection,
      populates
    })
    return payoutRequest
  }

  public update(
    conditions: FilterQuery<PayoutRequest>,
    payload: UpdateQuery<PayoutRequest>,
    options?: QueryOptions | undefined
  ) {
    return this.payoutRequestRepository.findOneAndUpdate(conditions, payload, options)
  }

  async list(
    pagination: PaginationParams,
    queryPayoutRequestDto: QueryPayoutRequestDto,
    projection = PAYOUT_REQUEST_LIST_PROJECTION,
    populates?: Array<PopulateOptions>
  ) {
    const { status, createdBy, hasMadePayout } = queryPayoutRequestDto
    const filter: Record<string, any> = {}

    if (createdBy) {
      filter['createdBy'] = new Types.ObjectId(createdBy)
    }

    if (hasMadePayout !== undefined) {
      filter['hasMadePayout'] = {
        $exists: hasMadePayout
      }
    }

    const validStatus = status?.filter((status) =>
      [
        PayoutRequestStatus.PENDING,
        PayoutRequestStatus.APPROVED,
        PayoutRequestStatus.CANCELED,
        PayoutRequestStatus.EXPIRED,
        PayoutRequestStatus.REJECTED
      ].includes(status)
    )
    if (validStatus?.length > 0) {
      filter['status'] = {
        $in: validStatus
      }
    }

    return this.payoutRequestRepository.model.paginate(filter, {
      ...pagination,
      projection: ['-histories'],
      populate: populates
    })
  }

  public async findMany(
    conditions: FilterQuery<PayoutRequestDocument>,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const payoutRequests = await this.payoutRequestRepository.findMany({
      conditions,
      projection,
      populates
    })
    return payoutRequests
  }

  countByCreatedByAndDate(createdBy: string, date: Date): Promise<number> {
    const startOfDate = moment(date).tz(VN_TIMEZONE).startOf('date')
    const endOfDate = moment(date).tz(VN_TIMEZONE).endOf('date')
    return this.payoutRequestRepository.model.countDocuments({
      createdBy: new Types.ObjectId(createdBy),
      createdAt: {
        $gte: startOfDate.toDate(),
        $lte: endOfDate.toDate()
      }
    })
  }

  async cancelPayoutRequest(payoutRequestId: string, userAuth: UserAuth): Promise<SuccessResponse> {
    const { _id, role } = userAuth

    // validate payout request
    const payoutRequest = await this.findById(payoutRequestId)
    if (!payoutRequest || payoutRequest.createdBy.toString() !== _id)
      throw new AppException(Errors.PAYOUT_REQUEST_NOT_FOUND)
    if (payoutRequest.status !== PayoutRequestStatus.PENDING)
      throw new AppException(Errors.PAYOUT_REQUEST_STATUS_INVALID)

    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        // update payout request
        await this.update(
          { _id: payoutRequestId },
          {
            $set: {
              status: PayoutRequestStatus.CANCELED
            },
            $push: {
              histories: {
                status: PayoutRequestStatus.CANCELED,
                timestamp: new Date(),
                userId: new Types.ObjectId(_id),
                userRole: role
              }
            }
          },
          { session }
        )
        await this.instructorService.update(
          { _id: payoutRequest.createdBy },
          {
            $inc: {
              balance: payoutRequest.amount
            }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    this.queueProducerService.removeJob(QueueName.PAYOUT_REQUEST, payoutRequestId)

    // update payout request report
    this.reportService.update(
      { type: ReportType.PayoutRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(payoutRequest.createdBy) },
      {
        $inc: {
          [`data.${PayoutRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )
    return new SuccessResponse(true)
  }

  async approvePayoutRequest(payoutRequestId: string, userAuth: UserAuth): Promise<SuccessResponse> {
    const { _id, role } = userAuth
    // validate payout request
    const payoutRequest = await this.findById(payoutRequestId)
    if (!payoutRequest) throw new AppException(Errors.PAYOUT_REQUEST_NOT_FOUND)
    if (payoutRequest.status !== PayoutRequestStatus.PENDING)
      throw new AppException(Errors.PAYOUT_REQUEST_STATUS_INVALID)

    const [payoutUsage, payoutAmountLimitPerDay] = await Promise.all([
      this.getPayoutUsage({ createdBy: payoutRequest.createdBy, date: new Date() }),
      this.settingService.findByKey(SettingKey.PayoutAmountLimitPerDay)
    ])
    //BR-57: Daily maximum amount of payout requests is 50,000,000 VND.
    const payoutAmountLimit = Number(payoutAmountLimitPerDay.value) || 50_000_000
    if (payoutUsage + payoutRequest.amount > payoutAmountLimit)
      throw new AppException(Errors.PAYOUT_AMOUNT_LIMIT_PER_DAY)

    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        // update payout request
        await this.payoutRequestRepository.findOneAndUpdate(
          { _id: payoutRequestId },
          {
            $set: {
              status: PayoutRequestStatus.APPROVED,
              handledBy: new Types.ObjectId(_id)
            },
            $push: {
              histories: {
                status: PayoutRequestStatus.APPROVED,
                timestamp: new Date(),
                userId: new Types.ObjectId(_id),
                userRole: role
              }
            }
          },
          { session }
        )

        // create new payout transaction
        const payoutPayload = {
          id: payoutRequest._id.toString(),
          code: null,
          createdAt: new Date(),
          status: 'OK'
        }
        const payout: BasePayoutDto = {
          ...payoutPayload,
          histories: [payoutPayload]
        }
        await this.transactionService.create(
          {
            type: TransactionType.PAYOUT,
            amount: payoutRequest.amount,
            debitAccount: { userRole: 'SYSTEM' as UserRole },
            creditAccount: { userId: payoutRequest.createdBy, userRole: UserRole.INSTRUCTOR },
            description: payoutRequest.description,
            status: TransactionStatus.CAPTURED,
            payout
          },
          {
            session
          }
        )
      })
    } finally {
      await session.endSession()
    }

    // send notification to instructor
    this.notificationService.sendFirebaseCloudMessaging({
      title: 'Your payout request has been approved',
      body: 'The amount will be processed within a few business days. Click to view details.',
      receiverIds: [payoutRequest.createdBy.toString()],
      data: {
        type: FCMNotificationDataType.PAYOUT_REQUEST,
        id: payoutRequestId
      }
    })

    this.queueProducerService.removeJob(QueueName.PAYOUT_REQUEST, payoutRequestId)

    // update payout request report
    this.reportService.update(
      { type: ReportType.PayoutRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(payoutRequest.createdBy) },
      {
        $inc: {
          [`data.${PayoutRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )

    return new SuccessResponse(true)
  }

  async rejectPayoutRequest(
    payoutRequestId: string,
    rejectPayoutRequestDto: RejectPayoutRequestDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse> {
    const { rejectReason } = rejectPayoutRequestDto
    const { _id, role } = userAuth

    // validate payout request
    const payoutRequest = await this.findById(payoutRequestId)
    if (!payoutRequest) throw new AppException(Errors.PAYOUT_REQUEST_NOT_FOUND)
    if (payoutRequest.status !== PayoutRequestStatus.PENDING)
      throw new AppException(Errors.PAYOUT_REQUEST_STATUS_INVALID)

    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        // update payout request
        await this.update(
          { _id: payoutRequestId },
          {
            $set: {
              status: PayoutRequestStatus.REJECTED,
              rejectReason,
              handledBy: new Types.ObjectId(_id)
            },
            $push: {
              histories: {
                status: PayoutRequestStatus.REJECTED,
                timestamp: new Date(),
                userId: new Types.ObjectId(_id),
                userRole: role
              }
            }
          },
          { session }
        )
        await this.instructorService.update(
          { _id: payoutRequest.createdBy },
          {
            $inc: {
              balance: payoutRequest.amount
            }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    this.notificationService.sendFirebaseCloudMessaging({
      title: 'Payout request has been rejected',
      body: 'The payout request is invalid. Click to view details.',
      receiverIds: [payoutRequest.createdBy.toString()],
      data: {
        type: FCMNotificationDataType.PAYOUT_REQUEST,
        id: payoutRequestId
      }
    })
    this.queueProducerService.removeJob(QueueName.PAYOUT_REQUEST, payoutRequestId)

    // update payout request report
    this.reportService.update(
      { type: ReportType.PayoutRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(payoutRequest.createdBy) },
      {
        $inc: {
          [`data.${PayoutRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )

    return new SuccessResponse(true)
  }

  async expirePayoutRequest(payoutRequestId: string, userAuth: UserAuth): Promise<SuccessResponse> {
    const { _id, role } = userAuth

    // validate payout request
    const payoutRequest = await this.findById(payoutRequestId)
    if (!payoutRequest) throw new AppException(Errors.PAYOUT_REQUEST_NOT_FOUND)
    if (payoutRequest.status !== PayoutRequestStatus.PENDING)
      throw new AppException(Errors.PAYOUT_REQUEST_STATUS_INVALID)

    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        // update payout request
        await this.update(
          { _id: payoutRequestId },
          {
            $set: {
              status: PayoutRequestStatus.EXPIRED
            },
            $push: {
              histories: {
                status: PayoutRequestStatus.EXPIRED,
                timestamp: new Date(),
                userRole: role
              }
            }
          },
          { session }
        )
        await this.instructorService.update(
          { _id: payoutRequest.createdBy },
          {
            $inc: {
              balance: payoutRequest.amount
            }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    this.notificationService.sendFirebaseCloudMessaging({
      title: 'Payout request has expired',
      body: 'The payout request has expired. Click to view details.',
      receiverIds: [payoutRequest.createdBy.toString()],
      data: {
        type: FCMNotificationDataType.PAYOUT_REQUEST,
        id: payoutRequestId
      }
    })

    // update payout request report
    this.reportService.update(
      { type: ReportType.PayoutRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(payoutRequest.createdBy) },
      {
        $inc: {
          [`data.${PayoutRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )
    return new SuccessResponse(true)
  }

  async markHasMadePayout(
    payoutRequestId: string,
    markHasMadePayoutDto: MarkHasMadePayoutDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse> {
    const { transactionCode, attachment } = markHasMadePayoutDto
    // const { _id, role } = userAuth

    // validate payout request
    const payoutRequest = await this.findById(payoutRequestId)
    if (!payoutRequest) throw new AppException(Errors.PAYOUT_REQUEST_NOT_FOUND)
    if (payoutRequest.status !== PayoutRequestStatus.APPROVED)
      throw new AppException(Errors.PAYOUT_REQUEST_STATUS_INVALID)

    if (payoutRequest.hasMadePayout === true) throw new AppException(Errors.REQUEST_ALREADY_HAS_MADE_PAYOUT)

    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        // update payout request
        await this.update(
          { _id: payoutRequestId },
          {
            $set: {
              hasMadePayout: true,
              transactionCode,
              attachment
            }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    this.notificationService.sendFirebaseCloudMessaging({
      title: 'Payout request has been paid',
      body: 'The payout request has been paid. Click to view details.',
      receiverIds: [payoutRequest.createdBy.toString()],
      data: {
        type: FCMNotificationDataType.PAYOUT_REQUEST,
        id: payoutRequestId
      }
    })

    return new SuccessResponse(true)
  }

  async getPayoutUsage({ createdBy, date }) {
    const startOfDate = moment(date).tz(VN_TIMEZONE).startOf('date')
    const endOfDate = moment(date).tz(VN_TIMEZONE).endOf('date')
    const result = await this.payoutRequestRepository.model.aggregate([
      {
        $match: {
          createdBy: new Types.ObjectId(createdBy),
          status: PayoutRequestStatus.APPROVED,
          updatedAt: {
            $gte: startOfDate.toDate(),
            $lte: endOfDate.toDate()
          }
        }
      },
      {
        $group: {
          _id: '$createdBy',
          totalAmount: { $sum: '$amount' }
        }
      }
    ])
    return _.get(result, '[0].totalAmount', 0)
  }

  async getExpiredAt(date: Date): Promise<Date> {
    const payoutRequestAutoExpiration = await this.settingService.findByKey(SettingKey.PayoutRequestAutoExpiration)
    const dateMoment = moment.tz(date, VN_TIMEZONE)
    const expiredDate = dateMoment.clone().add(Number(payoutRequestAutoExpiration.value) || 2, 'day')
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

  async addPayoutRequestAutoExpiredJob(payoutRequest: PayoutRequest) {
    try {
      const expiredAt = await this.getExpiredAt(payoutRequest['createdAt'])
      const delayTime = this.helperService.getDiffTimeByMilliseconds(expiredAt)

      await this.queueProducerService.addJob(
        QueueName.PAYOUT_REQUEST,
        JobName.PayoutRequestAutoExpired,
        {
          payoutRequestId: payoutRequest._id,
          expiredAt
        },
        {
          delay: delayTime,
          jobId: payoutRequest._id.toString()
        }
      )
    } catch (err) {
      this.appLogger.error(JSON.stringify(err))
    }
  }

  private async sendNotificationToStaffWhenPayoutRequestIsCreated({ payoutRequest }) {
    const staffs = await this.staffService.findMany({
      status: StaffStatus.ACTIVE,
      role: UserRole.STAFF
    })
    const staffIds = staffs.map((staff) => staff._id.toString())
    await this.notificationService.sendTopicFirebaseCloudMessaging({
      title: 'New payout request created',
      body: 'A new payout request was recently created. Click to view details.',
      receiverIds: staffIds,
      data: {
        type: FCMNotificationDataType.PAYOUT_REQUEST,
        id: payoutRequest._id.toString()
      },
      topic: 'STAFF_NOTIFICATION_TOPIC'
    })
  }
}
