import { IClassService } from '@class/services/class.service'
import { ILearnerClassService } from '@class/services/learner-class.service'
import { LearnerClassStatus, TransactionStatus, UserRole } from '@common/contracts/constant'
import { Errors } from '@common/contracts/error'
import { AppException } from '@common/exceptions/app.exception'
import { HelperService } from '@common/services/helper.service'
import { MailerService } from '@nestjs-modules/mailer'
import { HttpService } from '@nestjs/axios'
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectConnection } from '@nestjs/mongoose'
import { MomoResultCode, TransactionType } from '@src/transaction/contracts/constant'
import {
  CreateMomoPaymentDto,
  MomoPaymentResponseDto,
  QueryMomoPaymentDto,
  RefundMomoPaymentDto
} from '@src/transaction/dto/momo-payment.dto'
import { ITransactionRepository } from '@src/transaction/repositories/transaction.repository'
import { IPaymentStrategy } from '@src/transaction/strategies/payment-strategy.interface'
import { BasePaymentDto } from '@transaction/dto/base.transaction.dto'
import { AxiosError } from 'axios'
import { get } from 'lodash'
import { Connection, Types } from 'mongoose'
import { catchError, firstValueFrom } from 'rxjs'
import { ILearnerService } from '@learner/services/learner.service'
import { INotificationService } from '@notification/services/notification.service'
import { ICourseService } from '@course/services/course.service'

