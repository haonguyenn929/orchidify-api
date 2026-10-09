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
var ClassRequestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassRequestService = exports.IClassRequestService = void 0;
const common_1 = require("@nestjs/common");
const moment = require("moment-timezone");
const _ = require("lodash");
const class_request_repository_1 = require("../repositories/class-request.repository");
const mongoose_1 = require("mongoose");
const constant_1 = require("../../common/contracts/constant");
const constant_2 = require("../contracts/constant");
const config_1 = require("../../config");
const dto_1 = require("../../common/contracts/dto");
const app_exception_1 = require("../../common/exceptions/app.exception");
const error_1 = require("../../common/contracts/error");
const course_service_1 = require("../../course/services/course.service");
const garden_timesheet_service_1 = require("../../garden-timesheet/services/garden-timesheet.service");
const app_logger_service_1 = require("../../common/services/app-logger.service");
const class_service_1 = require("../../class/services/class.service");
const mongoose_2 = require("@nestjs/mongoose");
const progress_dto_1 = require("../../class/dto/progress.dto");
const queue_producer_service_1 = require("../../queue/services/queue-producer.service");
const constant_3 = require("../../queue/contracts/constant");
const setting_service_1 = require("../../setting/services/setting.service");
const constant_4 = require("../../setting/contracts/constant");
const helper_service_1 = require("../../common/services/helper.service");
const learner_class_service_1 = require("../../class/services/learner-class.service");
const notification_service_1 = require("../../notification/services/notification.service");
const constant_5 = require("../../notification/contracts/constant");
const staff_service_1 = require("../../staff/services/staff.service");
const report_service_1 = require("../../report/services/report.service");
const constant_6 = require("../../report/contracts/constant");
exports.IClassRequestService = Symbol('IClassRequestService');
let ClassRequestService = ClassRequestService_1 = class ClassRequestService {
    constructor(helperService, classRequestRepository, courseService, gardenTimesheetService, classService, connection, queueProducerService, settingService, learnerClassService, notificationService, staffService, reportService) {
        this.helperService = helperService;
        this.classRequestRepository = classRequestRepository;
        this.courseService = courseService;
        this.gardenTimesheetService = gardenTimesheetService;
        this.classService = classService;
        this.connection = connection;
        this.queueProducerService = queueProducerService;
        this.settingService = settingService;
        this.learnerClassService = learnerClassService;
        this.notificationService = notificationService;
        this.staffService = staffService;
        this.reportService = reportService;
        this.appLogger = new app_logger_service_1.AppLogger(ClassRequestService_1.name);
    }
    async createPublishClassRequest(createPublishClassRequestDto, options) {
        const classRequest = await this.classRequestRepository.create(createPublishClassRequestDto, options);
        await this.courseService.update({ _id: classRequest.courseId }, {
            $set: {
                isRequesting: true
            }
        });
        this.addClassRequestAutoExpiredJob(classRequest);
        this.sendNotificationToStaffWhenClassRequestIsCreated({ classRequest });
        this.reportService.update({ type: constant_6.ReportType.ClassRequestSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(classRequest.createdBy) }, {
            $inc: {
                'data.quantity': 1,
                [`data.${constant_1.ClassRequestStatus.PENDING}.quantity`]: 1
            }
        });
        return classRequest;
    }
    async createCancelClassRequest(createCancelClassRequestDto, options) {
        const classRequest = await this.classRequestRepository.create(createCancelClassRequestDto, options);
        this.addClassRequestAutoExpiredJob(classRequest);
        this.reportService.update({ type: constant_6.ReportType.ClassRequestSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(classRequest.createdBy) }, {
            $inc: {
                'data.quantity': 1,
                [`data.${constant_1.ClassRequestStatus.PENDING}.quantity`]: 1
            }
        });
        return classRequest;
    }
    async findById(classRequestId, projection, populates) {
        const classRequest = await this.classRequestRepository.findOne({
            conditions: {
                _id: classRequestId
            },
            projection,
            populates
        });
        return classRequest;
    }
    update(conditions, payload, options) {
        return this.classRequestRepository.findOneAndUpdate(conditions, payload, options);
    }
    async list(pagination, queryClassRequestDto, projection = constant_2.CLASS_REQUEST_LIST_PROJECTION, populates) {
        const { type, status, createdBy } = queryClassRequestDto;
        const filter = {};
        if (createdBy) {
            filter['createdBy'] = new mongoose_1.Types.ObjectId(createdBy);
        }
        const validType = type?.filter((level) => [constant_1.ClassRequestType.PUBLISH_CLASS, constant_1.ClassRequestType.CANCEL_CLASS].includes(level));
        if (validType?.length > 0) {
            filter['type'] = {
                $in: validType
            };
        }
        const validStatus = status?.filter((status) => [
            constant_1.ClassRequestStatus.PENDING,
            constant_1.ClassRequestStatus.APPROVED,
            constant_1.ClassRequestStatus.CANCELED,
            constant_1.ClassRequestStatus.EXPIRED,
            constant_1.ClassRequestStatus.REJECTED
        ].includes(status));
        if (validStatus?.length > 0) {
            filter['status'] = {
                $in: validStatus
            };
        }
        return this.classRequestRepository.model.paginate(filter, {
            ...pagination,
            projection: ['-metadata.sessions', '-metadata.media', '-histories'],
            populate: populates
        });
    }
    async findMany(conditions, projection, populates) {
        const classRequests = await this.classRequestRepository.findMany({
            conditions,
            projection,
            populates
        });
        return classRequests;
    }
    async findManyByStatus(status) {
        const classRequests = await this.classRequestRepository.findMany({
            conditions: {
                status: {
                    $in: status
                }
            }
        });
        return classRequests;
    }
    async findManyByCreatedByAndStatus(createdBy, status) {
        const classRequests = await this.classRequestRepository.findMany({
            conditions: {
                createdBy: new mongoose_1.Types.ObjectId(createdBy),
                status: {
                    $in: status
                }
            }
        });
        return classRequests;
    }
    countByCreatedByAndDate(createdBy, date) {
        const startOfDate = moment(date).tz(config_1.VN_TIMEZONE).startOf('date');
        const endOfDate = moment(date).tz(config_1.VN_TIMEZONE).endOf('date');
        return this.classRequestRepository.model.countDocuments({
            createdBy: new mongoose_1.Types.ObjectId(createdBy),
            createdAt: {
                $gte: startOfDate.toDate(),
                $lte: endOfDate.toDate()
            }
        });
    }
    async cancelClassRequest(classRequestId, userAuth) {
        const { _id, role } = userAuth;
        const classRequest = await this.findById(classRequestId);
        if (!classRequest || classRequest.createdBy.toString() !== _id)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_NOT_FOUND);
        if (classRequest.status !== constant_1.ClassRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_STATUS_INVALID);
        if (classRequest.type === constant_1.ClassRequestType.PUBLISH_CLASS) {
            const course = await this.courseService.findById(classRequest.courseId?.toString());
            if (!course || course.instructorId.toString() !== _id)
                throw new app_exception_1.AppException(error_1.Errors.COURSE_NOT_FOUND);
            if (course.status === constant_1.CourseStatus.DELETED)
                throw new app_exception_1.AppException(error_1.Errors.COURSE_STATUS_INVALID);
            const session = await this.connection.startSession();
            try {
                await session.withTransaction(async () => {
                    await this.update({ _id: classRequestId }, {
                        $set: {
                            status: constant_1.ClassRequestStatus.CANCELED
                        },
                        $push: {
                            histories: {
                                status: constant_1.ClassRequestStatus.CANCELED,
                                timestamp: new Date(),
                                userId: new mongoose_1.Types.ObjectId(_id),
                                userRole: role
                            }
                        }
                    }, { session });
                    await this.courseService.update({ _id: classRequest.courseId }, {
                        $set: {
                            isRequesting: false
                        }
                    }, { session });
                });
            }
            finally {
                await session.endSession();
            }
        }
        else if (classRequest.type === constant_1.ClassRequestType.CANCEL_CLASS) {
            const courseClass = await this.classService.findById(classRequest.classId?.toString());
            if (!courseClass || courseClass.instructorId.toString() !== _id)
                throw new app_exception_1.AppException(error_1.Errors.CLASS_NOT_FOUND);
            const session = await this.connection.startSession();
            try {
                await session.withTransaction(async () => {
                    await this.update({ _id: classRequestId }, {
                        $set: {
                            status: constant_1.ClassRequestStatus.CANCELED
                        },
                        $push: {
                            histories: {
                                status: constant_1.ClassRequestStatus.CANCELED,
                                timestamp: new Date(),
                                userId: new mongoose_1.Types.ObjectId(_id),
                                userRole: role
                            }
                        }
                    }, { session });
                });
            }
            finally {
                await session.endSession();
            }
        }
        this.queueProducerService.removeJob(constant_3.QueueName.CLASS_REQUEST, classRequestId);
        this.reportService.update({ type: constant_6.ReportType.ClassRequestSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(classRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.ClassRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async approveClassRequest(classRequestId, approveClassRequestDto, userAuth) {
        const { gardenId } = approveClassRequestDto;
        const { _id, role } = userAuth;
        const classRequest = await this.findById(classRequestId);
        if (!classRequest)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_NOT_FOUND);
        if (classRequest.status !== constant_1.ClassRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_STATUS_INVALID);
        if (classRequest.type === constant_1.ClassRequestType.PUBLISH_CLASS) {
            if (!gardenId)
                throw new app_exception_1.AppException(error_1.Errors.GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST);
            const course = await this.courseService.findById(classRequest.courseId?.toString(), ['+sessions']);
            if (!course)
                throw new app_exception_1.AppException(error_1.Errors.COURSE_NOT_FOUND);
            if (course.status === constant_1.CourseStatus.DELETED)
                throw new app_exception_1.AppException(error_1.Errors.COURSE_STATUS_INVALID);
            const { startDate, duration, weekdays, slotNumbers } = classRequest?.metadata;
            const availableSlots = await this.gardenTimesheetService.viewAvailableTime({
                startDate,
                duration,
                weekdays,
                instructorId: course.instructorId
            });
            this.appLogger.log(`getAvailableGardenList: slotNumbers=${slotNumbers}, availableSlotNumbers=${availableSlots.slotNumbers}, availableTimeOfGardens=${JSON.stringify(availableSlots.availableTimeOfGardens)}`);
            if (_.difference(slotNumbers, availableSlots.slotNumbers).length !== 0)
                throw new app_exception_1.AppException(error_1.Errors.GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST);
            const availableGardens = availableSlots.availableTimeOfGardens.filter((availableTimeOfGarden) => {
                this.appLogger.log(`gardenId=${availableTimeOfGarden.gardenId}, slotNumbers=${availableTimeOfGarden.slotNumbers}`);
                return _.difference(slotNumbers, availableTimeOfGarden.slotNumbers).length === 0;
            });
            if (availableGardens.length === 0)
                throw new app_exception_1.AppException(error_1.Errors.GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST);
            const garden = availableGardens.find((availableGarden) => availableGarden.gardenId?.toString() === gardenId);
            if (!garden)
                throw new app_exception_1.AppException(error_1.Errors.GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST);
            const session = await this.connection.startSession();
            try {
                await session.withTransaction(async () => {
                    await this.classRequestRepository.findOneAndUpdate({ _id: classRequestId }, {
                        $set: {
                            status: constant_1.ClassRequestStatus.APPROVED
                        },
                        $push: {
                            histories: {
                                status: constant_1.ClassRequestStatus.APPROVED,
                                timestamp: new Date(),
                                userId: new mongoose_1.Types.ObjectId(_id),
                                userRole: role
                            }
                        }
                    }, { session });
                    await this.courseService.update({ _id: classRequest.courseId }, {
                        $set: {
                            status: constant_1.CourseStatus.ACTIVE,
                            isRequesting: false
                        }
                    }, { session });
                    const classData = _.pick(classRequest.metadata, [
                        'title',
                        'description',
                        'startDate',
                        'price',
                        'level',
                        'type',
                        'duration',
                        'thumbnail',
                        'media',
                        'sessions',
                        'learnerLimit',
                        'weekdays',
                        'slotNumbers',
                        'gardenRequiredToolkits',
                        'instructorId'
                    ]);
                    classData['code'] = await this.classService.generateCode();
                    classData['status'] = constant_1.ClassStatus.PUBLISHED;
                    classData['histories'] = [
                        {
                            status: constant_1.ClassStatus.PUBLISHED,
                            timestamp: new Date(),
                            userId: new mongoose_1.Types.ObjectId(_id),
                            userRole: role
                        }
                    ];
                    classData['learnerQuantity'] = 0;
                    classData['gardenId'] = new mongoose_1.Types.ObjectId(gardenId);
                    classData['courseId'] = classRequest.courseId;
                    classData['progress'] = new progress_dto_1.BaseProgressDto(_.get(classData, ['duration']) * 2, 0);
                    let sessions = _.get(classRequest, 'metadata.sessions');
                    classData['sessions'] = this.generateDeadlineClassAssignment({ sessions, startDate, duration, weekdays });
                    const createdClass = await this.classService.create(classData, { session });
                    await this.gardenTimesheetService.generateSlotsForClass({
                        startDate,
                        duration,
                        weekdays,
                        slotNumbers,
                        gardenId: new mongoose_1.Types.ObjectId(gardenId),
                        instructorId: course.instructorId,
                        classId: new mongoose_1.Types.ObjectId(createdClass._id),
                        metadata: { code: createdClass.code, title: createdClass.title },
                        courseData: course
                    }, { session });
                    if (course.status === constant_1.CourseStatus.DRAFT) {
                        this.updateCourseReportWhenPublishClassRequestApproved({ instructorId: createdClass.instructorId });
                    }
                    this.updateClassReportWhenPublishClassRequestApproved({ instructorId: createdClass.instructorId });
                });
            }
            finally {
                await session.endSession();
            }
        }
        else if (classRequest.type === constant_1.ClassRequestType.CANCEL_CLASS) {
            const courseClass = await this.classService.findById(classRequest.classId?.toString());
            if (!courseClass)
                throw new app_exception_1.AppException(error_1.Errors.CLASS_NOT_FOUND);
            if (courseClass.status !== constant_1.ClassStatus.PUBLISHED)
                throw new app_exception_1.AppException(error_1.Errors.CLASS_STATUS_INVALID);
            const learnerClasses = await this.learnerClassService.findMany({
                classId: courseClass._id
            });
            if (learnerClasses.length > 0)
                throw new app_exception_1.AppException(error_1.Errors.CANCEL_CLASS_REQUEST_CAN_NOT_BE_APPROVED);
            const session = await this.connection.startSession();
            try {
                await session.withTransaction(async () => {
                    await this.classRequestRepository.findOneAndUpdate({ _id: classRequestId }, {
                        $set: {
                            status: constant_1.ClassRequestStatus.APPROVED
                        },
                        $push: {
                            histories: {
                                status: constant_1.ClassRequestStatus.APPROVED,
                                timestamp: new Date(),
                                userId: new mongoose_1.Types.ObjectId(_id),
                                userRole: role
                            }
                        }
                    }, { session });
                    await this.classService.update({ _id: new mongoose_1.Types.ObjectId(courseClass._id) }, {
                        $set: {
                            status: constant_1.ClassStatus.CANCELED,
                            cancelReason: classRequest.description
                        },
                        $push: {
                            histories: {
                                status: constant_1.ClassStatus.CANCELED,
                                timestamp: new Date(),
                                userId: new mongoose_1.Types.ObjectId(courseClass.instructorId),
                                userRole: constant_1.UserRole.INSTRUCTOR
                            }
                        }
                    }, { new: true, session });
                    const { startDate, duration, weekdays, gardenId } = courseClass;
                    const startOfDate = moment(startDate).tz(config_1.VN_TIMEZONE).startOf('date');
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
                            slots: { classId: new mongoose_1.Types.ObjectId(courseClass._id) }
                        }
                    }, { session });
                    this.updateClassReportWhenCancelClassRequestApproved({
                        instructorId: courseClass.instructorId,
                        status: courseClass.status
                    });
                });
            }
            finally {
                await session.endSession();
            }
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: 'Your class request has been approved',
            body: classRequest.type === constant_1.ClassRequestType.PUBLISH_CLASS
                ? 'Class has been published. Click to view details.'
                : 'Class has been cancelled. Click to view details.',
            receiverIds: [classRequest.createdBy.toString()],
            data: {
                type: constant_5.FCMNotificationDataType.CLASS_REQUEST,
                id: classRequestId
            }
        });
        this.queueProducerService.removeJob(constant_3.QueueName.CLASS_REQUEST, classRequestId);
        this.reportService.update({ type: constant_6.ReportType.ClassRequestSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(classRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.ClassRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async rejectClassRequest(classRequestId, RejectClassRequestDto, userAuth) {
        const { rejectReason } = RejectClassRequestDto;
        const { _id, role } = userAuth;
        const classRequest = await this.findById(classRequestId);
        if (!classRequest)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_NOT_FOUND);
        if (classRequest.status !== constant_1.ClassRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_STATUS_INVALID);
        if (classRequest.type === constant_1.ClassRequestType.PUBLISH_CLASS) {
            const course = await this.courseService.findById(classRequest.courseId?.toString());
            if (!course)
                throw new app_exception_1.AppException(error_1.Errors.COURSE_NOT_FOUND);
            if (course.status === constant_1.CourseStatus.DELETED)
                throw new app_exception_1.AppException(error_1.Errors.COURSE_STATUS_INVALID);
            const session = await this.connection.startSession();
            try {
                await session.withTransaction(async () => {
                    await this.update({ _id: classRequestId }, {
                        $set: {
                            status: constant_1.ClassRequestStatus.REJECTED,
                            rejectReason
                        },
                        $push: {
                            histories: {
                                status: constant_1.ClassRequestStatus.REJECTED,
                                timestamp: new Date(),
                                userId: new mongoose_1.Types.ObjectId(_id),
                                userRole: role
                            }
                        }
                    }, { session });
                    await this.courseService.update({ _id: classRequest.courseId }, {
                        $set: {
                            isRequesting: false
                        }
                    }, { session });
                });
            }
            finally {
                await session.endSession();
            }
        }
        else if (classRequest.type === constant_1.ClassRequestType.CANCEL_CLASS) {
            const courseClass = await this.classService.findById(classRequest.classId?.toString());
            if (!courseClass)
                throw new app_exception_1.AppException(error_1.Errors.CLASS_NOT_FOUND);
            const session = await this.connection.startSession();
            try {
                await session.withTransaction(async () => {
                    await this.update({ _id: classRequestId }, {
                        $set: {
                            status: constant_1.ClassRequestStatus.REJECTED,
                            rejectReason
                        },
                        $push: {
                            histories: {
                                status: constant_1.ClassRequestStatus.REJECTED,
                                timestamp: new Date(),
                                userId: new mongoose_1.Types.ObjectId(_id),
                                userRole: role
                            }
                        }
                    }, { session });
                });
            }
            finally {
                await session.endSession();
            }
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: 'Your class request has been rejected',
            body: classRequest.type === constant_1.ClassRequestType.PUBLISH_CLASS
                ? 'Class publication request was not approved. Click to view details.'
                : 'Class cancellation request was not approved. Click to view details.',
            receiverIds: [classRequest.createdBy.toString()],
            data: {
                type: constant_5.FCMNotificationDataType.CLASS_REQUEST,
                id: classRequestId
            }
        });
        this.queueProducerService.removeJob(constant_3.QueueName.CLASS_REQUEST, classRequestId);
        this.reportService.update({ type: constant_6.ReportType.ClassRequestSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(classRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.ClassRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async expirePublishClassRequest(classRequestId, userAuth) {
        const { _id, role } = userAuth;
        const classRequest = await this.findById(classRequestId);
        if (!classRequest || classRequest.type !== constant_1.ClassRequestType.PUBLISH_CLASS)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_NOT_FOUND);
        if (classRequest.status !== constant_1.ClassRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_STATUS_INVALID);
        const course = await this.courseService.findById(classRequest.courseId?.toString());
        if (!course)
            throw new app_exception_1.AppException(error_1.Errors.COURSE_NOT_FOUND);
        if (course.status === constant_1.CourseStatus.DELETED)
            throw new app_exception_1.AppException(error_1.Errors.COURSE_STATUS_INVALID);
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                await this.update({ _id: classRequestId }, {
                    $set: {
                        status: constant_1.ClassRequestStatus.EXPIRED
                    },
                    $push: {
                        histories: {
                            status: constant_1.ClassRequestStatus.EXPIRED,
                            timestamp: new Date(),
                            userRole: role
                        }
                    }
                }, { session });
                await this.courseService.update({ _id: classRequest.courseId }, {
                    $set: {
                        isRequesting: false
                    }
                }, { session });
            });
        }
        finally {
            await session.endSession();
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: 'Your class request has expired',
            body: 'Class publication request has expired. Click to view details.',
            receiverIds: [classRequest.createdBy.toString()],
            data: {
                type: constant_5.FCMNotificationDataType.CLASS_REQUEST,
                id: classRequestId
            }
        });
        this.reportService.update({ type: constant_6.ReportType.ClassRequestSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(classRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.ClassRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async expireCancelClassRequest(classRequestId, userAuth) {
        const { _id, role } = userAuth;
        const classRequest = await this.findById(classRequestId);
        if (!classRequest || classRequest.type !== constant_1.ClassRequestType.CANCEL_CLASS)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_NOT_FOUND);
        if (classRequest.status !== constant_1.ClassRequestStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_REQUEST_STATUS_INVALID);
        const courseClass = await this.classService.findById(classRequest.classId?.toString());
        if (!courseClass)
            throw new app_exception_1.AppException(error_1.Errors.CLASS_NOT_FOUND);
        const session = await this.connection.startSession();
        try {
            await session.withTransaction(async () => {
                await this.update({ _id: classRequestId }, {
                    $set: {
                        status: constant_1.ClassRequestStatus.EXPIRED
                    },
                    $push: {
                        histories: {
                            status: constant_1.ClassRequestStatus.EXPIRED,
                            timestamp: new Date(),
                            userRole: role
                        }
                    }
                }, { session });
            });
        }
        finally {
            await session.endSession();
        }
        this.notificationService.sendFirebaseCloudMessaging({
            title: 'Your class request has expired',
            body: 'Class cancellation request has expired. Click to view details.',
            receiverIds: [classRequest.createdBy.toString()],
            data: {
                type: constant_5.FCMNotificationDataType.CLASS_REQUEST,
                id: classRequestId
            }
        });
        this.reportService.update({ type: constant_6.ReportType.ClassRequestSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(classRequest.createdBy) }, {
            $inc: {
                [`data.${constant_1.ClassRequestStatus.PENDING}.quantity`]: -1
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async getExpiredAt(date) {
        const classRequestAutoExpiration = await this.settingService.findByKey(constant_4.SettingKey.ClassRequestAutoExpiration);
        const dateMoment = moment.tz(date, config_1.VN_TIMEZONE);
        const expiredDate = dateMoment.clone().add(Number(classRequestAutoExpiration.value) || 2, 'day');
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
    async addClassRequestAutoExpiredJob(classRequest) {
        try {
            const expiredAt = await this.getExpiredAt(classRequest['createdAt']);
            const delayTime = this.helperService.getDiffTimeByMilliseconds(expiredAt);
            await this.queueProducerService.addJob(constant_3.QueueName.CLASS_REQUEST, constant_3.JobName.ClassRequestAutoExpired, {
                classRequestId: classRequest._id,
                expiredAt
            }, {
                delay: delayTime,
                jobId: classRequest._id.toString()
            });
        }
        catch (err) {
            this.appLogger.error(JSON.stringify(err));
        }
    }
    generateDeadlineClassAssignment(params) {
        const { sessions, startDate, duration, weekdays } = params;
        const startOfDate = moment(startDate).tz(config_1.VN_TIMEZONE).startOf('date');
        const endOfDate = startOfDate.clone().add(duration, 'week').startOf('date');
        const classDates = [];
        let currentDate = startOfDate.clone();
        while (currentDate.isSameOrBefore(endOfDate)) {
            for (let weekday of weekdays) {
                const classDate = currentDate.clone().isoWeekday(weekday);
                if (classDate.isSameOrAfter(startOfDate) && classDate.isBefore(endOfDate)) {
                    classDates.push(classDate.toDate());
                }
            }
            currentDate.add(1, 'week');
        }
        const classEndOfDate = moment(classDates[classDates.length - 1])
            .tz(config_1.VN_TIMEZONE)
            .endOf('date');
        return sessions?.map((session) => {
            if (session?.assignments?.length > 0) {
                const sessionStartDate = classDates[session.sessionNumber - 1];
                const assignmentDeadline = moment(sessionStartDate).tz(config_1.VN_TIMEZONE).add(7, 'day').endOf('date');
                const deadline = assignmentDeadline.isAfter(classEndOfDate) ? classEndOfDate : assignmentDeadline;
                session.assignments = session.assignments.map((assignment) => ({ ...assignment, deadline: deadline.toDate() }));
            }
            return session;
        });
    }
    async sendNotificationToStaffWhenClassRequestIsCreated({ classRequest }) {
        const staffs = await this.staffService.findMany({
            status: constant_1.StaffStatus.ACTIVE,
            role: constant_1.UserRole.STAFF
        });
        const staffIds = staffs.map((staff) => staff._id.toString());
        await this.notificationService.sendTopicFirebaseCloudMessaging({
            title: 'New class request created',
            body: classRequest.type === constant_1.ClassRequestType.PUBLISH_CLASS
                ? 'A class publication request was recently created. Click to view details.'
                : 'A class cancellation request was recently created. Click to view details.',
            receiverIds: staffIds,
            data: {
                type: constant_5.FCMNotificationDataType.CLASS_REQUEST,
                id: classRequest._id.toString()
            },
            topic: 'STAFF_NOTIFICATION_TOPIC'
        });
    }
    updateCourseReportWhenPublishClassRequestApproved({ instructorId }) {
        this.reportService.update({ type: constant_6.ReportType.CourseSum, tag: constant_6.ReportTag.System }, {
            $inc: {
                'data.quantity': 1
            }
        });
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        this.reportService.update({ type: constant_6.ReportType.CourseSumByMonth, tag: constant_6.ReportTag.System, 'data.year': year }, {
            $inc: {
                [`data.${month}.quantity`]: 1
            }
        });
        this.reportService.update({ type: constant_6.ReportType.CourseSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(instructorId) }, {
            $inc: {
                [`data.${constant_1.CourseStatus.ACTIVE}.quantity`]: 1
            }
        });
    }
    updateClassReportWhenPublishClassRequestApproved({ instructorId }) {
        this.reportService.update({ type: constant_6.ReportType.ClassSum, tag: constant_6.ReportTag.System }, {
            $inc: {
                'data.quantity': 1,
                [`data.${constant_1.ClassStatus.PUBLISHED}.quantity`]: 1
            }
        });
        this.reportService.update({ type: constant_6.ReportType.ClassSum, tag: constant_6.ReportTag.User, ownerId: new mongoose_1.Types.ObjectId(instructorId) }, {
            $inc: {
                'data.quantity': 1,
                [`data.${constant_1.ClassStatus.PUBLISHED}.quantity`]: 1
            }
        });
    }
    updateClassReportWhenCancelClassRequestApproved({ instructorId, status }) {
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
exports.ClassRequestService = ClassRequestService;
exports.ClassRequestService = ClassRequestService = ClassRequestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(class_request_repository_1.IClassRequestRepository)),
    __param(2, (0, common_1.Inject)(course_service_1.ICourseService)),
    __param(3, (0, common_1.Inject)(garden_timesheet_service_1.IGardenTimesheetService)),
    __param(4, (0, common_1.Inject)(class_service_1.IClassService)),
    __param(5, (0, mongoose_2.InjectConnection)()),
    __param(6, (0, common_1.Inject)(queue_producer_service_1.IQueueProducerService)),
    __param(7, (0, common_1.Inject)(setting_service_1.ISettingService)),
    __param(8, (0, common_1.Inject)(learner_class_service_1.ILearnerClassService)),
    __param(9, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __param(10, (0, common_1.Inject)(staff_service_1.IStaffService)),
    __param(11, (0, common_1.Inject)(report_service_1.IReportService)),
    __metadata("design:paramtypes", [helper_service_1.HelperService, Object, Object, Object, Object, mongoose_1.Connection, Object, Object, Object, Object, Object, Object])
], ClassRequestService);
//# sourceMappingURL=class-request.service.js.map