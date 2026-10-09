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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassService = exports.IClassService = void 0;
const common_1 = require("@nestjs/common");
const _ = require("lodash");
const moment = require("moment-timezone");
const class_repository_1 = require("../repositories/class.repository");
const mongoose_1 = require("mongoose");
const constant_1 = require("../../common/contracts/constant");
const constant_2 = require("../contracts/constant");
const mongoose_2 = require("@nestjs/mongoose");
const constant_3 = require("../../transaction/contracts/constant");
const config_1 = require("@nestjs/config");
const payment_service_1 = require("../../transaction/services/payment.service");
const app_exception_1 = require("../../common/exceptions/app.exception");
const error_1 = require("../../common/contracts/error");
const learner_service_1 = require("../../learner/services/learner.service");
const transaction_service_1 = require("../../transaction/services/transaction.service");
const learner_class_service_1 = require("./learner-class.service");
const config_2 = require("../../config");
const garden_timesheet_service_1 = require("../../garden-timesheet/services/garden-timesheet.service");
const setting_service_1 = require("../../setting/services/setting.service");
const constant_4 = require("../../setting/contracts/constant");
const instructor_service_1 = require("../../instructor/services/instructor.service");
const notification_service_1 = require("../../notification/services/notification.service");
const constant_5 = require("../../notification/contracts/constant");
const course_service_1 = require("../../course/services/course.service");
const constant_6 = require("../../report/contracts/constant");
const report_service_1 = require("../../report/services/report.service");
exports.IClassService = Symbol('IClassService');
let ClassService = class ClassService {
    constructor(notificationService, connection, classRepository, configService, paymentService, transactionService, learnerService, learnerClassService, gardenTimesheetService, settingService, instructorService, courseService, reportService) {
        this.notificationService = notificationService;
        this.connection = connection;
        this.classRepository = classRepository;
        this.configService = configService;
        this.paymentService = paymentService;
        this.transactionService = transactionService;
        this.learnerService = learnerService;
        this.learnerClassService = learnerClassService;
        this.gardenTimesheetService = gardenTimesheetService;
        this.settingService = settingService;
        this.instructorService = instructorService;
        this.courseService = courseService;
        this.reportService = reportService;
    }
    async create(createClassDto, options) {
        const courseClass = await this.classRepository.create(createClassDto, options);
        return courseClass;
    }
    async findById(classId, projection, populates) {
        const courseClass = await this.classRepository.findOne({
            conditions: {
                _id: classId
            },
            projection,
            populates
        });
        return courseClass;
    }
    update(conditions, payload, options) {
        return this.classRepository.findOneAndUpdate(conditions, payload, options);
    }
    async listByInstructor(instructorId, pagination, queryClassDto, projection = constant_2.CLASS_LIST_PROJECTION) {
        const { title, type, level, status } = queryClassDto;
        const filter = {
            instructorId: new mongoose_1.Types.ObjectId(instructorId)
        };
        const validLevel = level?.filter((level) => [constant_1.CourseLevel.BASIC, constant_1.CourseLevel.INTERMEDIATE, constant_1.CourseLevel.ADVANCED].includes(level));
        if (validLevel?.length > 0) {
            filter['level'] = {
                $in: validLevel
            };
        }
        const validStatus = status?.filter((status) => [constant_1.ClassStatus.PUBLISHED, constant_1.ClassStatus.IN_PROGRESS, constant_1.ClassStatus.COMPLETED, constant_1.ClassStatus.CANCELED].includes(status));
        if (validStatus?.length > 0) {
            filter['status'] = {
                $in: validStatus
            };
        }
        if (title) {
            filter['$text'] = {
                $search: title
            };
        }
        if (type) {
            filter['type'] = type;
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
        });
    }
    async listByStaff(pagination, queryClassDto, projection = constant_2.CLASS_LIST_PROJECTION) {
        const { title, type, level, status } = queryClassDto;
        const filter = {};
        const validLevel = level?.filter((level) => [constant_1.CourseLevel.BASIC, constant_1.CourseLevel.INTERMEDIATE, constant_1.CourseLevel.ADVANCED].includes(level));
        if (validLevel?.length > 0) {
            filter['level'] = {
                $in: validLevel
            };
        }
        const validStatus = status?.filter((status) => [constant_1.ClassStatus.PUBLISHED, constant_1.ClassStatus.IN_PROGRESS, constant_1.ClassStatus.COMPLETED, constant_1.ClassStatus.CANCELED].includes(status));
        if (validStatus?.length > 0) {
            filter['status'] = {
                $in: validStatus
            };
        }
        if (title) {
            filter['$text'] = {
                $search: title
            };
        }
        if (type) {
            filter['type'] = type;
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
        });
    }
    async findManyByStatus(status) {
        const courseClasses = await this.classRepository.findMany({
            conditions: {
                status: {
                    $in: status
                }
            }
        });
        return courseClasses;
    }
    async findManyByInstructorIdAndStatus(instructorId, status) {
        const courseClasses = await this.classRepository.findMany({
            conditions: {
                instructorId: new mongoose_1.Types.ObjectId(instructorId),
                status: {
                    $in: status
                }
            }
        });
        return courseClasses;
    }
    async findManyByGardenIdAndStatus(gardenId, status) {
        const courseClasses = await this.classRepository.findMany({
            conditions: {
                gardenId: new mongoose_1.Types.ObjectId(gardenId),
                status: {
                    $in: status
                }
            }
        });
        return courseClasses;
    }
    async findMany(conditions, projection, populates) {
        const courseClasses = await this.classRepository.findMany({
            conditions,
            projection,
            populates
        });
        return courseClasses;
    }
    async generateCode() {
        const prefix = `ORCHID`;
        const lastRecord = await this.classRepository.model.findOne().sort({ createdAt: -1 });
        const number = parseInt(_.get(lastRecord, 'code', `${prefix}000`).split(prefix)[1]) + 1;
        return `${prefix}${number.toString().padStart(3, '0')}`;
    }
    async enrollClass(enrollClassDto) {
        const { classId, paymentMethod, learnerId, requestType = 'captureWallet' } = enrollClassDto;
        const [learner, courseClass, enrolledLearnerClass] = await Promise.all([
            this.learnerService.findById(learnerId?.toString()),
            this.findById(classId?.toString()),
            this.learnerClassService.findOneBy({
                learnerId: new mongoose_1.Types.ObjectId(learnerId),
                classId: new mongoose_1.Types.ObjectId(classId)
            })
        ]);
        if (learner.status === constant_1.LearnerStatus.UNVERIFIED)
            throw new app_exception_1.AppException(error_1.Errors.UNVERIFIED_ACCOUNT);
        if (learner.status === constant_1.LearnerStatus.INACTIVE)
            throw new app_exception_1.AppException(error_1.Errors.INACTIVE_ACCOUNT);
        if (!courseClass)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_NOT_FOUND);
        if (courseClass.status !== constant_1.ClassStatus.PUBLISHED)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_STATUS_INVALID);
        if (courseClass.learnerQuantity >= courseClass.learnerLimit)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_LEARNER_LIMIT);
        if (enrolledLearnerClass)
            throw new app_exception_1.AppException(error_1.Errors.LEARNER_CLASS_EXISTED);
        await this.checkDuplicateTimesheetWithMyClasses({ courseClass, learnerId: learnerId.toString() });
        const MAX_VALUE = 9007199254740991;
        const MIN_VALUE = 1000000000000000;
        const orderCode = Math.floor(MIN_VALUE + Math.random() * (MAX_VALUE - MIN_VALUE));
        const orderInfo = `Orchidify - Payment for order #${orderCode}`;
        const [course, learnerClasses] = await Promise.all([
            this.courseService.findById(courseClass.courseId.toString(), undefined, [
                {
                    path: 'combos',
                    select: ['childCourseIds', 'discount'],
                    match: { status: constant_1.CourseStatus.ACTIVE }
                }
            ]),
            this.learnerClassService.findMany({
                learnerId: new mongoose_1.Types.ObjectId(learnerId)
            })
        ]);
        const learnedCourseIdSet = new Set(learnerClasses.map((learnerClass) => learnerClass.courseId.toString()));
        const courseData = course.toObject();
        const combos = _.get(courseData, 'combos');
        let discount = 0;
        if (combos.length !== 0) {
            const clonedCourseIdSet = new Set([...learnedCourseIdSet]);
            clonedCourseIdSet.delete(course._id.toString());
            for (const combo of combos) {
                const matchedCourseIds = combo.childCourseIds.filter((childCourseId) => {
                    return childCourseId.toString() !== course._id.toString() && clonedCourseIdSet.has(childCourseId.toString());
                });
                if (matchedCourseIds.length > 0) {
                    const newDiscount = combo.discount;
                    discount = newDiscount > discount ? newDiscount : discount;
                }
            }
        }
        const price = _.get(courseData, 'price');
        let finalPrice = Math.round((price * (100 - discount)) / 100);
        finalPrice = finalPrice < config_2.MIN_PRICE ? config_2.MIN_PRICE : finalPrice;
        const session = await this.connection.startSession();
        let paymentResponse;
        try {
            await session.withTransaction(async () => {
                switch (paymentMethod) {
                    case constant_3.PaymentMethod.MOMO:
                        this.paymentService.setStrategy(constant_3.PaymentMethod.MOMO);
                        const createMomoPaymentDto = {
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
                        };
                        paymentResponse = await this.processPaymentWithMomo({
                            createMomoPaymentDto,
                            orderInfo,
                            courseClass,
                            orderCode,
                            learnerId,
                            paymentMethod,
                            session
                        });
                        break;
                    case constant_3.PaymentMethod.ZALO_PAY:
                    case constant_3.PaymentMethod.PAY_OS:
                    case constant_3.PaymentMethod.STRIPE:
                    default:
                        this.paymentService.setStrategy(constant_3.PaymentMethod.STRIPE);
                        const createStripePaymentDto = {
                            customerEmail: learner.email,
                            description: orderInfo,
                            amount: finalPrice,
                            metadata: { classId: classId.toString(), learnerId: learnerId.toString(), orderCode, price, discount }
                        };
                        paymentResponse = await this.processPaymentWithStripe({
                            createStripePaymentDto,
                            orderInfo,
                            courseClass,
                            orderCode,
                            learnerId,
                            paymentMethod,
                            session
                        });
                        break;
                }
            });
            return paymentResponse;
        }
        finally {
            await session.endSession();
        }
    }
    async checkDuplicateTimesheetWithMyClasses(params) {
        const { courseClass, learnerId } = params;
        const { startDate, duration, weekdays, slotNumbers } = courseClass;
        const startOfDate = moment(startDate).tz(config_2.VN_TIMEZONE).startOf('date');
        const endOfDate = startOfDate.clone().add(duration, 'week').startOf('date');
        const classDates = [];
        let currentDate = startOfDate.clone();
        while (currentDate.isSameOrBefore(endOfDate)) {
            for (let weekday of weekdays) {
                const searchDate = currentDate.clone().isoWeekday(weekday);
                if (searchDate.isSameOrAfter(startOfDate) && searchDate.isBefore(endOfDate)) {
                    classDates.push(searchDate.toDate());
                }
            }
            currentDate.add(1, 'week');
        }
        const learnerClasses = await this.learnerClassService.findMany({
            learnerId: new mongoose_1.Types.ObjectId(learnerId)
        });
        const classIds = learnerClasses.map((learnerClass) => learnerClass.classId);
        const timesheets = await this.gardenTimesheetService.findMany({
            date: { $in: classDates },
            'slots.classId': {
                $in: classIds
            }
        });
        const notAvailableSlots = this.getNotAvailableSlots(timesheets, classIds.map((classId) => classId.toString()), slotNumbers);
        if (notAvailableSlots.length > 0)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_TIMESHEET_INVALID);
    }
    getNotAvailableSlots(timesheets, classIds, slotNumbers) {
        const calendars = [];
        for (const timesheet of timesheets) {
            for (const slot of timesheet.slots) {
                if (slot.status === constant_1.SlotStatus.NOT_AVAILABLE &&
                    classIds.includes(slot.classId.toString()) &&
                    slotNumbers.includes(slot.slotNumber)) {
                    _.set(slot, 'gardenMaxClass', timesheet.gardenMaxClass);
                    calendars.push(slot);
                }
            }
        }
        return calendars;
    }
    async processPaymentWithMomo(params) {
        const { createMomoPaymentDto, orderInfo, courseClass, orderCode, learnerId, paymentMethod, session } = params;
        const paymentResponse = await this.paymentService.createTransaction(createMomoPaymentDto);
        const transaction = await this.paymentService.getTransaction({
            orderId: paymentResponse.orderId,
            requestId: paymentResponse.requestId,
            lang: 'vi'
        });
        const paymentPayload = {
            id: transaction?.transId?.toString(),
            code: orderCode.toString(),
            createdAt: new Date(),
            status: transaction?.resultCode?.toString(),
            ...transaction
        };
        const payment = {
            ...paymentPayload,
            histories: [paymentPayload]
        };
        await this.transactionService.create({
            type: constant_3.TransactionType.PAYMENT,
            paymentMethod,
            amount: createMomoPaymentDto.amount,
            debitAccount: { userId: learnerId, userRole: constant_1.UserRole.LEARNER },
            creditAccount: { userRole: 'SYSTEM' },
            description: orderInfo,
            status: constant_1.TransactionStatus.DRAFT,
            payment
        }, {
            session
        });
        return paymentResponse;
    }
    async processPaymentWithStripe(params) {
        const { createStripePaymentDto, orderInfo, orderCode, learnerId, paymentMethod, session } = params;
        const paymentResponse = await this.paymentService.createTransaction(createStripePaymentDto);
        const transaction = await this.paymentService.getTransaction({
            id: paymentResponse?.id
        });
        const paymentPayload = {
            id: transaction?.id,
            code: orderCode.toString(),
            createdAt: new Date(),
            status: transaction?.status,
            ...transaction
        };
        const payment = {
            ...paymentPayload,
            histories: [paymentPayload]
        };
        await this.transactionService.create({
            type: constant_3.TransactionType.PAYMENT,
            paymentMethod,
            amount: createStripePaymentDto.amount,
            debitAccount: { userId: learnerId, userRole: constant_1.UserRole.LEARNER },
            creditAccount: { userRole: 'SYSTEM' },
            description: orderInfo,
            status: constant_1.TransactionStatus.DRAFT,
            payment
        }, {
            session
        });
        return paymentResponse;
    }
    async completeClass(classId, userAuth) {
        const { _id, role } = userAuth;
        const session = await this.connection.startSession();
        let courseClass;
        try {
            await session.withTransaction(async () => {
                courseClass = await this.update({ _id: new mongoose_1.Types.ObjectId(classId) }, {
                    $set: {
                        status: constant_1.ClassStatus.COMPLETED
                    },
                    $push: {
                        histories: {
                            status: constant_1.ClassStatus.COMPLETED,
                            timestamp: new Date(),
                            userId: new mongoose_1.Types.ObjectId(_id),
                            userRole: role
                        }
                    }
                }, { new: true, session });
                let totalPrice = 0;
                const learnerClasses = await this.learnerClassService.findMany({ classId: new mongoose_1.Types.ObjectId(classId) }, [
                    'learnerId',
                    'classId',
                    'price',
                    'discount'
                ]);
                learnerClasses.forEach((learnerClass) => {
                    const price = learnerClass.price || 0;
                    const discount = learnerClass.discount || 0;
                    totalPrice += (price * (100 - discount)) / 100;
                });
                const commissionRate = Number((await this.settingService.findByKey(constant_4.SettingKey.CommissionRate))?.value) || 0.2;
                const { instructorId } = courseClass;
                const earnings = Math.floor(totalPrice * (1 - commissionRate));
                const systemEarnings = totalPrice - earnings;
                await this.instructorService.update({ _id: instructorId }, {
                    $inc: { balance: earnings }
                }, { session });
                this.updateClassReportWhenClassCompleted({ instructorId: courseClass.instructorId });
                this.updateRevenueReportWhenClassCompleted({
                    instructorId,
                    earnings,
                    systemEarnings
                });
            });
        }
        finally {
            await session.endSession();
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: `Class ${courseClass.code} has completed`,
            body: `Class ${courseClass.code}: ${courseClass.title} has completed. The payment has been added to your balance.`,
            receiverIds: [courseClass.instructorId.toString()],
            data: {
                type: constant_5.FCMNotificationDataType.CLASS,
                id: classId
            }
        });
    }
    getClassEndTime(params) {
        const { startDate, duration, weekdays, slotNumbers } = params;
        const startOfDate = moment(startDate).tz(config_2.VN_TIMEZONE).startOf('date');
        const endOfDate = startOfDate.clone().add(duration, 'week').startOf('date');
        const classDates = [];
        let currentDate = startOfDate.clone();
        while (currentDate.isSameOrBefore(endOfDate)) {
            for (let weekday of weekdays) {
                const classDate = currentDate.clone().isoWeekday(weekday);
                if (classDate.isSameOrAfter(startOfDate) && classDate.isBefore(endOfDate)) {
                    classDates.push(classDate);
                }
            }
            currentDate.add(1, 'week');
        }
        let classEndTime = classDates[classDates.length - 1];
        if (!slotNumbers)
            return classEndTime;
        switch (slotNumbers[0]) {
            case constant_1.SlotNumber.ONE:
                classEndTime = classEndTime.clone().add(9, 'hour');
                break;
            case constant_1.SlotNumber.TWO:
                classEndTime = classEndTime.clone().add(11, 'hour').add(30, 'minute');
                break;
            case constant_1.SlotNumber.THREE:
                classEndTime = classEndTime.clone().add(15, 'hour');
                break;
            case constant_1.SlotNumber.FOUR:
                classEndTime = classEndTime.clone().add(17, 'hour').add(30, 'minute');
                break;
        }
        return classEndTime;
    }
    async cancelClass(classId, cancelClassDto, userAuth) {
        const { cancelReason } = cancelClassDto;
        const { _id, role } = userAuth;
        const refundTransactionLearnerIds = [];
        let courseClass;
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                courseClass = await this.update({ _id: new mongoose_1.Types.ObjectId(classId) }, {
                    $set: {
                        status: constant_1.ClassStatus.CANCELED,
                        cancelReason
                    },
                    $push: {
                        histories: {
                            status: constant_1.ClassStatus.CANCELED,
                            timestamp: new Date(),
                            userId: new mongoose_1.Types.ObjectId(_id),
                            userRole: role
                        }
                    }
                }, { new: true, session });
                const { startDate, duration, weekdays, gardenId } = courseClass;
                const startOfDate = moment(startDate).tz(config_2.VN_TIMEZONE).startOf('date');
                const endOfDate = startOfDate.clone().add(duration, 'week').startOf('date');
                const searchDates = [];
                let currentDate = startOfDate.clone();
                while (currentDate.isSameOrBefore(endOfDate)) {
                    for (let weekday of weekdays) {
                        const searchDate = currentDate.clone().isoWeekday(weekday);
                        if (searchDate.isSameOrAfter(startOfDate) && searchDate.isBefore(endOfDate)) {
                            searchDates.push(searchDate.toDate());
                        }
                    }
                    currentDate.add(1, 'week');
                }
                await this.gardenTimesheetService.updateMany({
                    date: {
                        $in: searchDates
                    },
                    status: constant_1.GardenTimesheetStatus.ACTIVE,
                    gardenId: gardenId
                }, {
                    $pull: {
                        slots: { classId: new mongoose_1.Types.ObjectId(classId) }
                    }
                }, { session });
                const learnerClasses = await this.learnerClassService.findMany({ classId: new mongoose_1.Types.ObjectId(classId) }, ['learnerId', 'transactionId', 'classId'], [
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
                ]);
                if (learnerClasses.length === 0)
                    return;
                const refundTransactionPromises = [];
                learnerClasses.forEach((learnerClass) => {
                    if (_.get(learnerClass, 'transaction.paymentMethod') === constant_3.PaymentMethod.STRIPE) {
                        this.paymentService.setStrategy(constant_3.PaymentMethod.STRIPE);
                        if (_.get(learnerClass, 'transaction.payment.status') === constant_3.StripeStatus.SUCCEEDED) {
                            const stripePaymentObject = _.get(learnerClass, 'transaction.payment.object');
                            let transactionId = '';
                            if (stripePaymentObject === 'payment_intent') {
                                transactionId = _.get(learnerClass, 'transaction.payment.id');
                            }
                            else if (stripePaymentObject === 'charge') {
                                transactionId = _.get(learnerClass, 'transaction.payment.payment_intent');
                            }
                            refundTransactionPromises.push(this.paymentService.refundTransaction({
                                id: transactionId,
                                amount: _.get(learnerClass, 'transaction.payment.amount'),
                                metadata: {
                                    classId: classId.toString(),
                                    learnerId: _.get(learnerClass, 'learnerId').toString(),
                                    orderCode: _.get(learnerClass, 'transaction.payment.code')
                                }
                            }));
                            refundTransactionLearnerIds.push(_.get(learnerClass, 'learnerId'));
                        }
                    }
                });
                await Promise.all(refundTransactionPromises);
                this.updateClassReportWhenClassCanceled({
                    instructorId: courseClass.instructorId,
                    status: courseClass.status
                });
            });
        }
        finally {
            await session.endSession();
        }
        this.sendCancelClassNotificationForLearner(refundTransactionLearnerIds, courseClass);
        this.notificationService.sendFirebaseCloudMessaging({
            title: `Class ${courseClass.code} has been cancelled`,
            body: `Class ${courseClass.code}: ${courseClass.title} has been cancelled. Click to view details.`,
            receiverIds: [courseClass.instructorId.toString()],
            data: {
                type: constant_5.FCMNotificationDataType.CLASS,
                id: classId
            }
        });
    }
    async viewReportClassByRate() {
        return this.classRepository.model.aggregate([
            {
                $match: {
                    status: { $ne: constant_1.ClassStatus.DELETED }
                }
            },
            {
                $bucket: {
                    groupBy: '$rate',
                    boundaries: [0, 1, 2, 3, 4, 5.1]
                }
            }
        ]);
    }
    async sendCancelClassNotificationForLearner(refundTransactionLearnerIds, courseClass) {
        const learners = await this.learnerService.findMany({
            _id: { $in: refundTransactionLearnerIds }
        });
        const sendCancelClassEmailPromises = [];
        learners.forEach((learner) => {
            sendCancelClassEmailPromises.push(this.notificationService.sendMail({
                to: learner.email,
                subject: `[Orchidify] Class Cancellation Notice`,
                template: 'learner/cancel-class',
                context: {
                    name: learner.name,
                    classTitle: courseClass.title
                }
            }));
        });
        sendCancelClassEmailPromises.push(this.notificationService.sendFirebaseCloudMessaging({
            title: `The class you registered for has been cancelled`,
            body: `Class ${courseClass.code}: ${courseClass.title} has been cancelled. Click to view details.`,
            receiverIds: refundTransactionLearnerIds.map((learnerId) => learnerId.toString()),
            data: {
                type: constant_5.FCMNotificationDataType.CLASS,
                id: courseClass._id.toString()
            }
        }));
        await Promise.all(sendCancelClassEmailPromises);
    }
    updateClassReportWhenClassCompleted({ instructorId }) {
        this.reportService.update({ type: constant_6.ReportType.ClassSum, tag: constant_6.ReportTag.System }, {
            $inc: {
                [`data.${constant_1.ClassStatus.IN_PROGRESS}.quantity`]: -1,
                [`data.${constant_1.ClassStatus.COMPLETED}.quantity`]: 1
            }
        });
        this.reportService.update({ type: constant_6.ReportType.ClassSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(instructorId) }, {
            $inc: {
                [`data.${constant_1.ClassStatus.IN_PROGRESS}.quantity`]: -1,
                [`data.${constant_1.ClassStatus.COMPLETED}.quantity`]: 1
            }
        });
    }
    updateRevenueReportWhenClassCompleted({ instructorId, systemEarnings, earnings }) {
        this.reportService.update({ type: constant_6.ReportType.RevenueSum, tag: constant_6.ReportTag.System }, {
            $inc: {
                'data.total': systemEarnings
            }
        });
        this.reportService.update({ type: constant_6.ReportType.RevenueSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(instructorId) }, {
            $inc: {
                'data.total': earnings
            }
        });
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        this.reportService.update({
            type: constant_6.ReportType.RevenueSumByMonth,
            tag: constant_6.ReportTag.System,
            'data.year': year
        }, {
            $inc: {
                [`data.${month}.total`]: earnings
            }
        });
        this.reportService.update({
            type: constant_6.ReportType.RevenueSumByMonth,
            tag: constant_6.ReportTag.User,
            ownerId: new mongoose_1.Types.ObjectId(instructorId),
            'data.year': year
        }, {
            $inc: {
                [`data.${month}.total`]: earnings
            }
        });
    }
    updateClassReportWhenClassCanceled({ instructorId, status }) {
        this.reportService.update({ type: constant_6.ReportType.ClassSum, tag: constant_6.ReportTag.System }, {
            $inc: {
                [`data.${status}.quantity`]: -1,
                [`data.${constant_1.ClassStatus.CANCELED}.quantity`]: 1
            }
        });
        this.reportService.update({ type: constant_6.ReportType.ClassSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(instructorId) }, {
            $inc: {
                [`data.${status}.quantity`]: -1,
                [`data.${constant_1.ClassStatus.CANCELED}.quantity`]: 1
            }
        });
    }
};
exports.ClassService = ClassService;
exports.ClassService = ClassService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __param(1, (0, mongoose_2.InjectConnection)()),
    __param(2, (0, common_1.Inject)(class_repository_1.IClassRepository)),
    __param(4, (0, common_1.Inject)(payment_service_1.IPaymentService)),
    __param(5, (0, common_1.Inject)(transaction_service_1.ITransactionService)),
    __param(6, (0, common_1.Inject)(learner_service_1.ILearnerService)),
    __param(7, (0, common_1.Inject)(learner_class_service_1.ILearnerClassService)),
    __param(8, (0, common_1.Inject)(garden_timesheet_service_1.IGardenTimesheetService)),
    __param(9, (0, common_1.Inject)(setting_service_1.ISettingService)),
    __param(10, (0, common_1.Inject)(instructor_service_1.IInstructorService)),
    __param(11, (0, common_1.Inject)(course_service_1.ICourseService)),
    __param(12, (0, common_1.Inject)(report_service_1.IReportService)),
    __metadata("design:paramtypes", [Object, mongoose_1.Connection, Object, config_1.ConfigService, Object, Object, Object, Object, Object, Object, Object, Object, Object])
], ClassService);
//# sourceMappingURL=class.service.js.map