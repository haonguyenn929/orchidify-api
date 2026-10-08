import { Injectable, Inject } from '@nestjs/common'
import * as _ from 'lodash'
import { Types } from 'mongoose'
import { SendNotificationDto, SendTopicNotificationDto } from '@notification/dto/send-notification.dto'
import { AppLogger } from '@common/services/app-logger.service'
import { IFirebaseFirestoreService } from '@firebase/services/firebase.firestore.service'
import { IFirebaseMessagingService } from '@firebase/services/firebase.messaging.service'
import { IUserDeviceService } from './user-device.service'
import { UserDeviceStatus } from '@common/contracts/constant'
import { BatchResponse } from 'firebase-admin/lib/messaging/messaging-api'
import { MailerService } from '@nestjs-modules/mailer'
import { MailSendOptions } from '@notification/dto/send-email.dto'

export const INotificationService = Symbol('INotificationService')

export interface INotificationService {
  sendMail(options: MailSendOptions): Promise<void>
  sendFirebaseCloudMessaging(sendNotificationDto: SendNotificationDto): Promise<{
    success: boolean
    response?: BatchResponse
  }>
  sendTopicFirebaseCloudMessaging(sendTopicNotificationDto: SendTopicNotificationDto): Promise<{
    success: boolean
    response?: string
  }>
}

@Injectable()
export class NotificationService implements INotificationService {
  private readonly appLogger = new AppLogger(NotificationService.name)
  constructor(
    private readonly mailService: MailerService,
    @Inject(IFirebaseFirestoreService)
    private readonly firebaseFirestoreService: IFirebaseFirestoreService,
    @Inject(IFirebaseMessagingService)
    private readonly firebaseMessagingService: IFirebaseMessagingService,
    @Inject(IUserDeviceService)
    private readonly userDeviceService: IUserDeviceService
  ) {}

  async sendMail(_options: MailSendOptions): Promise<void> {
    return
  }

  public async sendFirebaseCloudMessaging(sendNotificationDto: SendNotificationDto) {
    this.appLogger.debug(`[sendFirebaseCloudMessaging]: sendNotificationDto=${JSON.stringify(sendNotificationDto)}`)
    try {
      const { title, body, data, receiverIds } = sendNotificationDto

      // Add notification doc to firestore
      const notificationCollection = await this.firebaseFirestoreService.getCollection('notification')
      sendNotificationDto.createdAt = new Date()
      await notificationCollection.add(sendNotificationDto)

      // Push firebase cloud messaging
      const userDevices = await this.userDeviceService.findMany({
        userId: {
          $in: receiverIds.map((receiverId) => new Types.ObjectId(receiverId))
        },
        status: UserDeviceStatus.ACTIVE
      })
      if (userDevices.length === 0) return { success: true }

      const tokens = userDevices.map((userDevice) => userDevice.fcmToken)
      const result = await this.firebaseMessagingService.sendMulticast({
        tokens,
        title,
        body,
        data
      })
      return result
    } catch (error) {
      this.appLogger.error(`[sendFirebaseCloudMessaging]: error=${error}`)
      return { success: false }
    }
  }

  public async sendTopicFirebaseCloudMessaging(sendTopicNotificationDto: SendTopicNotificationDto) {
    this.appLogger.debug(
      `[sendTopicFirebaseCloudMessaging]: sendTopicNotificationDto=${JSON.stringify(sendTopicNotificationDto)}`
    )
    try {
      const { title, body, data, topic } = sendTopicNotificationDto

      // Get receiverIds

      // Add notification doc to firestore
      const notificationCollection = await this.firebaseFirestoreService.getCollection('notification')
      sendTopicNotificationDto.createdAt = new Date()
      await notificationCollection.add(sendTopicNotificationDto)

      // Push firebase cloud messaging
      const result = await this.firebaseMessagingService.sendTopicNotification({
        topic,
        title,
        body,
        data
      })
      return result
    } catch (error) {
      this.appLogger.error(`[sendTopicFirebaseCloudMessaging]: error=${error}`)
      return { success: false }
    }
  }
}
