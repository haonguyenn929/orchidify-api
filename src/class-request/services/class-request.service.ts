import { Injectable, Inject } from '@nestjs/common'
import * as moment from 'moment-timezone'
import * as _ from 'lodash'
import { IClassRequestRepository } from '@src/class-request/repositories/class-request.repository'
import { ClassRequest, ClassRequestDocument } from '@src/class-request/schemas/class-request.schema'
import { Connection, FilterQuery, PopulateOptions, QueryOptions, SaveOptions, Types, UpdateQuery } from 'mongoose'
import { CreatePublishClassRequestDto } from '@class-request/dto/create-publish-class-request.dto'
import {
  ClassRequestStatus,
  ClassRequestType,
  ClassStatus,
  CourseStatus,
  GardenTimesheetStatus,
  StaffStatus,
  UserRole,
  Weekday
} from '@common/contracts/constant'
import { PaginationParams } from '@common/decorators/pagination.decorator'
import { CLASS_REQUEST_LIST_PROJECTION } from '@src/class-request/contracts/constant'
import { QueryClassRequestDto } from '@src/class-request/dto/view-class-request.dto'
import { VN_TIMEZONE } from '@src/config'
import { SuccessResponse, UserAuth } from '@common/contracts/dto'
import { ApproveClassRequestDto } from '@class-request/dto/approve-class-request.dto'
import { RejectClassRequestDto } from '@class-request/dto/reject-class-request.dto'
import { AppException } from '@common/exceptions/app.exception'
import { Errors } from '@common/contracts/error'
import { ICourseService } from '@course/services/course.service'
import { IGardenTimesheetService } from '@garden-timesheet/services/garden-timesheet.service'
import { AppLogger } from '@common/services/app-logger.service'
import { IClassService } from '@class/services/class.service'
import { InjectConnection } from '@nestjs/mongoose'
import { BaseProgressDto } from '@class/dto/progress.dto'
import { IQueueProducerService } from '@queue/services/queue-producer.service'
import { JobName, QueueName } from '@queue/contracts/constant'
import { ISettingService } from '@setting/services/setting.service'
import { SettingKey } from '@setting/contracts/constant'
import { HelperService } from '@common/services/helper.service'
import { Session } from '@class/schemas/session.schema'
import { CreateCancelClassRequestDto } from '@class-request/dto/create-cancel-class-request.dto'
import { ILearnerClassService } from '@class/services/learner-class.service'
import { INotificationService } from '@notification/services/notification.service'
import { FCMNotificationDataType } from '@notification/contracts/constant'
import { IStaffService } from '@staff/services/staff.service'
import { IReportService } from '@report/services/report.service'
import { ReportTag, ReportType } from '@report/contracts/constant'

export const IClassRequestService = Symbol('IClassRequestService')

