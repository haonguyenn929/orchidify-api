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
var MomoPaymentStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MomoPaymentStrategy = void 0;
const class_service_1 = require("../../class/services/class.service");
const learner_class_service_1 = require("../../class/services/learner-class.service");
const constant_1 = require("../../common/contracts/constant");
const error_1 = require("../../common/contracts/error");
const app_exception_1 = require("../../common/exceptions/app.exception");
const helper_service_1 = require("../../common/services/helper.service");
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const constant_2 = require("../contracts/constant");
const transaction_repository_1 = require("../repositories/transaction.repository");
const lodash_1 = require("lodash");
const mongoose_2 = require("mongoose");
const rxjs_1 = require("rxjs");
const learner_service_1 = require("../../learner/services/learner.service");
const notification_service_1 = require("../../notification/services/notification.service");
const course_service_1 = require("../../course/services/course.service");
let MomoPaymentStrategy = MomoPaymentStrategy_1 = class MomoPaymentStrategy {
    constructor(connection, httpService, configService, helperService, transactionRepository, classService, learnerClassService, learnerService, notificationService, courseService) {
        this.connection = connection;
        this.httpService = httpService;
        this.configService = configService;
        this.helperService = helperService;
        this.transactionRepository = transactionRepository;
        this.classService = classService;
        this.learnerClassService = learnerClassService;
        this.learnerService = learnerService;
        this.notificationService = notificationService;
        this.courseService = courseService;
        this.logger = new common_1.Logger(MomoPaymentStrategy_1.name);
        this.config = this.configService.get('payment.momo');
    }
    async createTransaction(createMomoPaymentDto) {
        const { partnerName, orderInfo, redirectUrl, ipnUrl, requestType, amount, orderId, requestId, extraData, autoCapture, lang, orderExpireTime } = createMomoPaymentDto;
        const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = this.helperService.createSignature(rawSignature, this.config.secretKey);
        createMomoPaymentDto.partnerCode = this.config.partnerCode;
        createMomoPaymentDto.signature = signature;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.config.endpoint}/v2/gateway/api/create`, createMomoPaymentDto).pipe((0, rxjs_1.catchError)((error) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
        })));
        console.log(data);
        data.deeplink = encodeURIComponent(data?.deeplink);
        return data;
    }
    async getTransaction(queryDto) {
        const { orderId, requestId } = queryDto;
        const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;
        const signature = this.helperService.createSignature(rawSignature, this.config.secretKey);
        const body = {
            partnerCode: this.config.partnerCode,
            requestId,
            orderId,
            lang: 'vi',
            signature
        };
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.config.endpoint}/v2/gateway/api/query`, body).pipe((0, rxjs_1.catchError)((error) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
        })));
        console.log(data);
        return data;
    }
    async refundTransaction(refundDto) {
        const { amount, description, orderId, requestId, transId } = refundDto;
        const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}&transId=${transId}`;
        const signature = this.helperService.createSignature(rawSignature, this.config.secretKey);
        refundDto.partnerCode = this.config.partnerCode;
        refundDto.signature = signature;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.config.endpoint}/v2/gateway/api/refund`, refundDto).pipe((0, rxjs_1.catchError)((error) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
        })));
        console.log(data);
        return data;
    }
    async getRefundTransaction(queryDto) {
        const { orderId, requestId } = queryDto;
        const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;
        const signature = this.helperService.createSignature(rawSignature, this.config.secretKey);
        const body = {
            partnerCode: this.config.partnerCode,
            requestId,
            orderId,
            lang: 'vi',
            signature
        };
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.config.endpoint}/v2/gateway/api/refund/query`, body).pipe((0, rxjs_1.catchError)((error) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
        })));
        console.log(data);
        return data;
    }
    async processWebhook(webhookData) {
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                const orderId = (0, lodash_1.get)(webhookData, 'orderId');
                this.logger.log(`processWebhook: [start] orderId=${orderId}`);
                const isPaymentSuccess = (0, lodash_1.get)(webhookData, 'resultCode') === constant_2.MomoResultCode.SUCCESS;
                if (isPaymentSuccess) {
                    this.logger.log('processWebhook: payment SUCCESS');
                    const transaction = await this.transactionRepository.findOne({
                        conditions: {
                            type: constant_2.TransactionType.PAYMENT,
                            'payment.code': (0, lodash_1.get)(webhookData, 'orderId'),
                            status: constant_1.TransactionStatus.DRAFT
                        }
                    });
                    if (!transaction)
                        throw new app_exception_1.AppException(error_1.Errors.TRANSACTION_NOT_FOUND);
                    const { learnerId, classId, price, discount } = JSON.parse((0, lodash_1.get)(webhookData, 'extraData'));
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
                        id: webhookData?.transId?.toString(),
                        code: webhookData?.orderId,
                        createdAt: new Date(),
                        status: webhookData?.resultCode?.toString(),
                        ...webhookData
                    };
                    const newPayment = {
                        ...paymentPayLoad,
                        histories: [...transaction.payment.histories, paymentPayLoad]
                    };
                    await this.transactionRepository.findOneAndUpdate({ _id: transaction._id }, {
                        status: constant_1.TransactionStatus.CAPTURED,
                        payment: newPayment
                    }, { session });
                    this.sendNotificationWhenPaymentSuccess({ learnerId, classId });
                }
                else {
                    this.logger.log('processWebhook: payment FAILED');
                    const transaction = await this.transactionRepository.findOne({
                        conditions: {
                            type: constant_2.TransactionType.PAYMENT,
                            'payment.code': (0, lodash_1.get)(webhookData, 'orderId'),
                            status: constant_1.TransactionStatus.DRAFT
                        }
                    });
                    if (!transaction)
                        throw new app_exception_1.AppException(error_1.Errors.TRANSACTION_NOT_FOUND);
                    const paymentPayLoad = {
                        id: webhookData?.transId?.toString(),
                        code: webhookData?.orderId,
                        createdAt: new Date(),
                        status: webhookData?.resultCode?.toString(),
                        ...webhookData
                    };
                    const newPayment = {
                        ...paymentPayLoad,
                        histories: [...transaction.payment.histories, paymentPayLoad]
                    };
                    await this.transactionRepository.findOneAndUpdate({ _id: transaction._id }, {
                        status: constant_1.TransactionStatus.ERROR,
                        payment: newPayment
                    }, { session });
                }
            });
            this.logger.log('processWebhook: [completed]');
            return true;
        }
        finally {
            await session.endSession();
        }
    }
    verifyPaymentWebhookData(momoPaymentResponseDto) {
        const { partnerCode, amount, extraData, message, orderId, orderInfo, orderType, requestId, payType, responseTime, resultCode, transId } = momoPaymentResponseDto;
        const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
        const signature = this.helperService.createSignature(rawSignature, this.config.secretKey);
        return momoPaymentResponseDto.signature == signature;
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
};
exports.MomoPaymentStrategy = MomoPaymentStrategy;
exports.MomoPaymentStrategy = MomoPaymentStrategy = MomoPaymentStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __param(4, (0, common_1.Inject)(transaction_repository_1.ITransactionRepository)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => class_service_1.IClassService))),
    __param(6, (0, common_1.Inject)(learner_class_service_1.ILearnerClassService)),
    __param(7, (0, common_1.Inject)(learner_service_1.ILearnerService)),
    __param(8, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __param(9, (0, common_1.Inject)(course_service_1.ICourseService)),
    __metadata("design:paramtypes", [mongoose_2.Connection,
        axios_1.HttpService,
        config_1.ConfigService,
        helper_service_1.HelperService, Object, Object, Object, Object, Object, Object])
], MomoPaymentStrategy);
//# sourceMappingURL=momo.strategy.js.map