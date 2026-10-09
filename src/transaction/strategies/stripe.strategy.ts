import Stripe from 'stripe'
import { IClassService } from '@class/services/class.service'
import { ILearnerClassService } from '@class/services/learner-class.service'
import { TransactionStatus } from '@common/contracts/constant'
import { Errors } from '@common/contracts/error'
import { AppException } from '@common/exceptions/app.exception'
import { BadRequestException, forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectConnection } from '@nestjs/mongoose'
import { StripeStatus, TransactionType } from '@src/transaction/contracts/constant'
import { ITransactionRepository } from '@src/transaction/repositories/transaction.repository'
import { IPaymentStrategy } from '@src/transaction/strategies/payment-strategy.interface'
import { BasePaymentDto } from '@transaction/dto/base.transaction.dto'
import { get } from 'lodash'
import { Connection, Types } from 'mongoose'
import { ILearnerService } from '@learner/services/learner.service'
import {
  CreateStripePaymentDto,
  QueryStripePaymentDto,
  RefundStripePaymentDto
} from '@transaction/dto/stripe-payment.dto'
import { ISettingService } from '@setting/services/setting.service'
import { SettingKey } from '@setting/contracts/constant'
import { INotificationService } from '@notification/services/notification.service'
import { FCMNotificationDataType } from '@notification/contracts/constant'
import { ICourseService } from '@course/services/course.service'
import { ReportTag, ReportType } from '@report/contracts/constant'
import { IReportService } from '@report/services/report.service'

@Injectable()
export class StripePaymentStrategy implements IPaymentStrategy, OnModuleInit {
  private readonly logger = new Logger(StripePaymentStrategy.name)
  private stripe: Stripe
  private publishableKey: string
  constructor(
    @InjectConnection() readonly connection: Connection,
    private readonly configService: ConfigService,
    @Inject(ITransactionRepository)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(forwardRef(() => IClassService))
    private readonly classService: IClassService,
    @Inject(ILearnerClassService)
    private readonly learnerClassService: ILearnerClassService,
    @Inject(ILearnerService)
    private readonly learnerService: ILearnerService,
    @Inject(ISettingService)
    private readonly settingService: ISettingService,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
    @Inject(ICourseService)
    private readonly courseService: ICourseService,
    @Inject(IReportService)
    private readonly reportService: IReportService
  ) {}
  async onModuleInit() {
    this.stripe = new Stripe(this.configService.get('payment.stripe.apiKey'))
    this.publishableKey =
      ((await this.settingService.findByKey(SettingKey.StripePublishableKey))?.value as string) || ''
  }

