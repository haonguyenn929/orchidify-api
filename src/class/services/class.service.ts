import { Injectable, Inject } from '@nestjs/common'
import * as _ from 'lodash'
import * as moment from 'moment-timezone'
import { IClassRepository } from '@src/class/repositories/class.repository'
import { Class, ClassDocument } from '@src/class/schemas/class.schema'
import {
  ClientSession,
  Connection,
  FilterQuery,
  PopulateOptions,
  QueryOptions,
  SaveOptions,
  Types,
  UpdateQuery
} from 'mongoose'
import { CreateClassDto } from '@class/dto/create-class.dto'
import {
  ClassStatus,
  CourseLevel,
  CourseStatus,
  GardenTimesheetStatus,
  LearnerStatus,
  SlotNumber,
  SlotStatus,
  TransactionStatus,
  UserRole,
  Weekday
} from '@common/contracts/constant'
import { PaginationParams } from '@common/decorators/pagination.decorator'
import { CLASS_LIST_PROJECTION } from '@src/class/contracts/constant'
import { QueryClassDto } from '@src/class/dto/view-class.dto'
import { InjectConnection } from '@nestjs/mongoose'
import { CreateMomoPaymentDto, CreateMomoPaymentResponse } from '@src/transaction/dto/momo-payment.dto'
import { PaymentMethod, StripeStatus, TransactionType } from '@src/transaction/contracts/constant'
import { ConfigService } from '@nestjs/config'
import { IPaymentService } from '@src/transaction/services/payment.service'
import { EnrollClassDto } from '@class/dto/enroll-class.dto'
import { AppException } from '@common/exceptions/app.exception'
import { Errors } from '@common/contracts/error'
import { ILearnerService } from '@learner/services/learner.service'
import { ITransactionService } from '@transaction/services/transaction.service'
import { BasePaymentDto } from '@transaction/dto/base.transaction.dto'
import { ILearnerClassService } from './learner-class.service'
import { MIN_PRICE, VN_TIMEZONE } from '@src/config'
import { IGardenTimesheetService } from '@garden-timesheet/services/garden-timesheet.service'
import { GardenTimesheetDocument } from '@garden-timesheet/schemas/garden-timesheet.schema'
import { CreateStripePaymentDto } from '@transaction/dto/stripe-payment.dto'
import { UserAuth } from '@common/contracts/dto'
import { ISettingService } from '@setting/services/setting.service'
import { SettingKey } from '@setting/contracts/constant'
import { IInstructorService } from '@instructor/services/instructor.service'
import { CancelClassDto } from '@class/dto/cancel-class.dto'
import { INotificationService } from '@notification/services/notification.service'
import { FCMNotificationDataType } from '@notification/contracts/constant'
import { ICourseService } from '@course/services/course.service'
import { Course } from '@course/schemas/course.schema'
import { ReportTag, ReportType } from '@report/contracts/constant'
import { IReportService } from '@report/services/report.service'

export const IClassService = Symbol('IClassService')

