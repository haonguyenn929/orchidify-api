import { SendNotificationDto, SendTopicNotificationDto } from '@notification/dto/send-notification.dto';
import { IFirebaseFirestoreService } from '@firebase/services/firebase.firestore.service';
import { IFirebaseMessagingService } from '@firebase/services/firebase.messaging.service';
import { IUserDeviceService } from './user-device.service';
import { BatchResponse } from 'firebase-admin/lib/messaging/messaging-api';
import { MailerService } from '@nestjs-modules/mailer';
import { MailSendOptions } from '@notification/dto/send-email.dto';
export declare const INotificationService: unique symbol;
export interface INotificationService {
    sendMail(options: MailSendOptions): Promise<void>;
    sendFirebaseCloudMessaging(sendNotificationDto: SendNotificationDto): Promise<{
        success: boolean;
        response?: BatchResponse;
    }>;
    sendTopicFirebaseCloudMessaging(sendTopicNotificationDto: SendTopicNotificationDto): Promise<{
        success: boolean;
        response?: string;
    }>;
}
export declare class NotificationService implements INotificationService {
    private readonly mailService;
    private readonly firebaseFirestoreService;
    private readonly firebaseMessagingService;
    private readonly userDeviceService;
    private readonly appLogger;
    constructor(mailService: MailerService, firebaseFirestoreService: IFirebaseFirestoreService, firebaseMessagingService: IFirebaseMessagingService, userDeviceService: IUserDeviceService);
    sendMail(_options: MailSendOptions): Promise<void>;
    sendFirebaseCloudMessaging(sendNotificationDto: SendNotificationDto): Promise<{
        success: boolean;
        response?: BatchResponse;
    }>;
    sendTopicFirebaseCloudMessaging(sendTopicNotificationDto: SendTopicNotificationDto): Promise<{
        success: boolean;
        response?: string;
    }>;
}
