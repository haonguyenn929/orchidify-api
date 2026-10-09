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
var PayoutRequestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutRequestService = exports.IPayoutRequestService = void 0;
const common_1 = require("@nestjs/common");
const moment = require("moment-timezone");
const _ = require("lodash");
const payout_request_repository_1 = require("../repositories/payout-request.repository");
const mongoose_1 = require("mongoose");
const constant_1 = require("../../common/contracts/constant");
const constant_2 = require("../contracts/constant");
const config_1 = require("../../config");
const dto_1 = require("../../common/contracts/dto");
const app_exception_1 = require("../../common/exceptions/app.exception");
const error_1 = require("../../common/contracts/error");
const app_logger_service_1 = require("../../common/services/app-logger.service");
const mongoose_2 = require("@nestjs/mongoose");
const queue_producer_service_1 = require("../../queue/services/queue-producer.service");
const constant_3 = require("../../queue/contracts/constant");
const setting_service_1 = require("../../setting/services/setting.service");
const constant_4 = require("../../setting/contracts/constant");
const helper_service_1 = require("../../common/services/helper.service");
const instructor_service_1 = require("../../instructor/services/instructor.service");
const transaction_service_1 = require("../../transaction/services/transaction.service");
const constant_5 = require("../../transaction/contracts/constant");
const constant_6 = require("../../notification/contracts/constant");
const notification_service_1 = require("../../notification/services/notification.service");
const staff_service_1 = require("../../staff/services/staff.service");
const constant_7 = require("../../report/contracts/constant");
const report_service_1 = require("../../report/services/report.service");
exports.IPayoutRequestService = Symbol('IPayoutRequestService');
let PayoutRequestService = PayoutRequestService_1 = class PayoutRequestService {
    constructor(payoutRequestRepository, instructorService, connection, queueProducerService, settingService, helperService, transactionService, notificationService, staffService, reportService) {
        this.payoutRequestRepository = payoutRequestRepository;
        this.instructorService = instructorService;
        this.connection = connection;
        this.queueProducerService = queueProducerService;
        this.settingService = settingService;
        this.helperService = helperService;
        this.transactionService = transactionService;
        this.notificationService = notificationService;
        this.staffService = staffService;
        this.reportService = reportService;
        this.appLogger = new app_logger_service_1.AppLogger(PayoutRequestService_1.name);
    }
    async createPayoutRequest(createPayoutRequestDto, options) {
        const { amount, createdBy } = createPayoutRequestDto;
        const instructor = await this.instructorService.findById(createdBy.toString());
        if (instructor.balance < amount)
            throw new app_exception_1.AppException(error_1.Errors.NOT_ENOUGH_BALANCE_TO_CREATE_PAYOUT_REQUEST);
        let payoutRequest;
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                payoutRequest = await this.payoutRequestRepository.create(createPayoutRequestDto, { session });
                await this.instructorService.update({ _id: createdBy }, {
                    $inc: {
                        balance: -amount
                    }
                }, { session });
            });
        }
        finally {
            await session.endSession();
        }
        this.addPayoutRequestAutoExpiredJob(payoutRequest);
        this.sendNotificationToStaffWhenPayoutRequestIsCreated({ payoutRequest });
        this.reportService.update({ type: constant_7.ReportType.PayoutRequestSum, tag: constant_7.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(payoutRequest.createdBy) }, {
            $inc: {
                'data.quantity': 1,
                [`data.${constant_1.PayoutRequestStatus.PENDING}.quantity`]: 1
            }
        });
        return payoutRequest;
    }
    async findById(payoutRequestId, projection, populates) {
        const payoutRequest = await this.payoutRequestRepository.findOne({
            conditions: {
                _id: payoutRequestId
            },
            projection,
            populates
        });
        return payoutRequest;
    }
    update(conditions, payload, options) {
        return this.payoutRequestRepository.findOneAndUpdate(conditions, payload, options);
    }
    async list(pagination, queryPayoutRequestDto, projection = constant_2.PAYOUT_REQUEST_LIST_PROJECTION, populates) {
        const { status, createdBy, hasMadePayout } = queryPayoutRequestDto;
        const filter = {};
        if (createdBy) {
            filter['createdBy'] = new mongoose_1.Types.ObjectId(createdBy);
        }
        if (hasMadePayout !== undefined) {
            filter['hasMadePayout'] = {
                $exists: hasMadePayout
            };
        }
        const validStatus = status?.filter((status) => [
            constant_1.PayoutRequestStatus.PENDING,
            constant_1.PayoutRequestStatus.APPROVED,
            constant_1.PayoutRequestStatus.CANCELED,
            constant_1.PayoutRequestStatus.EXPIRED,
            constant_1.PayoutRequestStatus.REJECTED
        ].includes(status));
        if (validStatus?.length > 0) {
            filter['status'] = {
                $in: validStatus
            };
        }
        return this.payoutRequestRepository.model.paginate(filter, {
            ...pagination,
            projection: ['-histories'],
            populate: populates
        });
    }
    async findMany(conditions, projection, populates) {
        const payoutRequests = await this.payoutRequestRepository.findMany({
            conditions,
            projection,
            populates
        });
        return payoutRequests;
    }
    countByCreatedByAndDate(createdBy, date) {
        const startOfDate = moment(date).tz(config_1.VN_TIMEZONE).startOf('date');
        const endOfDate = moment(date).tz(config_1.VN_TIMEZONE).endOf('date');
        return this.payoutRequestRepository.model.countDocuments({
            createdBy: new mongoose_1.Types.ObjectId(createdBy),
            createdAt: {
                $gte: startOfDate.toDate(),
                $lte: endOfDate.toDate()
            }
        });
    }
    async cancelPayoutRequest(payoutRequestId, userAuth) {
        const { _id, role } = userAuth;
        const payoutRequest = await this.findById(payoutRequestId);
        if (!payoutRequest || payoutRequest.createdBy.toString() !== _id)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_NOT_FOUND);
        if (payoutRequest.status !== constant_1.PayoutRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_STATUS_INVALID);
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                await this.update({ _id: payoutRequestId }, {
                    $set: {
                        status: constant_1.PayoutRequestStatus.CANCELED
                    },
                    $push: {
                        histories: {
                            status: constant_1.PayoutRequestStatus.CANCELED,
                            timestamp: new Date(),
                            userId: new mongoose_1.Types.ObjectId(_id),
                            userRole: role
                        }
                    }
                }, { session });
                await this.instructorService.update({ _id: payoutRequest.createdBy }, {
                    $inc: {
                        balance: payoutRequest.amount
                    }
                }, { session });
            });
        }
        finally {
            await session.endSession();
        }
        this.queueProducerService.removeJob(constant_3.QueueName.PAYOUT_REQUEST, payoutRequestId);
        this.reportService.update({ type: constant_7.ReportType.PayoutRequestSum, tag: constant_7.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(payoutRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.PayoutRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async approvePayoutRequest(payoutRequestId, userAuth) {
        const { _id, role } = userAuth;
        const payoutRequest = await this.findById(payoutRequestId);
        if (!payoutRequest)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_NOT_FOUND);
        if (payoutRequest.status !== constant_1.PayoutRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_STATUS_INVALID);
        const [payoutUsage, payoutAmountLimitPerDay] = await Promise.all([
            this.getPayoutUsage({ createdBy: payoutRequest.createdBy, date: new Date() }),
            this.settingService.findByKey(constant_4.SettingKey.PayoutAmountLimitPerDay)
        ]);
        const payoutAmountLimit = Number(payoutAmountLimitPerDay.value) || 50000000;
        if (payoutUsage + payoutRequest.amount > payoutAmountLimit)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_AMOUNT_LIMIT_PER_DAY);
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                await this.payoutRequestRepository.findOneAndUpdate({ _id: payoutRequestId }, {
                    $set: {
                        status: constant_1.PayoutRequestStatus.APPROVED,
                        handledBy: new mongoose_1.Types.ObjectId(_id)
                    },
                    $push: {
                        histories: {
                            status: constant_1.PayoutRequestStatus.APPROVED,
                            timestamp: new Date(),
                            userId: new mongoose_1.Types.ObjectId(_id),
                            userRole: role
                        }
                    }
                }, { session });
                const payoutPayload = {
                    id: payoutRequest._id.toString(),
                    code: null,
                    createdAt: new Date(),
                    status: 'OK'
                };
                const payout = {
                    ...payoutPayload,
                    histories: [payoutPayload]
                };
                await this.transactionService.create({
                    type: constant_5.TransactionType.PAYOUT,
                    amount: payoutRequest.amount,
                    debitAccount: { userRole: 'SYSTEM' },
                    creditAccount: { userId: payoutRequest.createdBy, userRole: constant_1.UserRole.INSTRUCTOR },
                    description: payoutRequest.description,
                    status: constant_1.TransactionStatus.CAPTURED,
                    payout
                }, {
                    session
                });
            });
        }
        finally {
            await session.endSession();
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: 'Your payout request has been approved',
            body: 'The amount will be processed within a few business days. Click to view details.',
            receiverIds: [payoutRequest.createdBy.toString()],
            data: {
                type: constant_6.FCMNotificationDataType.PAYOUT_REQUEST,
                id: payoutRequestId
            }
        });
        this.queueProducerService.removeJob(constant_3.QueueName.PAYOUT_REQUEST, payoutRequestId);
        this.reportService.update({ type: constant_7.ReportType.PayoutRequestSum, tag: constant_7.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(payoutRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.PayoutRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async rejectPayoutRequest(payoutRequestId, rejectPayoutRequestDto, userAuth) {
        const { rejectReason } = rejectPayoutRequestDto;
        const { _id, role } = userAuth;
        const payoutRequest = await this.findById(payoutRequestId);
        if (!payoutRequest)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_NOT_FOUND);
        if (payoutRequest.status !== constant_1.PayoutRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_STATUS_INVALID);
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                await this.update({ _id: payoutRequestId }, {
                    $set: {
                        status: constant_1.PayoutRequestStatus.REJECTED,
                        rejectReason,
                        handledBy: new mongoose_1.Types.ObjectId(_id)
                    },
                    $push: {
                        histories: {
                            status: constant_1.PayoutRequestStatus.REJECTED,
                            timestamp: new Date(),
                            userId: new mongoose_1.Types.ObjectId(_id),
                            userRole: role
                        }
                    }
                }, { session });
                await this.instructorService.update({ _id: payoutRequest.createdBy }, {
                    $inc: {
                        balance: payoutRequest.amount
                    }
                }, { session });
            });
        }
        finally {
            await session.endSession();
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: 'Payout request has been rejected',
            body: 'The payout request is invalid. Click to view details.',
            receiverIds: [payoutRequest.createdBy.toString()],
            data: {
                type: constant_6.FCMNotificationDataType.PAYOUT_REQUEST,
                id: payoutRequestId
            }
        });
        this.queueProducerService.removeJob(constant_3.QueueName.PAYOUT_REQUEST, payoutRequestId);
        this.reportService.update({ type: constant_7.ReportType.PayoutRequestSum, tag: constant_7.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(payoutRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.PayoutRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async expirePayoutRequest(payoutRequestId, userAuth) {
        const { _id, role } = userAuth;
        const payoutRequest = await this.findById(payoutRequestId);
        if (!payoutRequest)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_NOT_FOUND);
        if (payoutRequest.status !== constant_1.PayoutRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_STATUS_INVALID);
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                await this.update({ _id: payoutRequestId }, {
                    $set: {
                        status: constant_1.PayoutRequestStatus.EXPIRED
                    },
                    $push: {
                        histories: {
                            status: constant_1.PayoutRequestStatus.EXPIRED,
                            timestamp: new Date(),
                            userRole: role
                        }
                    }
                }, { session });
                await this.instructorService.update({ _id: payoutRequest.createdBy }, {
                    $inc: {
                        balance: payoutRequest.amount
                    }
                }, { session });
            });
        }
        finally {
            await session.endSession();
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: 'Payout request has expired',
            body: 'The payout request has expired. Click to view details.',
            receiverIds: [payoutRequest.createdBy.toString()],
            data: {
                type: constant_6.FCMNotificationDataType.PAYOUT_REQUEST,
                id: payoutRequestId
            }
        });
        this.reportService.update({ type: constant_7.ReportType.PayoutRequestSum, tag: constant_7.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(payoutRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.PayoutRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async markHasMadePayout(payoutRequestId, markHasMadePayoutDto, userAuth) {
        const { transactionCode, attachment } = markHasMadePayoutDto;
        const payoutRequest = await this.findById(payoutRequestId);
        if (!payoutRequest)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_NOT_FOUND);
        if (payoutRequest.status !== constant_1.PayoutRequestStatus.APPROVED)
            throw new app_exception_1.AppException(error_1.Errors.PAYOUT_REQUEST_STATUS_INVALID);
        if (payoutRequest.hasMadePayout === true)
            throw new app_exception_1.AppException(error_1.Errors.REQUEST_ALREADY_HAS_MADE_PAYOUT);
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                await this.update({ _id: payoutRequestId }, {
                    $set: {
                        hasMadePayout: true,
                        transactionCode,
                        attachment
                    }
                }, { session });
            });
        }
        finally {
            await session.endSession();
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: 'Payout request has been paid',
            body: 'The payout request has been paid. Click to view details.',
            receiverIds: [payoutRequest.createdBy.toString()],
            data: {
                type: constant_6.FCMNotificationDataType.PAYOUT_REQUEST,
                id: payoutRequestId
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async getPayoutUsage({ createdBy, date }) {
        const startOfDate = moment(date).tz(config_1.VN_TIMEZONE).startOf('date');
        const endOfDate = moment(date).tz(config_1.VN_TIMEZONE).endOf('date');
        const result = await this.payoutRequestRepository.model.aggregate([
            {
                $match: {
                    createdBy: new mongoose_1.Types.ObjectId(createdBy),
                    status: constant_1.PayoutRequestStatus.APPROVED,
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
        ]);
        return _.get(result, '[0].totalAmount', 0);
    }
    async getExpiredAt(date) {
        const payoutRequestAutoExpiration = await this.settingService.findByKey(constant_4.SettingKey.PayoutRequestAutoExpiration);
        const dateMoment = moment.tz(date, config_1.VN_TIMEZONE);
        const expiredDate = dateMoment.clone().add(Number(payoutRequestAutoExpiration.value) || 2, 'day');
        let expiredAt = expiredDate.clone();
        let currentDate = dateMoment.clone();
        while (currentDate.isSameOrBefore(expiredDate)) {
            if (currentDate.clone().isoWeekday() === 7) {
                expiredAt.add(1, 'day');
            }
            currentDate.add(1, 'day');
        }
        return expiredAt.toDate();
    }
    async addPayoutRequestAutoExpiredJob(payoutRequest) {
        try {
            const expiredAt = await this.getExpiredAt(payoutRequest['createdAt']);
            const delayTime = this.helperService.getDiffTimeByMilliseconds(expiredAt);
            await this.queueProducerService.addJob(constant_3.QueueName.PAYOUT_REQUEST, constant_3.JobName.PayoutRequestAutoExpired, {
                payoutRequestId: payoutRequest._id,
                expiredAt
            }, {
                delay: delayTime,
                jobId: payoutRequest._id.toString()
            });
        }
        catch (err) {
            this.appLogger.error(JSON.stringify(err));
        }
    }
    async sendNotificationToStaffWhenPayoutRequestIsCreated({ payoutRequest }) {
        const staffs = await this.staffService.findMany({
            status: constant_1.StaffStatus.ACTIVE,
            role: constant_1.UserRole.STAFF
        });
        const staffIds = staffs.map((staff) => staff._id.toString());
        await this.notificationService.sendTopicFirebaseCloudMessaging({
            title: 'New payout request created',
            body: 'A new payout request was recently created. Click to view details.',
            receiverIds: staffIds,
            data: {
                type: constant_6.FCMNotificationDataType.PAYOUT_REQUEST,
                id: payoutRequest._id.toString()
            },
            topic: 'STAFF_NOTIFICATION_TOPIC'
        });
    }
};
exports.PayoutRequestService = PayoutRequestService;
exports.PayoutRequestService = PayoutRequestService = PayoutRequestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(payout_request_repository_1.IPayoutRequestRepository)),
    __param(1, (0, common_1.Inject)(instructor_service_1.IInstructorService)),
    __param(2, (0, mongoose_2.InjectConnection)()),
    __param(3, (0, common_1.Inject)(queue_producer_service_1.IQueueProducerService)),
    __param(4, (0, common_1.Inject)(setting_service_1.ISettingService)),
    __param(6, (0, common_1.Inject)(transaction_service_1.ITransactionService)),
    __param(7, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __param(8, (0, common_1.Inject)(staff_service_1.IStaffService)),
    __param(9, (0, common_1.Inject)(report_service_1.IReportService)),
    __metadata("design:paramtypes", [Object, Object, mongoose_1.Connection, Object, Object, helper_service_1.HelperService, Object, Object, Object, Object])
], PayoutRequestService);
//# sourceMappingURL=payout-request.service.js.map