@Injectable()
export class MomoPaymentStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(MomoPaymentStrategy.name)
  private config
  constructor(
    @InjectConnection() readonly connection: Connection,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly helperService: HelperService,
    @Inject(ITransactionRepository)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(forwardRef(() => IClassService))
    private readonly classService: IClassService,
    @Inject(ILearnerClassService)
    private readonly learnerClassService: ILearnerClassService,
    @Inject(ILearnerService)
    private readonly learnerService: ILearnerService,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
    @Inject(ICourseService)
    private readonly courseService: ICourseService
  ) {
    this.config = this.configService.get('payment.momo')
  }

  async createTransaction(createMomoPaymentDto: CreateMomoPaymentDto) {
    const {
      partnerName,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType,
      amount,
      orderId,
      requestId,
      extraData,
      autoCapture,
      lang,
      orderExpireTime
    } = createMomoPaymentDto
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`
    const signature = this.helperService.createSignature(rawSignature, this.config.secretKey)
    createMomoPaymentDto.partnerCode = this.config.partnerCode
    createMomoPaymentDto.signature = signature

    const { data } = await firstValueFrom(
      this.httpService.post(`${this.config.endpoint}/v2/gateway/api/create`, createMomoPaymentDto).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data)
          throw 'An error happened!'
        })
      )
    )
    console.log(data)
    data.deeplink = encodeURIComponent(data?.deeplink)
    return data
  }

  async getTransaction(queryDto: QueryMomoPaymentDto) {
    const { orderId, requestId } = queryDto
    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`
    const signature = this.helperService.createSignature(rawSignature, this.config.secretKey)
    const body = {
      partnerCode: this.config.partnerCode,
      requestId,
      orderId,
      lang: 'vi',
      signature
    }
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.config.endpoint}/v2/gateway/api/query`, body).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data)
          throw 'An error happened!'
        })
      )
    )
    console.log(data)
    return data
  }

  async refundTransaction(refundDto: RefundMomoPaymentDto) {
    const { amount, description, orderId, requestId, transId } = refundDto
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}&transId=${transId}`
    const signature = this.helperService.createSignature(rawSignature, this.config.secretKey)
    refundDto.partnerCode = this.config.partnerCode
    refundDto.signature = signature

    const { data } = await firstValueFrom(
      this.httpService.post(`${this.config.endpoint}/v2/gateway/api/refund`, refundDto).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data)
          throw 'An error happened!'
        })
      )
    )
    console.log(data)
    return data
  }

  async getRefundTransaction(queryDto: QueryMomoPaymentDto) {
    const { orderId, requestId } = queryDto
    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`
    const signature = this.helperService.createSignature(rawSignature, this.config.secretKey)
    const body = {
      partnerCode: this.config.partnerCode,
      requestId,
      orderId,
      lang: 'vi',
      signature
    }
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.config.endpoint}/v2/gateway/api/refund/query`, body).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data)
          throw 'An error happened!'
        })
      )
    )
    console.log(data)
    return data
  }

  async processWebhook(webhookData: MomoPaymentResponseDto) {
    // Execute in transaction
    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        const orderId = get(webhookData, 'orderId')
        this.logger.log(`processWebhook: [start] orderId=${orderId}`)

        const isPaymentSuccess = get(webhookData, 'resultCode') === MomoResultCode.SUCCESS
        if (isPaymentSuccess) {
          // {"partnerCode":"MOMO","orderId":"2350841914636077","requestId":"2350841914636077","amount":500000,
          // "orderInfo":"Orchidify - Payment for order #2350841914636077","orderType":"momo_wallet","transId":4193767509,
          // "resultCode":0,"message":"Successful.","payType":"credit","responseTime":1729168176653,"extraData":"",
          // "signature":"7c72c91be19b2af1a3274eb489e48a121d7e1dfaf6b486fc171446220dec577b"}
          this.logger.log('processWebhook: payment SUCCESS')

          const transaction = await this.transactionRepository.findOne({
            conditions: {
              type: TransactionType.PAYMENT,
              'payment.code': get(webhookData, 'orderId'),
              status: TransactionStatus.DRAFT
            }
          })
          if (!transaction) throw new AppException(Errors.TRANSACTION_NOT_FOUND)

          // Get learnerId, classId from extraData
          const { learnerId, classId, price, discount } = JSON.parse(get(webhookData, 'extraData'))
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
            id: webhookData?.transId?.toString(),
            code: webhookData?.orderId,
            createdAt: new Date(),
            status: webhookData?.resultCode?.toString(),
            ...webhookData
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

          // 4. Send email/notification to learner
          this.sendNotificationWhenPaymentSuccess({ learnerId, classId })

          // 5. Send notification to staff
        } else {
          // {"partnerCode":"MOMO","orderId":"2597751498479017","requestId":"2597751498479017",
          // "amount":500000,"orderInfo":"Orchidify - Payment for order #2597751498479017",
          // "orderType":"momo_wallet","transId":4193843003,"resultCode":1002,
          // "message":"Transaction was declined by issuer.","payType":"credit",
          // "responseTime":1729170439150,"extraData":"{\"classId\":\"670fe48f8c7ef08132529f7f\",\"learnerId\":\"66dafb2a05fbc3343d6bfc83\"}",
          // "signature":"d7625350337e76ac93db68e7c8182cdf360cb01803580157ec61af0f8e506f03"}
          this.logger.log('processWebhook: payment FAILED')
          // 1.  Update payment to transaction
          const transaction = await this.transactionRepository.findOne({
            conditions: {
              type: TransactionType.PAYMENT,
              'payment.code': get(webhookData, 'orderId'),
              status: TransactionStatus.DRAFT
            }
          })
          if (!transaction) throw new AppException(Errors.TRANSACTION_NOT_FOUND)

          const paymentPayLoad = {
            id: webhookData?.transId?.toString(),
            code: webhookData?.orderId,
            createdAt: new Date(),
            status: webhookData?.resultCode?.toString(),
            ...webhookData
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
        }
      })
      this.logger.log('processWebhook: [completed]')
      return true
    } finally {
      await session.endSession()
    }
  }

  verifyPaymentWebhookData(momoPaymentResponseDto: any): boolean {
    const {
      partnerCode,
      amount,
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      requestId,
      payType,
      responseTime,
      resultCode,
      transId
    } = momoPaymentResponseDto
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`
    const signature = this.helperService.createSignature(rawSignature, this.config.secretKey)

    return momoPaymentResponseDto.signature == signature
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
}
