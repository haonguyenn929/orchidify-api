"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.INotificationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const app_logger_service_1 = require("../../common/services/app-logger.service");
const firebase_firestore_service_1 = require("../../firebase/services/firebase.firestore.service");
const firebase_messaging_service_1 = require("../../firebase/services/firebase.messaging.service");
const user_device_service_1 = require("./user-device.service");
const constant_1 = require("../../common/contracts/constant");
const mailer_1 = require("@nestjs-modules/mailer");
exports.INotificationService = Symbol('INotificationService');
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(mailService, firebaseFirestoreService, firebaseMessagingService, userDeviceService) {
        this.mailService = mailService;
        this.firebaseFirestoreService = firebaseFirestoreService;
        this.firebaseMessagingService = firebaseMessagingService;
        this.userDeviceService = userDeviceService;
        this.appLogger = new app_logger_service_1.AppLogger(NotificationService_1.name);
    }
    async sendMail(_options) {
        return;
    }
    async sendFirebaseCloudMessaging(sendNotificationDto) {
        this.appLogger.debug(`[sendFirebaseCloudMessaging]: sendNotificationDto=${JSON.stringify(sendNotificationDto)}`);
        try {
            const { title, body, data, receiverIds } = sendNotificationDto;
            const notificationCollection = await this.firebaseFirestoreService.getCollection('notification');
            sendNotificationDto.createdAt = new Date();
            await notificationCollection.add(sendNotificationDto);
            const userDevices = await this.userDeviceService.findMany({
                userId: {
                    $in: receiverIds.map((receiverId) => new mongoose_1.Types.ObjectId(receiverId))
                },
                status: constant_1.UserDeviceStatus.ACTIVE
            });
            if (userDevices.length === 0)
                return { success: true };
            const tokens = userDevices.map((userDevice) => userDevice.fcmToken);
            const result = await this.firebaseMessagingService.sendMulticast({
                tokens,
                title,
                body,
                data
            });
            return result;
        }
        catch (error) {
            this.appLogger.error(`[sendFirebaseCloudMessaging]: error=${error}`);
            return { success: false };
        }
    }
    async sendTopicFirebaseCloudMessaging(sendTopicNotificationDto) {
        this.appLogger.debug(`[sendTopicFirebaseCloudMessaging]: sendTopicNotificationDto=${JSON.stringify(sendTopicNotificationDto)}`);
        try {
            const { title, body, data, topic } = sendTopicNotificationDto;
            const notificationCollection = await this.firebaseFirestoreService.getCollection('notification');
            sendTopicNotificationDto.createdAt = new Date();
            await notificationCollection.add(sendTopicNotificationDto);
            const result = await this.firebaseMessagingService.sendTopicNotification({
                topic,
                title,
                body,
                data
            });
            return result;
        }
        catch (error) {
            this.appLogger.error(`[sendTopicFirebaseCloudMessaging]: error=${error}`);
            return { success: false };
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(firebase_firestore_service_1.IFirebaseFirestoreService)),
    __param(2, (0, common_1.Inject)(firebase_messaging_service_1.IFirebaseMessagingService)),
    __param(3, (0, common_1.Inject)(user_device_service_1.IUserDeviceService)),
    __metadata("design:paramtypes", [mailer_1.MailerService, Object, Object, Object])
], NotificationService);
//# sourceMappingURL=notification.service.js.map