export interface IClassService {
  create(courseClass: CreateClassDto, options?: SaveOptions | undefined): Promise<ClassDocument>
  findById(
    classId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<ClassDocument>
  update(
    conditions: FilterQuery<Class>,
    payload: UpdateQuery<Class>,
    options?: QueryOptions | undefined
  ): Promise<ClassDocument>
  listByInstructor(instructorId: string, pagination: PaginationParams, queryClassDto: QueryClassDto)
  listByStaff(pagination: PaginationParams, queryClassDto: QueryClassDto)
  findManyByStatus(status: ClassStatus[]): Promise<ClassDocument[]>
  findManyByInstructorIdAndStatus(instructorId: string, status: ClassStatus[]): Promise<ClassDocument[]>
  findManyByGardenIdAndStatus(gardenId: string, status: ClassStatus[]): Promise<ClassDocument[]>
  findMany(
    conditions: FilterQuery<ClassDocument>,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<ClassDocument[]>
  generateCode(): Promise<string>
  enrollClass(enrollClassDto: EnrollClassDto): Promise<CreateMomoPaymentResponse>
  completeClass(classId: string, userAuth: UserAuth): Promise<void>
  cancelClass(classId: string, cancelClassDto: CancelClassDto, userAuth: UserAuth): Promise<void>
  getClassEndTime(params: {
    startDate: Date
    duration: number
    weekdays: Weekday[]
    slotNumbers?: SlotNumber[]
  }): moment.Moment
  viewReportClassByRate(): Promise<any[]>
}

@Injectable()
export class ClassService implements IClassService {
  constructor(
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
    @InjectConnection() readonly connection: Connection,
    @Inject(IClassRepository)
    private readonly classRepository: IClassRepository,
    private readonly configService: ConfigService,
    @Inject(IPaymentService)
    private readonly paymentService: IPaymentService,
    @Inject(ITransactionService)
    private readonly transactionService: ITransactionService,
    @Inject(ILearnerService)
    private readonly learnerService: ILearnerService,
    @Inject(ILearnerClassService)
    private readonly learnerClassService: ILearnerClassService,
    @Inject(IGardenTimesheetService)
    private readonly gardenTimesheetService: IGardenTimesheetService,
    @Inject(ISettingService)
    private readonly settingService: ISettingService,
    @Inject(IInstructorService)
    private readonly instructorService: IInstructorService,
    @Inject(ICourseService)
    private readonly courseService: ICourseService,
    @Inject(IReportService)
    private readonly reportService: IReportService
  ) {}

  public async create(createClassDto: CreateClassDto, options?: SaveOptions | undefined) {
    const courseClass = await this.classRepository.create(createClassDto, options)
    return courseClass
  }

  public async findById(
    classId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const courseClass = await this.classRepository.findOne({
      conditions: {
        _id: classId
      },
      projection,
      populates
    })
    return courseClass
  }

  public update(conditions: FilterQuery<Class>, payload: UpdateQuery<Class>, options?: QueryOptions | undefined) {
    return this.classRepository.findOneAndUpdate(conditions, payload, options)
  }

  async listByInstructor(
    instructorId: string,
    pagination: PaginationParams,
    queryClassDto: QueryClassDto,
    projection = CLASS_LIST_PROJECTION
  ) {
    const { title, type, level, status } = queryClassDto
    const filter: Record<string, any> = {
      instructorId: new Types.ObjectId(instructorId)
    }

    const validLevel = level?.filter((level) =>
      [CourseLevel.BASIC, CourseLevel.INTERMEDIATE, CourseLevel.ADVANCED].includes(level)
    )
    if (validLevel?.length > 0) {
      filter['level'] = {
        $in: validLevel
      }
    }

    const validStatus = status?.filter((status) =>
      [ClassStatus.PUBLISHED, ClassStatus.IN_PROGRESS, ClassStatus.COMPLETED, ClassStatus.CANCELED].includes(status)
    )
    if (validStatus?.length > 0) {
      filter['status'] = {
        $in: validStatus
      }
    }

    if (title) {
      filter['$text'] = {
        $search: title
      }
    }

    if (type) {
      filter['type'] = type
    }

    return this.classRepository.model.paginate(filter, {
      ...pagination,
      populate: [
        {
          path: 'course',
          select: ['code']
        }
      ],
      projection
    })
  }

  async listByStaff(pagination: PaginationParams, queryClassDto: QueryClassDto, projection = CLASS_LIST_PROJECTION) {
    const { title, type, level, status } = queryClassDto
    const filter: Record<string, any> = {}

    const validLevel = level?.filter((level) =>
      [CourseLevel.BASIC, CourseLevel.INTERMEDIATE, CourseLevel.ADVANCED].includes(level)
    )
    if (validLevel?.length > 0) {
      filter['level'] = {
        $in: validLevel
      }
    }

    const validStatus = status?.filter((status) =>
      [ClassStatus.PUBLISHED, ClassStatus.IN_PROGRESS, ClassStatus.COMPLETED, ClassStatus.CANCELED].includes(status)
    )
    if (validStatus?.length > 0) {
      filter['status'] = {
        $in: validStatus
      }
    }

    if (title) {
      filter['$text'] = {
        $search: title
      }
    }

    if (type) {
      filter['type'] = type
    }

    return this.classRepository.model.paginate(filter, {
      ...pagination,
      projection,
      populate: [
        {
          path: 'course',
          select: ['code']
        },
        {
          path: 'instructor',
          select: ['name']
        }
      ]
    })
  }

  async findManyByStatus(status: ClassStatus[]): Promise<ClassDocument[]> {
    const courseClasses = await this.classRepository.findMany({
      conditions: {
        status: {
          $in: status
        }
      }
    })
    return courseClasses
  }

  async findManyByInstructorIdAndStatus(instructorId: string, status: ClassStatus[]): Promise<ClassDocument[]> {
    const courseClasses = await this.classRepository.findMany({
      conditions: {
        instructorId: new Types.ObjectId(instructorId),
        status: {
          $in: status
        }
      }
    })
    return courseClasses
  }

  async findManyByGardenIdAndStatus(gardenId: string, status: ClassStatus[]): Promise<ClassDocument[]> {
    const courseClasses = await this.classRepository.findMany({
      conditions: {
        gardenId: new Types.ObjectId(gardenId),
        status: {
          $in: status
        }
      }
    })
    return courseClasses
  }

  public async findMany(
    conditions: FilterQuery<ClassDocument>,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const courseClasses = await this.classRepository.findMany({
      conditions,
      projection,
      populates
    })
    return courseClasses
  }

  public async generateCode(): Promise<string> {
    // Generate ORCHIDxxx format data
    const prefix = `ORCHID`
    // Find the latest entry with the same date prefix
    const lastRecord = await this.classRepository.model.findOne().sort({ createdAt: -1 })
    const number = parseInt(_.get(lastRecord, 'code', `${prefix}000`).split(prefix)[1]) + 1
    return `${prefix}${number.toString().padStart(3, '0')}`
  }

  public async enrollClass(enrollClassDto: EnrollClassDto) {
    const { classId, paymentMethod, learnerId, requestType = 'captureWallet' } = enrollClassDto

    // 1. Validate class, learner, learnerClass(learner had enrolled class before)
    const [learner, courseClass, enrolledLearnerClass] = await Promise.all([
      this.learnerService.findById(learnerId?.toString()),
      this.findById(classId?.toString()),
      this.learnerClassService.findOneBy({
        learnerId: new Types.ObjectId(learnerId),
        classId: new Types.ObjectId(classId)
      })
    ])
    if (learner.status === LearnerStatus.UNVERIFIED) throw new AppException(Errors.UNVERIFIED_ACCOUNT)
    if (learner.status === LearnerStatus.INACTIVE) throw new AppException(Errors.INACTIVE_ACCOUNT)
    if (!courseClass) throw new AppException(Errors.CLASS_NOT_FOUND)
    if (courseClass.status !== ClassStatus.PUBLISHED) throw new AppException(Errors.CLASS_STATUS_INVALID)
    if (courseClass.learnerQuantity >= courseClass.learnerLimit) throw new AppException(Errors.CLASS_LEARNER_LIMIT)
    if (enrolledLearnerClass) throw new AppException(Errors.LEARNER_CLASS_EXISTED)

    // Check duplicate timesheet with enrolled class
    await this.checkDuplicateTimesheetWithMyClasses({ courseClass, learnerId: learnerId.toString() })

    const MAX_VALUE = 9_007_199_254_740_991
    const MIN_VALUE = 1_000_000_000_000_000
    const orderCode = Math.floor(MIN_VALUE + Math.random() * (MAX_VALUE - MIN_VALUE))
    const orderInfo = `Orchidify - Payment for order #${orderCode}`

    // get discount and finalPrice
    const [course, learnerClasses] = await Promise.all([
      this.courseService.findById(courseClass.courseId.toString(), undefined, [
        {
          path: 'combos',
          select: ['childCourseIds', 'discount'],
          match: { status: CourseStatus.ACTIVE }
        }
      ]),
      this.learnerClassService.findMany({
        learnerId: new Types.ObjectId(learnerId)
      })
    ])
    const learnedCourseIdSet = new Set(learnerClasses.map((learnerClass) => learnerClass.courseId.toString()))

    const courseData = course.toObject()
    const combos = _.get(courseData, 'combos') as Course[]
    let discount = 0
    if (combos.length !== 0) {
      const clonedCourseIdSet = new Set([...learnedCourseIdSet])
      clonedCourseIdSet.delete(course._id.toString())
      for (const combo of combos) {
        const matchedCourseIds = combo.childCourseIds.filter((childCourseId) => {
          return childCourseId.toString() !== course._id.toString() && clonedCourseIdSet.has(childCourseId.toString())
        })
        if (matchedCourseIds.length > 0) {
          const newDiscount = combo.discount
          discount = newDiscount > discount ? newDiscount : discount
        }
      }
    }
    const price = _.get(courseData, 'price')
    let finalPrice = Math.round((price * (100 - discount)) / 100)
    finalPrice = finalPrice < MIN_PRICE ? MIN_PRICE : finalPrice

    // Execute in transaction
    const session = await this.connection.startSession()
    let paymentResponse
    try {
      await session.withTransaction(async () => {
        // 2. Process transaction
        switch (paymentMethod) {
          case PaymentMethod.MOMO:
            this.paymentService.setStrategy(PaymentMethod.MOMO)
            const createMomoPaymentDto: CreateMomoPaymentDto = {
              partnerName: 'ORCHIDIFY',
              orderInfo,
              redirectUrl: `${this.configService.get('WEB_URL')}/payment`,
              ipnUrl: `${this.configService.get('SERVER_URL')}/transactions/payment/webhook/momo`,
              requestType,
              amount: finalPrice,
              orderId: orderCode.toString(),
              requestId: orderCode.toString(),
              extraData: JSON.stringify({ classId, learnerId, price, discount }),
              autoCapture: true,
              lang: 'vi',
              orderExpireTime: 30
            }
            paymentResponse = await this.processPaymentWithMomo({
              createMomoPaymentDto,
              orderInfo,
              courseClass,
              orderCode,
              learnerId,
              paymentMethod,
              session
            })
            break
          case PaymentMethod.ZALO_PAY:
          case PaymentMethod.PAY_OS:
          case PaymentMethod.STRIPE:
          default:
            this.paymentService.setStrategy(PaymentMethod.STRIPE)
            const createStripePaymentDto: CreateStripePaymentDto = {
              customerEmail: learner.email,
              description: orderInfo,
              amount: finalPrice,
              // orderId: orderCode.toString(),
              metadata: { classId: classId.toString(), learnerId: learnerId.toString(), orderCode, price, discount }
            }
            paymentResponse = await this.processPaymentWithStripe({
              createStripePaymentDto,
              orderInfo,
              courseClass,
              orderCode,
              learnerId,
              paymentMethod,
              session
            })
            break
        }
      })
      return paymentResponse
    } finally {
      await session.endSession()
    }
  }

  private async checkDuplicateTimesheetWithMyClasses(params: { courseClass: Class; learnerId: string }) {
    const { courseClass, learnerId } = params

    const { startDate, duration, weekdays, slotNumbers } = courseClass
    const startOfDate = moment(startDate).tz(VN_TIMEZONE).startOf('date')
    const endOfDate = startOfDate.clone().add(duration, 'week').startOf('date')

    const classDates = []
    let currentDate = startOfDate.clone()
    while (currentDate.isSameOrBefore(endOfDate)) {
      for (let weekday of weekdays) {
        const searchDate = currentDate.clone().isoWeekday(weekday)
        if (searchDate.isSameOrAfter(startOfDate) && searchDate.isBefore(endOfDate)) {
          classDates.push(searchDate.toDate())
        }
      }
      currentDate.add(1, 'week')
    }

    const learnerClasses = await this.learnerClassService.findMany({
      learnerId: new Types.ObjectId(learnerId)
    })
    const classIds = learnerClasses.map((learnerClass) => learnerClass.classId)

    const timesheets = await this.gardenTimesheetService.findMany({
      date: { $in: classDates },
      'slots.classId': {
        $in: classIds
      }
    })

    const notAvailableSlots = this.getNotAvailableSlots(
      timesheets,
      classIds.map((classId) => classId.toString()),
      slotNumbers
    )
    if (notAvailableSlots.length > 0) throw new AppException(Errors.CLASS_TIMESHEET_INVALID)
  }

  private getNotAvailableSlots(timesheets: GardenTimesheetDocument[], classIds: string[], slotNumbers: SlotNumber[]) {
    const calendars = []
    for (const timesheet of timesheets) {
      for (const slot of timesheet.slots) {
        if (
          slot.status === SlotStatus.NOT_AVAILABLE &&
          classIds.includes(slot.classId.toString()) &&
          slotNumbers.includes(slot.slotNumber)
        ) {
          _.set(slot, 'gardenMaxClass', timesheet.gardenMaxClass)
          calendars.push(slot)
        }
      }
    }
    return calendars
  }

  private async processPaymentWithMomo(params: {
    createMomoPaymentDto: CreateMomoPaymentDto
    orderInfo: string
    courseClass: Class
    orderCode: number
    learnerId: Types.ObjectId
    paymentMethod: PaymentMethod
    session: ClientSession
  }) {
    const { createMomoPaymentDto, orderInfo, courseClass, orderCode, learnerId, paymentMethod, session } = params
    const paymentResponse: CreateMomoPaymentResponse = await this.paymentService.createTransaction(createMomoPaymentDto)

    // 3. Create transaction
    const transaction = await this.paymentService.getTransaction({
      orderId: paymentResponse.orderId,
      requestId: paymentResponse.requestId,
      lang: 'vi'
    })
    const paymentPayload = {
      id: transaction?.transId?.toString(),
      code: orderCode.toString(),
      createdAt: new Date(),
      status: transaction?.resultCode?.toString(),
      ...transaction
    }
    const payment: BasePaymentDto = {
      ...paymentPayload,
      histories: [paymentPayload]
    }
    await this.transactionService.create(
      {
        type: TransactionType.PAYMENT,
        paymentMethod,
        amount: createMomoPaymentDto.amount,
        debitAccount: { userId: learnerId, userRole: UserRole.LEARNER },
        creditAccount: { userRole: 'SYSTEM' as UserRole },
        description: orderInfo,
        status: TransactionStatus.DRAFT,
        payment
      },
      {
        session
      }
    )
    return paymentResponse
  }

  private async processPaymentWithStripe(params: {
    createStripePaymentDto: CreateStripePaymentDto
    orderInfo: string
    courseClass: Class
    orderCode: number
    learnerId: Types.ObjectId
    paymentMethod: PaymentMethod
    session: ClientSession
  }) {
    const { createStripePaymentDto, orderInfo, orderCode, learnerId, paymentMethod, session } = params
    const paymentResponse = await this.paymentService.createTransaction(createStripePaymentDto)
    // 3. Create transaction
    const transaction = await this.paymentService.getTransaction({
      id: paymentResponse?.id
    })
    const paymentPayload = {
      id: transaction?.id,
      code: orderCode.toString(),
      createdAt: new Date(),
      status: transaction?.status,
      ...transaction
    }
    const payment: BasePaymentDto = {
      ...paymentPayload,
      histories: [paymentPayload]
    }
    await this.transactionService.create(
      {
        type: TransactionType.PAYMENT,
        paymentMethod,
        amount: createStripePaymentDto.amount,
        debitAccount: { userId: learnerId, userRole: UserRole.LEARNER },
        creditAccount: { userRole: 'SYSTEM' as UserRole },
        description: orderInfo,
        status: TransactionStatus.DRAFT,
        payment
      },
      {
        session
      }
    )
    return paymentResponse
  }

  public async completeClass(classId: string, userAuth: UserAuth): Promise<void> {
    const { _id, role } = userAuth
    // Execute in transaction
    const session = await this.connection.startSession()
    let courseClass: Class
    try {
      await session.withTransaction(async () => {
        // 1. complete class
        courseClass = await this.update(
          { _id: new Types.ObjectId(classId) },
          {
            $set: {
              status: ClassStatus.COMPLETED
            },
            $push: {
              histories: {
                status: ClassStatus.COMPLETED,
                timestamp: new Date(),
                userId: new Types.ObjectId(_id),
                userRole: role
              }
            }
          },
          { new: true, session }
        )

        // 2. process earnings for instructor
        // BR-53: Once the staff completes the class, the earnings will be settled (transferred to the balance) for the instructor.
        let totalPrice: number = 0
        const learnerClasses = await this.learnerClassService.findMany({ classId: new Types.ObjectId(classId) }, [
          'learnerId',
          'classId',
          'price',
          'discount'
        ])
        learnerClasses.forEach((learnerClass) => {
          const price = learnerClass.price || 0
          const discount = learnerClass.discount || 0
          totalPrice += (price * (100 - discount)) / 100
        })

        const commissionRate = Number((await this.settingService.findByKey(SettingKey.CommissionRate))?.value) || 0.2
        const { instructorId } = courseClass
        const earnings = Math.floor(totalPrice * (1 - commissionRate))
        const systemEarnings = totalPrice - earnings
        await this.instructorService.update(
          { _id: instructorId },
          {
            $inc: { balance: earnings }
          },
          { session }
        )

        // update class report
        this.updateClassReportWhenClassCompleted({ instructorId: courseClass.instructorId })

        // update revenue report
        this.updateRevenueReportWhenClassCompleted({
          instructorId,
          earnings,
          systemEarnings
        })
      })
    } finally {
      await session.endSession()
    }

    // send notification for instructor
    this.notificationService.sendFirebaseCloudMessaging({
      title: `Class ${courseClass.code} has completed`,
      body: `Class ${courseClass.code}: ${courseClass.title} has completed. The payment has been added to your balance.`,
      receiverIds: [courseClass.instructorId.toString()],
      data: {
        type: FCMNotificationDataType.CLASS,
        id: classId
      }
    })
  }

  public getClassEndTime(params: {
    startDate: Date
    duration: number
    weekdays: Weekday[]
    slotNumbers?: SlotNumber[]
  }): moment.Moment {
    const { startDate, duration, weekdays, slotNumbers } = params
    const startOfDate = moment(startDate).tz(VN_TIMEZONE).startOf('date')
    const endOfDate = startOfDate.clone().add(duration, 'week').startOf('date')

    const classDates: moment.Moment[] = []
    let currentDate = startOfDate.clone()
    while (currentDate.isSameOrBefore(endOfDate)) {
      for (let weekday of weekdays) {
        const classDate = currentDate.clone().isoWeekday(weekday)
        if (classDate.isSameOrAfter(startOfDate) && classDate.isBefore(endOfDate)) {
          classDates.push(classDate)
        }
      }
      currentDate.add(1, 'week')
    }
    let classEndTime = classDates[classDates.length - 1]
    if (!slotNumbers) return classEndTime

    switch (slotNumbers[0]) {
      case SlotNumber.ONE:
        classEndTime = classEndTime.clone().add(9, 'hour')
        break
      case SlotNumber.TWO:
        classEndTime = classEndTime.clone().add(11, 'hour').add(30, 'minute')
        break
      case SlotNumber.THREE:
        classEndTime = classEndTime.clone().add(15, 'hour')
        break
      case SlotNumber.FOUR:
        classEndTime = classEndTime.clone().add(17, 'hour').add(30, 'minute')
        break
    }
    return classEndTime
  }

  public async cancelClass(classId: string, cancelClassDto: CancelClassDto, userAuth: UserAuth): Promise<void> {
    const { cancelReason } = cancelClassDto
    const { _id, role } = userAuth
    const refundTransactionLearnerIds = []
    let courseClass: Class
    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        // cancel class
        courseClass = await this.update(
          { _id: new Types.ObjectId(classId) },
          {
            $set: {
              status: ClassStatus.CANCELED,
              cancelReason
            },
            $push: {
              histories: {
                status: ClassStatus.CANCELED,
                timestamp: new Date(),
                userId: new Types.ObjectId(_id),
                userRole: role
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
              slots: { classId: new Types.ObjectId(classId) }
            }
          },
          { session }
        )

        // refund payment
        // BR-15: When staff cancel an in-progress class or class that has enrolled learners, learners in that class will be refunded 100% of the class price including discount.
        const learnerClasses = await this.learnerClassService.findMany(
          { classId: new Types.ObjectId(classId) },
          ['learnerId', 'transactionId', 'classId'],
          [
            {
              path: 'transaction',
              select: [
                'paymentMethod',
                'payment.id',
                'payment.code',
                'payment.status',
                'payment.amount',
                'payment.object',
                'payment.payment_intent'
              ]
            }
          ]
        )
        if (learnerClasses.length === 0) return

        const refundTransactionPromises = []
        learnerClasses.forEach((learnerClass) => {
          if (_.get(learnerClass, 'transaction.paymentMethod') === PaymentMethod.STRIPE) {
            this.paymentService.setStrategy(PaymentMethod.STRIPE)
            if (_.get(learnerClass, 'transaction.payment.status') === StripeStatus.SUCCEEDED) {
              const stripePaymentObject = _.get(learnerClass, 'transaction.payment.object')
              let transactionId = ''
              if (stripePaymentObject === 'payment_intent') {
                transactionId = _.get(learnerClass, 'transaction.payment.id')
              } else if (stripePaymentObject === 'charge') {
                transactionId = _.get(learnerClass, 'transaction.payment.payment_intent')
              }
              refundTransactionPromises.push(
                this.paymentService.refundTransaction({
                  id: transactionId,
                  amount: _.get(learnerClass, 'transaction.payment.amount'),
                  metadata: {
                    classId: classId.toString(),
                    learnerId: _.get(learnerClass, 'learnerId').toString(),
                    orderCode: _.get(learnerClass, 'transaction.payment.code')
                  }
                })
              )
              refundTransactionLearnerIds.push(_.get(learnerClass, 'learnerId'))
            }
          }
        })
        await Promise.all(refundTransactionPromises)

        // update class report
        this.updateClassReportWhenClassCanceled({
          instructorId: courseClass.instructorId,
          status: courseClass.status
        })
      })
    } finally {
      await session.endSession()
    }

    // send email/notification for learners
    this.sendCancelClassNotificationForLearner(refundTransactionLearnerIds, courseClass)

    // send notification for instructor
    this.notificationService.sendFirebaseCloudMessaging({
      title: `Class ${courseClass.code} has been cancelled`,
      body: `Class ${courseClass.code}: ${courseClass.title} has been cancelled. Click to view details.`,
      receiverIds: [courseClass.instructorId.toString()],
      data: {
        type: FCMNotificationDataType.CLASS,
        id: classId
      }
    })
  }