export interface IClassRequestService {
  createPublishClassRequest(
    createPublishClassRequestDto: CreatePublishClassRequestDto,
    options?: SaveOptions | undefined
  ): Promise<ClassRequestDocument>
  createCancelClassRequest(
    createCancelClassRequestDto: CreateCancelClassRequestDto,
    options?: SaveOptions | undefined
  ): Promise<ClassRequestDocument>
  findById(
    classRequestId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<ClassRequestDocument>
  update(
    conditions: FilterQuery<ClassRequest>,
    payload: UpdateQuery<ClassRequest>,
    options?: QueryOptions | undefined
  ): Promise<ClassRequestDocument>
  list(
    pagination: PaginationParams,
    queryClassRequestDto: QueryClassRequestDto,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  )
  findMany(
    conditions: FilterQuery<ClassRequestDocument>,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<ClassRequestDocument[]>
  findManyByStatus(status: ClassRequestStatus[]): Promise<ClassRequestDocument[]>
  findManyByCreatedByAndStatus(createdBy: string, status?: ClassRequestStatus[]): Promise<ClassRequestDocument[]>
  countByCreatedByAndDate(createdBy: string, date: Date): Promise<number>
  cancelClassRequest(classRequestId: string, userAuth: UserAuth): Promise<SuccessResponse>
  expirePublishClassRequest(classRequestId: string, userAuth: UserAuth): Promise<SuccessResponse>
  expireCancelClassRequest(classRequestId: string, userAuth: UserAuth): Promise<SuccessResponse>
  approveClassRequest(
    classRequestId: string,
    ApproveClassRequestDto: ApproveClassRequestDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse>
  rejectClassRequest(
    classRequestId: string,
    RejectClassRequestDto: RejectClassRequestDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse>
}

@Injectable()
export class ClassRequestService implements IClassRequestService {
  private readonly appLogger = new AppLogger(ClassRequestService.name)
  constructor(
    private readonly helperService: HelperService,
    @Inject(IClassRequestRepository)
    private readonly classRequestRepository: IClassRequestRepository,
    @Inject(ICourseService)
    private readonly courseService: ICourseService,
    @Inject(IGardenTimesheetService)
    private readonly gardenTimesheetService: IGardenTimesheetService,
    @Inject(IClassService)
    private readonly classService: IClassService,
    @InjectConnection() readonly connection: Connection,
    @Inject(IQueueProducerService)
    private readonly queueProducerService: IQueueProducerService,
    @Inject(ISettingService)
    private readonly settingService: ISettingService,
    @Inject(ILearnerClassService)
    private readonly learnerClassService: ILearnerClassService,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
    @Inject(IStaffService)
    private readonly staffService: IStaffService,
    @Inject(IReportService)
    private readonly reportService: IReportService
  ) {}
  public async createPublishClassRequest(
    createPublishClassRequestDto: CreatePublishClassRequestDto,
    options?: SaveOptions | undefined
  ) {
    const classRequest = await this.classRequestRepository.create(createPublishClassRequestDto, options)
    // update course
    await this.courseService.update(
      { _id: classRequest.courseId },
      {
        $set: {
          isRequesting: true
        }
      }
    )
    this.addClassRequestAutoExpiredJob(classRequest)

    // Send notification to staff
    this.sendNotificationToStaffWhenClassRequestIsCreated({ classRequest })

    // update class request report
    this.reportService.update(
      { type: ReportType.ClassRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(classRequest.createdBy) },
      {
        $inc: {
          'data.quantity': 1,
          [`data.${ClassRequestStatus.PENDING}.quantity`]: 1
        }
      }
    )

    return classRequest
  }

  public async createCancelClassRequest(
    createCancelClassRequestDto: CreateCancelClassRequestDto,
    options?: SaveOptions | undefined
  ) {
    const classRequest = await this.classRequestRepository.create(createCancelClassRequestDto, options)
    this.addClassRequestAutoExpiredJob(classRequest)

    // update class request report
    this.reportService.update(
      { type: ReportType.ClassRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(classRequest.createdBy) },
      {
        $inc: {
          'data.quantity': 1,
          [`data.${ClassRequestStatus.PENDING}.quantity`]: 1
        }
      }
    )

    return classRequest
  }

  public async findById(
    classRequestId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const classRequest = await this.classRequestRepository.findOne({
      conditions: {
        _id: classRequestId
      },
      projection,
      populates
    })
    return classRequest
  }

  public update(
    conditions: FilterQuery<ClassRequest>,
    payload: UpdateQuery<ClassRequest>,
    options?: QueryOptions | undefined
  ) {
    return this.classRequestRepository.findOneAndUpdate(conditions, payload, options)
  }

  async list(
    pagination: PaginationParams,
    queryClassRequestDto: QueryClassRequestDto,
    projection = CLASS_REQUEST_LIST_PROJECTION,
    populates?: Array<PopulateOptions>
  ) {
    const { type, status, createdBy } = queryClassRequestDto
    const filter: Record<string, any> = {}

    if (createdBy) {
      filter['createdBy'] = new Types.ObjectId(createdBy)
    }

    const validType = type?.filter((level) =>
      [ClassRequestType.PUBLISH_CLASS, ClassRequestType.CANCEL_CLASS].includes(level)
    )
    if (validType?.length > 0) {
      filter['type'] = {
        $in: validType
      }
    }

    const validStatus = status?.filter((status) =>
      [
        ClassRequestStatus.PENDING,
        ClassRequestStatus.APPROVED,
        ClassRequestStatus.CANCELED,
        ClassRequestStatus.EXPIRED,
        ClassRequestStatus.REJECTED
      ].includes(status)
    )
    if (validStatus?.length > 0) {
      filter['status'] = {
        $in: validStatus
      }
    }

    return this.classRequestRepository.model.paginate(filter, {
      ...pagination,
      projection: ['-metadata.sessions', '-metadata.media', '-histories'],
      populate: populates
    })
  }

  public async findMany(
    conditions: FilterQuery<ClassRequestDocument>,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const classRequests = await this.classRequestRepository.findMany({
      conditions,
      projection,
      populates
    })
    return classRequests
  }

  async findManyByStatus(status: ClassRequestStatus[]): Promise<ClassRequestDocument[]> {
    const classRequests = await this.classRequestRepository.findMany({
      conditions: {
        status: {
          $in: status
        }
      }
    })
    return classRequests
  }

  async findManyByCreatedByAndStatus(
    createdBy: string,
    status?: ClassRequestStatus[]
  ): Promise<ClassRequestDocument[]> {
    const classRequests = await this.classRequestRepository.findMany({
      conditions: {
        createdBy: new Types.ObjectId(createdBy),
        status: {
          $in: status
        }
      }
    })
    return classRequests
  }

  countByCreatedByAndDate(createdBy: string, date: Date): Promise<number> {
    const startOfDate = moment(date).tz(VN_TIMEZONE).startOf('date')
    const endOfDate = moment(date).tz(VN_TIMEZONE).endOf('date')
    return this.classRequestRepository.model.countDocuments({
      createdBy: new Types.ObjectId(createdBy),
      createdAt: {
        $gte: startOfDate.toDate(),
        $lte: endOfDate.toDate()
      }
    })
  }

  async cancelClassRequest(classRequestId: string, userAuth: UserAuth): Promise<SuccessResponse> {
    const { _id, role } = userAuth

    // validate class request
    const classRequest = await this.findById(classRequestId)
    if (!classRequest || classRequest.createdBy.toString() !== _id)
      throw new AppException(Errors.CLASS_REQUEST_NOT_FOUND)
    if (classRequest.status !== ClassRequestStatus.PENDING) throw new AppException(Errors.CLASS_REQUEST_STATUS_INVALID)

    if (classRequest.type === ClassRequestType.PUBLISH_CLASS) {
      // validate course
      const course = await this.courseService.findById(classRequest.courseId?.toString())
      if (!course || course.instructorId.toString() !== _id) throw new AppException(Errors.COURSE_NOT_FOUND)
      if (course.status === CourseStatus.DELETED) throw new AppException(Errors.COURSE_STATUS_INVALID)

      // Execute in transaction
      const session = await this.connection.startSession()
      try {
        await session.withTransaction(async () => {
          // update class request
          await this.update(
            { _id: classRequestId },
            {
              $set: {
                status: ClassRequestStatus.CANCELED
              },
              $push: {
                histories: {
                  status: ClassRequestStatus.CANCELED,
                  timestamp: new Date(),
                  userId: new Types.ObjectId(_id),
                  userRole: role
                }
              }
            },
            { session }
          )

          // update course
          await this.courseService.update(
            { _id: classRequest.courseId },
            {
              $set: {
                isRequesting: false
              }
            },
            { session }
          )
        })
      } finally {
        await session.endSession()
      }
    } else if (classRequest.type === ClassRequestType.CANCEL_CLASS) {
      // validate class
      const courseClass = await this.classService.findById(classRequest.classId?.toString())
      if (!courseClass || courseClass.instructorId.toString() !== _id) throw new AppException(Errors.CLASS_NOT_FOUND)

      // Execute in transaction
      const session = await this.connection.startSession()
      try {
        await session.withTransaction(async () => {
          // update class request
          await this.update(
            { _id: classRequestId },
            {
              $set: {
                status: ClassRequestStatus.CANCELED
              },
              $push: {
                histories: {
                  status: ClassRequestStatus.CANCELED,
                  timestamp: new Date(),
                  userId: new Types.ObjectId(_id),
                  userRole: role
                }
              }
            },
            { session }
          )
        })
      } finally {
        await session.endSession()
      }
    }

    this.queueProducerService.removeJob(QueueName.CLASS_REQUEST, classRequestId)

    // update class request report
    this.reportService.update(
      { type: ReportType.ClassRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(classRequest.createdBy) },
      {
        $inc: {
          [`data.${ClassRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )
    return new SuccessResponse(true)
  }

  async approveClassRequest(
    classRequestId: string,
    approveClassRequestDto: ApproveClassRequestDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse> {
    const { gardenId } = approveClassRequestDto
    const { _id, role } = userAuth
    // validate class request
    const classRequest = await this.findById(classRequestId)
    if (!classRequest) throw new AppException(Errors.CLASS_REQUEST_NOT_FOUND)
    if (classRequest.status !== ClassRequestStatus.PENDING) throw new AppException(Errors.CLASS_REQUEST_STATUS_INVALID)

    if (classRequest.type === ClassRequestType.PUBLISH_CLASS) {
      if (!gardenId) throw new AppException(Errors.GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST)
      // validate course
      const course = await this.courseService.findById(classRequest.courseId?.toString(), ['+sessions'])
      if (!course) throw new AppException(Errors.COURSE_NOT_FOUND)
      if (course.status === CourseStatus.DELETED) throw new AppException(Errors.COURSE_STATUS_INVALID)

      // validate gardenId fit with time of class request
      const { startDate, duration, weekdays, slotNumbers } = classRequest?.metadata
      const availableSlots = await this.gardenTimesheetService.viewAvailableTime({
        startDate,
        duration,
        weekdays,
        instructorId: course.instructorId
      })
      this.appLogger.log(
        `getAvailableGardenList: slotNumbers=${slotNumbers}, availableSlotNumbers=${
          availableSlots.slotNumbers
        }, availableTimeOfGardens=${JSON.stringify(availableSlots.availableTimeOfGardens)}`
      )
      if (_.difference(slotNumbers, availableSlots.slotNumbers).length !== 0)
        throw new AppException(Errors.GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST)

      const availableGardens = availableSlots.availableTimeOfGardens.filter((availableTimeOfGarden) => {
        this.appLogger.log(
          `gardenId=${availableTimeOfGarden.gardenId}, slotNumbers=${availableTimeOfGarden.slotNumbers}`
        )
        return _.difference(slotNumbers, availableTimeOfGarden.slotNumbers).length === 0
      })
      if (availableGardens.length === 0) throw new AppException(Errors.GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST)

      const garden = availableGardens.find((availableGarden) => availableGarden.gardenId?.toString() === gardenId)
      if (!garden) throw new AppException(Errors.GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST)

      // Execute in transaction
      const session = await this.connection.startSession()
      try {
        await session.withTransaction(async () => {
          // update class request
          await this.classRequestRepository.findOneAndUpdate(
            { _id: classRequestId },
            {
              $set: {
                status: ClassRequestStatus.APPROVED
              },
              $push: {
                histories: {
                  status: ClassRequestStatus.APPROVED,
                  timestamp: new Date(),
                  userId: new Types.ObjectId(_id),
                  userRole: role
                }
              }
            },
            { session }
          )

          // update course
          await this.courseService.update(
            { _id: classRequest.courseId },
            {
              $set: {
                status: CourseStatus.ACTIVE,
                isRequesting: false
              }
            },
            { session }
          )

          // create new class
          const classData = _.pick(classRequest.metadata, [
            'title',
            'description',
            'startDate',
            'price',
            'level',
            'type',
            'duration',
            'thumbnail',
            'media',
            'sessions',
            'learnerLimit',
            'weekdays',
            'slotNumbers',
            'gardenRequiredToolkits',
            'instructorId'
          ])
          classData['code'] = await this.classService.generateCode()
          classData['status'] = ClassStatus.PUBLISHED
          classData['histories'] = [
            {
              status: ClassStatus.PUBLISHED,
              timestamp: new Date(),
              userId: new Types.ObjectId(_id),
              userRole: role
            }
          ]
          classData['learnerQuantity'] = 0
          classData['gardenId'] = new Types.ObjectId(gardenId)
          classData['courseId'] = classRequest.courseId
          classData['progress'] = new BaseProgressDto(_.get(classData, ['duration']) * 2, 0)

          // generate deadline for assignments
          let sessions = _.get(classRequest, 'metadata.sessions') as Session[]
          classData['sessions'] = this.generateDeadlineClassAssignment({ sessions, startDate, duration, weekdays })

          const createdClass = await this.classService.create(classData, { session })

          // gen slots for class
          await this.gardenTimesheetService.generateSlotsForClass(
            {
              startDate,
              duration,
              weekdays,
              slotNumbers,
              gardenId: new Types.ObjectId(gardenId),
              instructorId: course.instructorId,
              classId: new Types.ObjectId(createdClass._id),
              metadata: { code: createdClass.code, title: createdClass.title },
              courseData: course
            },
            { session }
          )

          if (course.status === CourseStatus.DRAFT) {
            // update course report
            this.updateCourseReportWhenPublishClassRequestApproved({ instructorId: createdClass.instructorId })
          }

          // update class report
          this.updateClassReportWhenPublishClassRequestApproved({ instructorId: createdClass.instructorId })
        })
      } finally {
        await session.endSession()
      }
    } else if (classRequest.type === ClassRequestType.CANCEL_CLASS) {
      // validate class
      const courseClass = await this.classService.findById(classRequest.classId?.toString())
      if (!courseClass) throw new AppException(Errors.CLASS_NOT_FOUND)
      if (courseClass.status !== ClassStatus.PUBLISHED) throw new AppException(Errors.CLASS_STATUS_INVALID)

      // BR-41: A cancel-class request can only be created if the class has no learners enrolled.
      const learnerClasses = await this.learnerClassService.findMany({
        classId: courseClass._id
      })
      if (learnerClasses.length > 0) throw new AppException(Errors.CANCEL_CLASS_REQUEST_CAN_NOT_BE_APPROVED)

      // Execute in transaction
      const session = await this.connection.startSession()
      try {
        await session.withTransaction(async () => {
          // update class request
          await this.classRequestRepository.findOneAndUpdate(
            { _id: classRequestId },
            {
              $set: {
                status: ClassRequestStatus.APPROVED
              },
              $push: {
                histories: {
                  status: ClassRequestStatus.APPROVED,
                  timestamp: new Date(),
                  userId: new Types.ObjectId(_id),
                  userRole: role
                }
              }
            },
            { session }
          )

          // cancel class
          await this.classService.update(
            { _id: new Types.ObjectId(courseClass._id) },
            {
              $set: {
                status: ClassStatus.CANCELED,
                cancelReason: classRequest.description
              },
              $push: {
                histories: {
                  status: ClassStatus.CANCELED,
                  timestamp: new Date(),
                  userId: new Types.ObjectId(courseClass.instructorId),
                  userRole: UserRole.INSTRUCTOR
                }
              }
            },
            { new: true, session }
          )

          // clear class timesheet
          const { startDate, duration, weekdays, gardenId } = courseClass
          const startOfDate = moment(startDate).tz(VN_TIMEZONE).startOf('date')
          const endOfDate = startOfDate.clone().add(duration, 'week').startOf('date')
          const searchDates = []
          let currentDate = startOfDate.clone()
          while (currentDate.isSameOrBefore(endOfDate)) {
            for (let weekday of weekdays) {
              const searchDate = currentDate.clone().isoWeekday(weekday)
              if (searchDate.isSameOrAfter(startOfDate) && searchDate.isBefore(endOfDate)) {
                searchDates.push(searchDate.toDate())
              }
            }
            currentDate.add(1, 'week')
          }

          await this.gardenTimesheetService.updateMany(
            {
              date: {
                $in: searchDates
              },
              status: GardenTimesheetStatus.ACTIVE,
              gardenId: gardenId
            },
            {
              $pull: {
                slots: { classId: new Types.ObjectId(courseClass._id) }
              }
            },
            { session }
          )

          // update class report
          this.updateClassReportWhenCancelClassRequestApproved({
            instructorId: courseClass.instructorId,
            status: courseClass.status
          })
        })
      } finally {
        await session.endSession()
      }
    }

    // send notification to instructor
    this.notificationService.sendFirebaseCloudMessaging({
      title: 'Your class request has been approved',
      body:
        classRequest.type === ClassRequestType.PUBLISH_CLASS
          ? 'Class has been published. Click to view details.'
          : 'Class has been cancelled. Click to view details.',
      receiverIds: [classRequest.createdBy.toString()],
      data: {
        type: FCMNotificationDataType.CLASS_REQUEST,
        id: classRequestId
      }
    })

    this.queueProducerService.removeJob(QueueName.CLASS_REQUEST, classRequestId)

    // update class request report
    this.reportService.update(
      { type: ReportType.ClassRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(classRequest.createdBy) },
      {
        $inc: {
          [`data.${ClassRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )

    return new SuccessResponse(true)
  }

  async rejectClassRequest(
    classRequestId: string,
    RejectClassRequestDto: RejectClassRequestDto,
    userAuth: UserAuth
  ): Promise<SuccessResponse> {
    const { rejectReason } = RejectClassRequestDto
    const { _id, role } = userAuth

    // validate class request
    const classRequest = await this.findById(classRequestId)
    if (!classRequest) throw new AppException(Errors.CLASS_REQUEST_NOT_FOUND)
    if (classRequest.status !== ClassRequestStatus.PENDING) throw new AppException(Errors.CLASS_REQUEST_STATUS_INVALID)

    if (classRequest.type === ClassRequestType.PUBLISH_CLASS) {
      // validate course
      const course = await this.courseService.findById(classRequest.courseId?.toString())
      if (!course) throw new AppException(Errors.COURSE_NOT_FOUND)
      if (course.status === CourseStatus.DELETED) throw new AppException(Errors.COURSE_STATUS_INVALID)

      // Execute in transaction
      const session = await this.connection.startSession()
      try {
        await session.withTransaction(async () => {
          // update class request
          await this.update(
            { _id: classRequestId },
            {
              $set: {
                status: ClassRequestStatus.REJECTED,
                rejectReason
              },
              $push: {
                histories: {
                  status: ClassRequestStatus.REJECTED,
                  timestamp: new Date(),
                  userId: new Types.ObjectId(_id),
                  userRole: role
                }
              }
            },
            { session }
          )

          // update course
          await this.courseService.update(
            { _id: classRequest.courseId },
            {
              $set: {
                isRequesting: false
              }
            },
            { session }
          )
        })
      } finally {
        await session.endSession()
      }
    } else if (classRequest.type === ClassRequestType.CANCEL_CLASS) {
      // validate class
      const courseClass = await this.classService.findById(classRequest.classId?.toString())
      if (!courseClass) throw new AppException(Errors.CLASS_NOT_FOUND)

      // Execute in transaction
      const session = await this.connection.startSession()
      try {
        await session.withTransaction(async () => {
          // update class request
          await this.update(
            { _id: classRequestId },
            {
              $set: {
                status: ClassRequestStatus.REJECTED,
                rejectReason
              },
              $push: {
                histories: {
                  status: ClassRequestStatus.REJECTED,
                  timestamp: new Date(),
                  userId: new Types.ObjectId(_id),
                  userRole: role
                }
              }
            },
            { session }
          )
        })
      } finally {
        await session.endSession()
      }
    }

    // send notification to instructor
    this.notificationService.sendFirebaseCloudMessaging({
      title: 'Your class request has been rejected',
      body:
        classRequest.type === ClassRequestType.PUBLISH_CLASS
          ? 'Class publication request was not approved. Click to view details.'
          : 'Class cancellation request was not approved. Click to view details.',
      receiverIds: [classRequest.createdBy.toString()],
      data: {
        type: FCMNotificationDataType.CLASS_REQUEST,
        id: classRequestId
      }
    })
    this.queueProducerService.removeJob(QueueName.CLASS_REQUEST, classRequestId)

    // update class request report
    this.reportService.update(
      { type: ReportType.ClassRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(classRequest.createdBy) },
      {
        $inc: {
          [`data.${ClassRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )
    return new SuccessResponse(true)
  }

  async expirePublishClassRequest(classRequestId: string, userAuth: UserAuth): Promise<SuccessResponse> {
    const { _id, role } = userAuth

    // validate class request
    const classRequest = await this.findById(classRequestId)
    if (!classRequest || classRequest.type !== ClassRequestType.PUBLISH_CLASS)
      throw new AppException(Errors.CLASS_REQUEST_NOT_FOUND)
    if (classRequest.status !== ClassRequestStatus.PENDING) throw new AppException(Errors.CLASS_REQUEST_STATUS_INVALID)

    // validate course
    const course = await this.courseService.findById(classRequest.courseId?.toString())
    if (!course) throw new AppException(Errors.COURSE_NOT_FOUND)
    if (course.status === CourseStatus.DELETED) throw new AppException(Errors.COURSE_STATUS_INVALID)

    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        // update class request
        await this.update(
          { _id: classRequestId },
          {
            $set: {
              status: ClassRequestStatus.EXPIRED
            },
            $push: {
              histories: {
                status: ClassRequestStatus.EXPIRED,
                timestamp: new Date(),
                userRole: role
              }
            }
          },
          { session }
        )

        // update course
        await this.courseService.update(
          { _id: classRequest.courseId },
          {
            $set: {
              isRequesting: false
            }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }
    // send notification to instructor
    this.notificationService.sendFirebaseCloudMessaging({
      title: 'Your class request has expired',
      body: 'Class publication request has expired. Click to view details.',
      receiverIds: [classRequest.createdBy.toString()],
      data: {
        type: FCMNotificationDataType.CLASS_REQUEST,
        id: classRequestId
      }
    })

    // update class request report
    this.reportService.update(
      { type: ReportType.ClassRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(classRequest.createdBy) },
      {
        $inc: {
          [`data.${ClassRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )
    return new SuccessResponse(true)
  }

  async expireCancelClassRequest(classRequestId: string, userAuth: UserAuth): Promise<SuccessResponse> {
    const { _id, role } = userAuth

    // validate class request
    const classRequest = await this.findById(classRequestId)
    if (!classRequest || classRequest.type !== ClassRequestType.CANCEL_CLASS)
      throw new AppException(Errors.CLASS_REQUEST_NOT_FOUND)
    if (classRequest.status !== ClassRequestStatus.PENDING) throw new AppException(Errors.CLASS_REQUEST_STATUS_INVALID)

    // validate class
    const courseClass = await this.classService.findById(classRequest.classId?.toString())
    if (!courseClass) throw new AppException(Errors.CLASS_NOT_FOUND)

    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        // update class request
        await this.update(
          { _id: classRequestId },
          {
            $set: {
              status: ClassRequestStatus.EXPIRED
            },
            $push: {
              histories: {
                status: ClassRequestStatus.EXPIRED,
                timestamp: new Date(),
                userRole: role
              }
            }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }
    // send notification to instructor
    this.notificationService.sendFirebaseCloudMessaging({
      title: 'Your class request has expired',
      body: 'Class cancellation request has expired. Click to view details.',
      receiverIds: [classRequest.createdBy.toString()],
      data: {
        type: FCMNotificationDataType.CLASS_REQUEST,
        id: classRequestId
      }
    })

    // update class request report
    this.reportService.update(
      { type: ReportType.ClassRequestSum, tag: ReportTag.User, ownerId: new Types.ObjectId(classRequest.createdBy) },
      {
        $inc: {
          [`data.${ClassRequestStatus.PENDING}.quantity`]: -1
        }
      }
    )
    return new SuccessResponse(true)
  }

  async getExpiredAt(date: Date): Promise<Date> {
    const classRequestAutoExpiration = await this.settingService.findByKey(SettingKey.ClassRequestAutoExpiration)
    const dateMoment = moment.tz(date, VN_TIMEZONE)
    const expiredDate = dateMoment.clone().add(Number(classRequestAutoExpiration.value) || 2, 'day')
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

  async addClassRequestAutoExpiredJob(classRequest: ClassRequest) {
    try {
      const expiredAt = await this.getExpiredAt(classRequest['createdAt'])
      const delayTime = this.helperService.getDiffTimeByMilliseconds(expiredAt)

      await this.queueProducerService.addJob(
        QueueName.CLASS_REQUEST,
        JobName.ClassRequestAutoExpired,
        {
          classRequestId: classRequest._id,
          expiredAt
        },
        {
          delay: delayTime,
          jobId: classRequest._id.toString()
        }
      )
    } catch (err) {
      this.appLogger.error(JSON.stringify(err))
    }
  }

  private generateDeadlineClassAssignment(params: {
    sessions: Session[]
    startDate: Date
    duration: number
    weekdays: Weekday[]
  }) {
    const { sessions, startDate, duration, weekdays } = params
    const startOfDate = moment(startDate).tz(VN_TIMEZONE).startOf('date')
    const endOfDate = startOfDate.clone().add(duration, 'week').startOf('date')

    const classDates = [] as Date[]
    let currentDate = startOfDate.clone()
    while (currentDate.isSameOrBefore(endOfDate)) {
      for (let weekday of weekdays) {
        const classDate = currentDate.clone().isoWeekday(weekday)
        if (classDate.isSameOrAfter(startOfDate) && classDate.isBefore(endOfDate)) {
          classDates.push(classDate.toDate())
        }
      }
      currentDate.add(1, 'week')
    }
    const classEndOfDate = moment(classDates[classDates.length - 1])
      .tz(VN_TIMEZONE)
      .endOf('date')

    return sessions?.map((session) => {
      if (session?.assignments?.length > 0) {
        const sessionStartDate = classDates[session.sessionNumber - 1]
        const assignmentDeadline = moment(sessionStartDate).tz(VN_TIMEZONE).add(7, 'day').endOf('date')
        const deadline = assignmentDeadline.isAfter(classEndOfDate) ? classEndOfDate : assignmentDeadline
        session.assignments = session.assignments.map((assignment) => ({ ...assignment, deadline: deadline.toDate() }))
      }
      return session
    })
  }

  private async sendNotificationToStaffWhenClassRequestIsCreated({ classRequest }) {
    const staffs = await this.staffService.findMany({
      status: StaffStatus.ACTIVE,
      role: UserRole.STAFF
    })
    const staffIds = staffs.map((staff) => staff._id.toString())
    await this.notificationService.sendTopicFirebaseCloudMessaging({
      title: 'New class request created',
      body:
        classRequest.type === ClassRequestType.PUBLISH_CLASS
          ? 'A class publication request was recently created. Click to view details.'
          : 'A class cancellation request was recently created. Click to view details.',
      receiverIds: staffIds,
      data: {
        type: FCMNotificationDataType.CLASS_REQUEST,
        id: classRequest._id.toString()
      },
      topic: 'STAFF_NOTIFICATION_TOPIC'
    })
  }

  private updateCourseReportWhenPublishClassRequestApproved({ instructorId }) {
    this.reportService.update(
      { type: ReportType.CourseSum, tag: ReportTag.System },
      {
        $inc: {
          'data.quantity': 1
        }
      }
    )

    // update course sum by month report
    const month = new Date().getMonth() + 1
    const year = new Date().getFullYear()
    this.reportService.update(
      { type: ReportType.CourseSumByMonth, tag: ReportTag.System, 'data.year': year },
      {
        $inc: {
          [`data.${month}.quantity`]: 1
        }
      }
    )

    // update course report
    this.reportService.update(
      { type: ReportType.CourseSum, tag: ReportTag.User, ownerId: new Types.ObjectId(instructorId) },
      {
        $inc: {
          [`data.${CourseStatus.ACTIVE}.quantity`]: 1
        }
      }
    )
  }

  private updateClassReportWhenPublishClassRequestApproved({ instructorId }) {
    // update class report
    this.reportService.update(
      { type: ReportType.ClassSum, tag: ReportTag.System },
      {
        $inc: {
          'data.quantity': 1,
          [`data.${ClassStatus.PUBLISHED}.quantity`]: 1
        }
      }
    )

    this.reportService.update(
      { type: ReportType.ClassSum, tag: ReportTag.User, ownerId: new Types.ObjectId(instructorId) },
      {
        $inc: {
          'data.quantity': 1,
          [`data.${ClassStatus.PUBLISHED}.quantity`]: 1
        }
      }
    )
  }

  private updateClassReportWhenCancelClassRequestApproved({ instructorId, status }) {
    // update class report
    this.reportService.update(
      { type: ReportType.ClassSum, tag: ReportTag.System },
      {
        $inc: {
          [`data.${status}.quantity`]: -1,
          [`data.${ClassStatus.CANCELED}.quantity`]: 1
        }
      }
    )

    this.reportService.update(
      { type: ReportType.ClassSum, tag: ReportTag.User, ownerId: new Types.ObjectId(instructorId) },
      {
        $inc: {
          [`data.${status}.quantity`]: -1,
          [`data.${ClassStatus.CANCELED}.quantity`]: 1
        }
      }
    )
  }
}
