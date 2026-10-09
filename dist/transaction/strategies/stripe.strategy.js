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
var StripePaymentStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripePaymentStrategy = void 0;
const stripe_1 = require("stripe");
const class_service_1 = require("../../class/services/class.service");
const learner_class_service_1 = require("../../class/services/learner-class.service");
const constant_1 = require("../../common/contracts/constant");
const error_1 = require("../../common/contracts/error");
const app_exception_1 = require("../../common/exceptions/app.exception");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const constant_2 = require("../contracts/constant");
const transaction_repository_1 = require("../repositories/transaction.repository");
const lodash_1 = require("lodash");
const mongoose_2 = require("mongoose");
const learner_service_1 = require("../../learner/services/learner.service");
const setting_service_1 = require("../../setting/services/setting.service");
const constant_3 = require("../../setting/contracts/constant");
const notification_service_1 = require("../../notification/services/notification.service");
const constant_4 = require("../../notification/contracts/constant");
const course_service_1 = require("../../course/services/course.service");
const constant_5 = require("../../report/contracts/constant");
const report_service_1 = require("../../report/services/report.service");
let StripePaymentStrategy = StripePaymentStrategy_1 = class StripePaymentStrategy {
    constructor(connection, configService, transactionRepository, classService, learnerClassService, learnerService, settingService, notificationService, courseService, reportService) {
        this.connection = connection;
        this.configService = configService;
        this.transactionRepository = transactionRepository;
        this.classService = classService;
        this.learnerClassService = learnerClassService;
        this.learnerService = learnerService;
        this.settingService = settingService;
        this.notificationService = notificationService;
        this.courseService = courseService;
        this.reportService = reportService;
        this.logger = new common_1.Logger(StripePaymentStrategy_1.name);
    }
    async onModuleInit() {
        this.stripe = new stripe_1.default(this.configService.get('payment.stripe.apiKey'));
        this.publishableKey =
            (await this.settingService.findByKey(constant_3.SettingKey.StripePublishableKey))?.value || '';
    }
    async createTransaction(createStripePaymentDto) {
        const { customerEmail, amount, description, metadata } = createStripePaymentDto;
        const customer = await this.stripe.customers.create({
            email: customerEmail
        });
        const ephemeralKey = await this.stripe.ephemeralKeys.create({ customer: customer.id }, { apiVersion: '2024-10-28.acacia' });
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: amount,
            currency: 'vnd',
            customer: customer.id,
            description: description,
            metadata: metadata,
            automatic_payment_methods: {
                enabled: true
            }
        });
        const createStripePaymentResponse = {
            id: paymentIntent.id,
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            publishableKey: this.publishableKey
        };
        this.logger.log(JSON.stringify(createStripePaymentResponse));
        return createStripePaymentResponse;
    }
    async getTransaction(queryDto) {
        const { id } = queryDto;
        const paymentIntent = await this.stripe.paymentIntents.retrieve(id);
        return paymentIntent;
    }
    async refundTransaction(refundDto) {
        const { id, amount, metadata } = refundDto;
        const refund = await this.stripe.refunds.create({
            payment_intent: id,
            amount,
            metadata
        });
        return refund;
    }
    async getRefundTransaction(queryDto) { }
    async processWebhook(event) {
        let charge;
        switch (event.type) {
            case 'charge.succeeded':
                charge = event.data.object;
                this.logger.log(`Charge for ${charge.amount} was succeeded!`);
                await this.handleChargeSucceeded(charge);
                break;
            case 'charge.failed':
                charge = event.data.object;
                this.logger.log(`Charge for ${charge.amount} was failed!`);
                await this.handleChargeFailed(charge);
                break;
            case 'charge.refunded':
                charge = event.data.object;
                this.logger.log(`Charge for ${charge.amount} was refunded!`);
                await this.handleChargeRefunded(charge);
                break;
            default:
                this.logger.error(`Unhandled event type ${event.type}.`);
        }
    }
    verifyPaymentWebhookData(params) {
        const { rawBody, signature } = params;
        try {
            this.logger.log(`Webhook signature verification...`);
            const webhookSecret = this.configService.get('payment.stripe.webhookSecret');
            const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
            return event;
        }
        catch (err) {
            this.logger.error(`⚠️  Webhook signature verification failed.`, err.message);
            throw new common_1.BadRequestException(`⚠️  Webhook signature verification failed.`);
        }
    }
    async sendNotificationWhenPaymentSuccess({ learnerId, classId }) {
        try {
            const [learner, courseClass] = await Promise.all([
                this.learnerService.findById(learnerId),
                this.classService.findById(classId)
            ]);
            this.notificationService.sendMail({
                to: learner?.email,
                subject: `[Orchidify] Successfully registered for class ${courseClass?.title}`,
                template: 'learner/enroll-class',
                context: {
                    classTitle: courseClass?.title,
                    name: learner?.name
                }
            });
        }
        catch (error) { }
    }
    async handleChargeSucceeded(charge) {
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                const chargeId = (0, lodash_1.get)(charge, 'id');
                const paymentIntentId = (0, lodash_1.get)(charge, 'payment_intent');
                this.logger.log(`handleChargeSucceeded: [start] chargeId=${chargeId}, paymentIntentId=${paymentIntentId}`);
                const isPaymentSuccess = (0, lodash_1.get)(charge, 'status') === constant_2.StripeStatus.SUCCEEDED;
                if (isPaymentSuccess) {
                    this.logger.log('handleChargeSucceeded: payment SUCCESS');
                    const transaction = await this.transactionRepository.findOne({
                        conditions: {
                            type: constant_2.TransactionType.PAYMENT,
                            'payment.id': paymentIntentId,
                            status: constant_1.TransactionStatus.DRAFT
                        }
                    });
                    if (!transaction)
                        throw new app_exception_1.AppException(error_1.Errors.TRANSACTION_NOT_FOUND);
                    const { learnerId, classId, orderCode, price, discount } = (0, lodash_1.get)(charge, 'metadata');
                    const courseClass = await this.classService.update({ _id: new mongoose_2.Types.ObjectId(classId) }, {
                        $inc: {
                            learnerQuantity: 1
                        }
                    }, { session });
                    await this.courseService.update({ _id: new mongoose_2.Types.ObjectId(courseClass.courseId) }, {
                        $inc: {
                            learnerQuantity: 1
                        }
                    }, { session });
                    await this.learnerClassService.create({
                        enrollDate: new Date(),
                        transactionId: transaction._id,
                        learnerId: new mongoose_2.Types.ObjectId(learnerId),
                        classId: new mongoose_2.Types.ObjectId(classId),
                        courseId: courseClass.courseId,
                        price,
                        discount
                    }, { session });
                    const paymentPayLoad = {
                        id: charge?.id,
                        code: orderCode,
                        createdAt: new Date(),
                        status: transaction?.status,
                        ...charge
                    };
                    const newPayment = {
                        ...paymentPayLoad,
                        histories: [...transaction.payment.histories, paymentPayLoad]
                    };
                    await this.transactionRepository.findOneAndUpdate({ _id: transaction._id }, {
                        status: constant_1.TransactionStatus.CAPTURED,
                        payment: newPayment
                    }, { session });
                    this.sendNotificationWhenChargeSucceeded({ classId, courseClass, learnerId });
                    const month = new Date().getMonth() + 1;
                    const year = new Date().getFullYear();
                    this.reportService.update({
                        type: constant_5.ReportType.LearnerEnrolledSumByMonth,
                        tag: constant_5.ReportTag.User,
                        ownerId: new mongoose_2.Types.ObjectId(courseClass.instructorId),
                        'data.year': year
                    }, {
                        $inc: {
                            [`data.${month}.quantity`]: 1
                        }
                    });
                }
            });
            this.logger.log('handleChargeSucceeded: [completed]');
            return true;
        }
        finally {
            await session.endSession();
        }
    }
    async handleChargeFailed(charge) {
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                const chargeId = (0, lodash_1.get)(charge, 'id');
                const paymentIntentId = (0, lodash_1.get)(charge, 'payment_intent');
                this.logger.log(`handleChargeFailed: [start] chargeId=${chargeId}, paymentIntentId=${paymentIntentId}`);
                this.logger.log('handleChargeFailed: payment FAILED');
                const transaction = await this.transactionRepository.findOne({
                    conditions: {
                        type: constant_2.TransactionType.PAYMENT,
                        'payment.id': paymentIntentId,
                        status: constant_1.TransactionStatus.DRAFT
                    }
                });
                if (!transaction)
                    throw new app_exception_1.AppException(error_1.Errors.TRANSACTION_NOT_FOUND);
                const { orderCode } = (0, lodash_1.get)(charge, 'metadata');
                const paymentPayLoad = {
                    id: charge?.id,
                    code: orderCode,
                    createdAt: new Date(),
                    status: transaction?.status,
                    ...charge
                };
                const newPayment = {
                    ...paymentPayLoad,
                    histories: [...transaction.payment.histories, paymentPayLoad]
                };
                await this.transactionRepository.findOneAndUpdate({ _id: transaction._id }, {
                    status: constant_1.TransactionStatus.ERROR,
                    payment: newPayment
                }, { session });
            });
            this.logger.log('handleChargeFailed: [completed]');
            return true;
        }
        finally {
            await session.endSession();
        }
    }
    async handleChargeRefunded(charge) {
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                const chargeId = (0, lodash_1.get)(charge, 'id');
                const paymentIntentId = (0, lodash_1.get)(charge, 'payment_intent');
                this.logger.log(`handleChargeRefunded: [start] chargeId=${chargeId}, paymentIntentId=${paymentIntentId}`);
                this.logger.log('handleChargeRefunded: payment REFUNDED');
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
                        type: constant_2.TransactionType.PAYMENT,
                        status: constant_1.TransactionStatus.CAPTURED
                    }
                });
                if (!transaction)
                    throw new app_exception_1.AppException(error_1.Errors.TRANSACTION_NOT_FOUND);
                const { orderCode } = (0, lodash_1.get)(charge, 'metadata');
                const paymentPayLoad = {
                    id: charge?.id,
                    code: orderCode,
                    createdAt: new Date(),
                    status: transaction?.status,
                    ...charge
                };
                const newPayment = {
                    ...paymentPayLoad,
                    histories: [...transaction.payment.histories, paymentPayLoad]
                };
                await this.transactionRepository.findOneAndUpdate({ _id: transaction._id }, {
                    status: constant_1.TransactionStatus.REFUNDED,
                    payment: newPayment
                }, { session });
            });
            this.logger.log('handleChargeRefunded: [completed]');
            return true;
        }
        finally {
            await session.endSession();
        }
    }
    async sendNotificationWhenChargeSucceeded({ classId, courseClass, learnerId }) {
        this.sendNotificationWhenPaymentSuccess({ learnerId, classId });
        this.notificationService.sendFirebaseCloudMessaging({
            title: `Class registration successful`,
            body: `Welcome to class ${courseClass.code}: ${courseClass.title}.`,
            receiverIds: [learnerId],
            data: {
                type: constant_4.FCMNotificationDataType.CLASS,
                id: classId
            }
        });
        this.notificationService.sendFirebaseCloudMessaging({
            title: `A learner has enrolled in your class`,
            body: `Class ${courseClass.code}: ${courseClass.title} has a new learner.`,
            receiverIds: [courseClass.instructorId.toString()],
            data: {
                type: constant_4.FCMNotificationDataType.CLASS,
                id: classId
            }
        });
    }
};
exports.StripePaymentStrategy = StripePaymentStrategy;
exports.StripePaymentStrategy = StripePaymentStrategy = StripePaymentStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __param(2, (0, common_1.Inject)(transaction_repository_1.ITransactionRepository)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => class_service_1.IClassService))),
    __param(4, (0, common_1.Inject)(learner_class_service_1.ILearnerClassService)),
    __param(5, (0, common_1.Inject)(learner_service_1.ILearnerService)),
    __param(6, (0, common_1.Inject)(setting_service_1.ISettingService)),
    __param(7, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __param(8, (0, common_1.Inject)(course_service_1.ICourseService)),
    __param(9, (0, common_1.Inject)(report_service_1.IReportService)),
    __metadata("design:paramtypes", [mongoose_2.Connection,
        config_1.ConfigService, Object, Object, Object, Object, Object, Object, Object, Object])
], StripePaymentStrategy);
//# sourceMappingURL=stripe.strategy.js.map