  async viewReportClassByRate() {
    return this.classRepository.model.aggregate([
      {
        $match: {
          status: { $ne: ClassStatus.DELETED }
        }
      },
      {
        $bucket: {
          groupBy: '$rate',
          boundaries: [0, 1, 2, 3, 4, 5.1]
        }
      }
    ])
  }

  private async sendCancelClassNotificationForLearner(
    refundTransactionLearnerIds: Types.ObjectId[],
    courseClass: Class
  ) {
    const learners = await this.learnerService.findMany({
      _id: { $in: refundTransactionLearnerIds }
    })
    const sendCancelClassEmailPromises = []
    learners.forEach((learner) => {
      sendCancelClassEmailPromises.push(
        this.notificationService.sendMail({
          to: learner.email,
          subject: `[Orchidify] Class Cancellation Notice`,
          template: 'learner/cancel-class',
          context: {
            name: learner.name,
            classTitle: courseClass.title
          }
        })
      )
    })

    sendCancelClassEmailPromises.push(
      //  send notification for learners
      this.notificationService.sendFirebaseCloudMessaging({
        title: `The class you registered for has been cancelled`,
        body: `Class ${courseClass.code}: ${courseClass.title} has been cancelled. Click to view details.`,
        receiverIds: refundTransactionLearnerIds.map((learnerId) => learnerId.toString()),
        data: {
          type: FCMNotificationDataType.CLASS,
          id: courseClass._id.toString()
        }
      })
    )
    await Promise.all(sendCancelClassEmailPromises)
  }