  async createTransaction(createStripePaymentDto: CreateStripePaymentDto) {
    const { customerEmail, amount, description, metadata } = createStripePaymentDto
    const customer = await this.stripe.customers.create({
      email: customerEmail
    })
    const ephemeralKey = await this.stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-10-28.acacia' }
    )
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: 'vnd',
      customer: customer.id,
      description: description,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true
      }
    })
    const createStripePaymentResponse = {
      id: paymentIntent.id,
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: this.publishableKey
    }
    this.logger.log(JSON.stringify(createStripePaymentResponse))

    return createStripePaymentResponse

    // const session = await this.stripe.checkout.sessions.create({
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: 'vnd',
    //         product_data: {
    //           name: 'T-shirt',
    //           description: 'Orchid Flower Sticks',
    //           images: [
    //             'https://www.coopersofstortford.co.uk/images/products/medium/M236i.jpg',
    //             'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbhK63v9WwEwLipJ72cuTyqTS-ssxrTzMNj7T1Z30XUPAQj7XCFRqXAsdAy4qsbK7I14g&usqp=CAU'
    //           ]
    //         },
    //         unit_amount: 20000
    //       },
    //       quantity: 2
    //     }
    //   ],
    //   mode: 'payment',
    //   success_url: 'http://localhost:4242/success',
    //   cancel_url: 'http://localhost:4242/cancel',
    //   expires_at: moment().tz(VN_TIMEZONE).add(30, 'minute').unix()
    // })

    // return session
  }

  async getTransaction(queryDto: QueryStripePaymentDto) {
    const { id } = queryDto
    const paymentIntent = await this.stripe.paymentIntents.retrieve(id)
    return paymentIntent
  }

  async refundTransaction(refundDto: RefundStripePaymentDto) {
    const { id, amount, metadata } = refundDto
    const refund = await this.stripe.refunds.create({
      payment_intent: id,
      amount,
      metadata
    })
    return refund
  }

  async getRefundTransaction(queryDto: any) {}

  async processWebhook(event: Stripe.Event) {
    // Handle the event
    let charge: Stripe.Charge
    switch (event.type) {
      case 'charge.succeeded':
        charge = event.data.object
        this.logger.log(`Charge for ${charge.amount} was succeeded!`)
        // Then define and call a method to handle the succeeded payment intent.
        await this.handleChargeSucceeded(charge)
        break
      case 'charge.failed':
        charge = event.data.object
        this.logger.log(`Charge for ${charge.amount} was failed!`)
        await this.handleChargeFailed(charge)
        break
      case 'charge.refunded':
        charge = event.data.object
        this.logger.log(`Charge for ${charge.amount} was refunded!`)
        await this.handleChargeRefunded(charge)
        break
      default:
        this.logger.error(`Unhandled event type ${event.type}.`)
    }
  }

  verifyPaymentWebhookData(params: { rawBody: any; signature: string }): Stripe.Event {
    const { rawBody, signature } = params
    try {
      this.logger.log(`Webhook signature verification...`)
      const webhookSecret = this.configService.get('payment.stripe.webhookSecret')
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      return event
    } catch (err) {
      this.logger.error(`⚠️  Webhook signature verification failed.`, err.message)
      throw new BadRequestException(`⚠️  Webhook signature verification failed.`)
    }
  }

  private async sendNotificationWhenPaymentSuccess({ learnerId, classId }) {
    try {
      const [learner, courseClass] = await Promise.all([
        this.learnerService.findById(learnerId),
        this.classService.findById(classId)
      ])
      this.notificationService.sendMail({
        to: learner?.email,
        subject: `[Orchidify] Successfully registered for class ${courseClass?.title}`,
        template: 'learner/enroll-class',
        context: {
          classTitle: courseClass?.title,
          name: learner?.name
        }
      })
    } catch (error) {}
  }

  private async handleChargeSucceeded(charge: Stripe.Charge) {
    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        const chargeId = get(charge, 'id')
        const paymentIntentId = get(charge, 'payment_intent')
        this.logger.log(`handleChargeSucceeded: [start] chargeId=${chargeId}, paymentIntentId=${paymentIntentId}`)
        const isPaymentSuccess = get(charge, 'status') === StripeStatus.SUCCEEDED
        if (isPaymentSuccess) {
          this.logger.log('handleChargeSucceeded: payment SUCCESS')
          const transaction = await this.transactionRepository.findOne({
            conditions: {
              type: TransactionType.PAYMENT,
              'payment.id': paymentIntentId,
              status: TransactionStatus.DRAFT
            }
          })
          if (!transaction) throw new AppException(Errors.TRANSACTION_NOT_FOUND)
          // Get learnerId, classId from extraData
          const { learnerId, classId, orderCode, price, discount } = get(charge, 'metadata')
          // 1. Update learnerQuantity in class, course
          const courseClass = await this.classService.update(
            { _id: new Types.ObjectId(classId) },
            {
              $inc: {
                learnerQuantity: 1
              }
            },
            { session }
          )
          await this.courseService.update(
            { _id: new Types.ObjectId(courseClass.courseId) },
            {
              $inc: {
                learnerQuantity: 1
              }
            },
            { session }
          )
          // 2. Create learnerClass
          await this.learnerClassService.create(
            {
              enrollDate: new Date(),
              transactionId: transaction._id,
              learnerId: new Types.ObjectId(learnerId),
              classId: new Types.ObjectId(classId),
              courseId: courseClass.courseId,
              price,
              discount
            },
            { session }
          )
          // 3.  Update payment to transaction
          const paymentPayLoad = {
            id: charge?.id,
            code: orderCode,
            createdAt: new Date(),
            status: transaction?.status,
            ...charge
          }
          const newPayment: BasePaymentDto = {
            ...paymentPayLoad,
            histories: [...transaction.payment.histories, paymentPayLoad]
          }
          await this.transactionRepository.findOneAndUpdate(
            { _id: transaction._id },
            {
              status: TransactionStatus.CAPTURED,
              payment: newPayment
            },
            { session }
          )
          // 4. Send notification to learner/instructor
          this.sendNotificationWhenChargeSucceeded({ classId, courseClass, learnerId })

          // update learner sum by month report
          const month = new Date().getMonth() + 1
          const year = new Date().getFullYear()
          this.reportService.update(
            {
              type: ReportType.LearnerEnrolledSumByMonth,
              tag: ReportTag.User,
              ownerId: new Types.ObjectId(courseClass.instructorId),
              'data.year': year
            },
            {
              $inc: {
                [`data.${month}.quantity`]: 1
              }
            }
          )
        }
      })
      this.logger.log('handleChargeSucceeded: [completed]')
      return true
    } finally {
      await session.endSession()
    }
  }

  private async handleChargeFailed(charge: Stripe.Charge) {
    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        const chargeId = get(charge, 'id')
        const paymentIntentId = get(charge, 'payment_intent')
        this.logger.log(`handleChargeFailed: [start] chargeId=${chargeId}, paymentIntentId=${paymentIntentId}`)
        this.logger.log('handleChargeFailed: payment FAILED')
        // 1.  Update payment to transaction
        const transaction = await this.transactionRepository.findOne({
          conditions: {
            type: TransactionType.PAYMENT,
            'payment.id': paymentIntentId,
            status: TransactionStatus.DRAFT
          }
        })
        if (!transaction) throw new AppException(Errors.TRANSACTION_NOT_FOUND)
        const { orderCode } = get(charge, 'metadata')
        const paymentPayLoad = {
          id: charge?.id,
          code: orderCode,
          createdAt: new Date(),
          status: transaction?.status,
          ...charge
        }
        const newPayment: BasePaymentDto = {
          ...paymentPayLoad,
          histories: [...transaction.payment.histories, paymentPayLoad]
        }
        await this.transactionRepository.findOneAndUpdate(
          { _id: transaction._id },
          {
            status: TransactionStatus.ERROR,
            payment: newPayment
          },
          { session }
        )
      })
      this.logger.log('handleChargeFailed: [completed]')
      return true
    } finally {
      await session.endSession()
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        const chargeId = get(charge, 'id')
        const paymentIntentId = get(charge, 'payment_intent')
        this.logger.log(`handleChargeRefunded: [start] chargeId=${chargeId}, paymentIntentId=${paymentIntentId}`)
        this.logger.log('handleChargeRefunded: payment REFUNDED')
        // 1.  Update payment to transaction
        const transaction = await this.transactionRepository.findOne({
          conditions: {
            $or: [
              {
                'payment.id': chargeId
              },
              {
                'payment.id': paymentIntentId
              }
            ],
            type: TransactionType.PAYMENT,
            status: TransactionStatus.CAPTURED
          }
        })
        if (!transaction) throw new AppException(Errors.TRANSACTION_NOT_FOUND)
        const { orderCode } = get(charge, 'metadata')
        const paymentPayLoad = {
          id: charge?.id,
          code: orderCode,
          createdAt: new Date(),
          status: transaction?.status,
          ...charge
        }
        const newPayment: BasePaymentDto = {
          ...paymentPayLoad,
          histories: [...transaction.payment.histories, paymentPayLoad]
        }
        await this.transactionRepository.findOneAndUpdate(
          { _id: transaction._id },
          {
            status: TransactionStatus.REFUNDED,
            payment: newPayment
          },
          { session }
        )
      })
      this.logger.log('handleChargeRefunded: [completed]')
      return true
    } finally {
      await session.endSession()
    }
  }

  private async sendNotificationWhenChargeSucceeded({ classId, courseClass, learnerId }) {
    // 4. Send email/notification to learner
    this.sendNotificationWhenPaymentSuccess({ learnerId, classId })

    // 5. Send notification to learner
    this.notificationService.sendFirebaseCloudMessaging({
      title: `Class registration successful`,
      body: `Welcome to class ${courseClass.code}: ${courseClass.title}.`,
      receiverIds: [learnerId],
      data: {
        type: FCMNotificationDataType.CLASS,
        id: classId
      }
    })

    // 6. Send notification for instructor
    this.notificationService.sendFirebaseCloudMessaging({
      title: `A learner has enrolled in your class`,
      body: `Class ${courseClass.code}: ${courseClass.title} has a new learner.`,
      receiverIds: [courseClass.instructorId.toString()],
      data: {
        type: FCMNotificationDataType.CLASS,
        id: classId
      }
    })
  }
}