  private updateClassReportWhenClassCompleted({ instructorId }) {
    // update class report
    this.reportService.update(
      { type: ReportType.ClassSum, tag: ReportTag.System },
      {
        $inc: {
          [`data.${ClassStatus.IN_PROGRESS}.quantity`]: -1,
          [`data.${ClassStatus.COMPLETED}.quantity`]: 1
        }
      }
    )

    this.reportService.update(
      { type: ReportType.ClassSum, tag: ReportTag.User, ownerId: new Types.ObjectId(instructorId) },
      {
        $inc: {
          [`data.${ClassStatus.IN_PROGRESS}.quantity`]: -1,
          [`data.${ClassStatus.COMPLETED}.quantity`]: 1
        }
      }
    )
  }

  private updateRevenueReportWhenClassCompleted({ instructorId, systemEarnings, earnings }) {
    // update revenue report
    this.reportService.update(
      { type: ReportType.RevenueSum, tag: ReportTag.System },
      {
        $inc: {
          'data.total': systemEarnings
        }
      }
    )

    // update revenue report
    this.reportService.update(
      { type: ReportType.RevenueSum, tag: ReportTag.User, ownerId: new Types.ObjectId(instructorId) },
      {
        $inc: {
          'data.total': earnings
        }
      }
    )

    // update revenue sum by month report
    const month = new Date().getMonth() + 1
    const year = new Date().getFullYear()
    this.reportService.update(
      {
        type: ReportType.RevenueSumByMonth,
        tag: ReportTag.System,
        'data.year': year
      },
      {
        $inc: {
          [`data.${month}.total`]: earnings
        }
      }
    )

    // update revenue sum by month report
    this.reportService.update(
      {
        type: ReportType.RevenueSumByMonth,
        tag: ReportTag.User,
        ownerId: new Types.ObjectId(instructorId),
        'data.year': year
      },
      {
        $inc: {
          [`data.${month}.total`]: earnings
        }
      }
    )
  }

  private updateClassReportWhenClassCanceled({ instructorId, status }) {
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
