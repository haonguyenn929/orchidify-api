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
var ClassQueueConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassQueueConsumer = void 0;
const moment = require("moment-timezone");
const constant_1 = require("../../common/contracts/constant");
const app_logger_service_1 = require("../../common/services/app-logger.service");
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const constant_2 = require("../contracts/constant");
const config_1 = require("../../config");
const class_service_1 = require("../../class/services/class.service");
const garden_timesheet_service_1 = require("../../garden-timesheet/services/garden-timesheet.service");
const setting_service_1 = require("../../setting/services/setting.service");
const constant_3 = require("../../setting/contracts/constant");
const learner_class_service_1 = require("../../class/services/learner-class.service");
const helper_service_1 = require("../../common/services/helper.service");
const _ = require("lodash");
const fs = require("fs");
const media_service_1 = require("../../media/services/media.service");
const certificate_service_1 = require("../../certificate/services/certificate.service");
const path = require("path");
const attendance_service_1 = require("../../attendance/services/attendance.service");
const assignment_submission_service_1 = require("../../class/services/assignment-submission.service");
const notification_service_1 = require("../../notification/services/notification.service");
const constant_4 = require("../../notification/contracts/constant");
const mongoose_1 = require("mongoose");
const garden_service_1 = require("../../garden/services/garden.service");
const constant_5 = require("../../report/contracts/constant");
const report_service_1 = require("../../report/services/report.service");
let ClassQueueConsumer = ClassQueueConsumer_1 = class ClassQueueConsumer extends bullmq_1.WorkerHost {
    constructor(helperService, mediaService, classService, gardenTimesheetService, settingService, learnerClassService, certificateService, attendanceService, assignmentSubmissionService, notificationService, gardenService, reportService) {
        super();
        this.helperService = helperService;
        this.mediaService = mediaService;
        this.classService = classService;
        this.gardenTimesheetService = gardenTimesheetService;
        this.settingService = settingService;
        this.learnerClassService = learnerClassService;
        this.certificateService = certificateService;
        this.attendanceService = attendanceService;
        this.assignmentSubmissionService = assignmentSubmissionService;
        this.notificationService = notificationService;
        this.gardenService = gardenService;
        this.reportService = reportService;
        this.appLogger = new app_logger_service_1.AppLogger(ClassQueueConsumer_1.name);
    }
    async process(job) {
        this.appLogger.log(`[process] Processing job id=${job.id}`);
        try {
            switch (job.name) {
                case constant_2.JobName.UpdateClassStatus: {
                    return await this.updateClassStatus(job);
                }
                case constant_2.JobName.UpdateClassProgressEndSlot: {
                    return await this.updateClassProgressEndSlot(job);
                }
                case constant_2.JobName.ClassAutoCompleted: {
                    return await this.completeClassAutomatically(job);
                }
                case constant_2.JobName.SendClassCertificate: {
                    return await this.sendClassCertificate(job);
                }
                case constant_2.JobName.RemindClassStartSlot: {
                    return await this.remindClassStartSlot(job);
                }
                case constant_2.JobName.RemindClassStartSoon: {
                    return await this.remindClassStartSoon(job);
                }
                default:
            }
            this.appLogger.log('[process] Job processed successfully');
        }
        catch (error) {
            this.appLogger.error(error);
            throw error;
        }
    }
    async updateClassStatus(job) {
        this.appLogger.debug(`[updateClassStatus]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`);
        try {
            this.appLogger.log(`[updateClassStatus]: Start update class status... id=${job.id}`);
            const courseClasses = await this.classService.findManyByStatus([constant_1.ClassStatus.PUBLISHED]);
            if (courseClasses.length === 0)
                return 'No PUBLISHED status class';
            const nowMoment = moment().tz(config_1.VN_TIMEZONE).startOf('date');
            const updateClassStatusPromises = [];
            const updateClassToInProgress = [];
            const updateClassToCanceled = [];
            const updateClassReportPromises = [];
            const classAutoCancelMinLearners = Number((await this.settingService.findByKey(constant_3.SettingKey.ClassAutoCancelMinLearners)).value) || 5;
            for await (const courseClass of courseClasses) {
                const startOfDate = moment(courseClass.startDate).tz(config_1.VN_TIMEZONE).startOf('date');
                if (startOfDate.isSameOrBefore(nowMoment)) {
                    const learnerQuantity = courseClass.learnerQuantity;
                    if (learnerQuantity < classAutoCancelMinLearners) {
                        updateClassToCanceled.push(courseClass._id);
                        updateClassStatusPromises.push(this.classService.cancelClass(courseClass._id, { cancelReason: 'System cancel' }, { role: 'SYSTEM' }));
                    }
                    else {
                        updateClassToInProgress.push(courseClass._id);
                        updateClassStatusPromises.push(this.classService.update({ _id: courseClass._id }, {
                            $set: { status: constant_1.ClassStatus.IN_PROGRESS },
                            $push: {
                                histories: {
                                    status: constant_1.ClassStatus.IN_PROGRESS,
                                    timestamp: new Date(),
                                    userRole: 'SYSTEM'
                                }
                            }
                        }));
                        updateClassReportPromises.push(this.reportService.update({
                            type: constant_5.ReportType.ClassSum,
                            tag: constant_5.ReportTag.User,
                            ownerId: new mongoose_1.Types.ObjectId(courseClass.instructorId)
                        }, {
                            $inc: {
                                [`data.${constant_1.ClassStatus.PUBLISHED}.quantity`]: -1,
                                [`data.${constant_1.ClassStatus.IN_PROGRESS}.quantity`]: 1
                            }
                        }));
                    }
                }
            }
            await Promise.all(updateClassStatusPromises);
            await Promise.all(updateClassReportPromises);
            this.reportService.update({ type: constant_5.ReportType.ClassSum, tag: constant_5.ReportTag.System }, {
                $inc: {
                    [`data.${constant_1.ClassStatus.PUBLISHED}.quantity`]: -updateClassToInProgress.length,
                    [`data.${constant_1.ClassStatus.IN_PROGRESS}.quantity`]: updateClassToInProgress.length
                }
            });
            this.appLogger.log(`[updateClassStatus]: End update status... id=${job.id}`);
            return { status: true, updateClassToInProgress, updateClassToCanceled };
        }
        catch (error) {
            this.appLogger.error(`[updateClassStatus]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`);
            return false;
        }
    }
    async updateClassProgressEndSlot(job) {
        const { slotNumber } = job.data;
        this.appLogger.debug(`[updateClassProgressEndSlot]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`);
        try {
            this.appLogger.log(`[updateClassProgressEndSlot]: Start update class progress... id=${job.id}`);
            const startOfDate = moment().tz(config_1.VN_TIMEZONE).startOf('date');
            let start, end;
            switch (slotNumber) {
                case constant_1.SlotNumber.ONE:
                    start = startOfDate.clone().add(7, 'hour').toDate();
                    end = startOfDate.clone().add(9, 'hour').toDate();
                    break;
                case constant_1.SlotNumber.TWO:
                    start = startOfDate.clone().add(9, 'hour').add(30, 'minute').toDate();
                    end = startOfDate.clone().add(11, 'hour').add(30, 'minute').toDate();
                    break;
                case constant_1.SlotNumber.THREE:
                    start = startOfDate.clone().add(13, 'hour').toDate();
                    end = startOfDate.clone().add(15, 'hour').toDate();
                    break;
                case constant_1.SlotNumber.FOUR:
                    start = startOfDate.clone().add(15, 'hour').add(30, 'minute').toDate();
                    end = startOfDate.clone().add(17, 'hour').add(30, 'minute').toDate();
                    break;
            }
            const timesheets = await this.gardenTimesheetService.findMany({
                'slots.start': start,
                'slots.end': end
            });
            const classIds = new Set();
            for (const timesheet of timesheets) {
                for (const slot of timesheet.slots) {
                    if (slot.status === constant_1.SlotStatus.NOT_AVAILABLE && slot.slotNumber === slotNumber) {
                        classIds.add(slot.classId);
                    }
                }
            }
            const courseClasses = await this.classService.findMany({
                _id: {
                    $in: [...classIds]
                }
            });
            const updateClassProgressPromises = [];
            courseClasses.forEach((courseClass) => {
                const { progress } = courseClass;
                const completed = progress.completed + 1 > progress.total ? progress.total : progress.completed + 1;
                const total = progress.total;
                const percentage = Math.round((completed / total) * 100);
                updateClassProgressPromises.push(this.classService.update({ _id: courseClass._id }, {
                    $set: { progress: { completed, total, percentage } }
                }));
            });
            await Promise.all(updateClassProgressPromises);
            this.appLogger.log(`[updateClassProgressEndSlot]: End update class progress... id=${job.id}`);
            return { status: true, numbersOfUpdatedClass: classIds.size };
        }
        catch (error) {
            this.appLogger.error(`[updateClassProgressEndSlot]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`);
            return false;
        }
    }
    async completeClassAutomatically(job) {
        this.appLogger.debug(`[completeClassAutomatically]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`);
        try {
            this.appLogger.log(`[completeClassAutomatically]: Start complete class ... id=${job.id}`);
            const startOfDate = moment().tz(config_1.VN_TIMEZONE).startOf('date');
            const classAutoCompleteAfterDay = Number((await this.settingService.findByKey(constant_3.SettingKey.ClassAutoCompleteAfterDay)).value) || 5;
            const courseClasses = await this.classService.findMany({
                status: constant_1.ClassStatus.IN_PROGRESS
            });
            const completeClassPromises = [];
            courseClasses.forEach((courseClass) => {
                const { startDate, duration, weekdays } = courseClass;
                const classEndTime = this.classService.getClassEndTime({ startDate, duration, weekdays });
                if (classEndTime.clone().add(classAutoCompleteAfterDay, 'day').isSameOrBefore(startOfDate)) {
                    completeClassPromises.push(this.classService.completeClass(courseClass._id, { role: 'SYSTEM' }));
                }
            });
            await Promise.all(completeClassPromises);
            this.appLogger.log(`[completeClassAutomatically]: End complete class... id=${job.id}`);
            return { status: true, numbersOfCompletedClass: completeClassPromises.length };
        }
        catch (error) {
            this.appLogger.error(`[completeClassAutomatically]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`);
            return false;
        }
    }
    async sendClassCertificate(job) {
        this.appLogger.debug(`[sendClassCertificate]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`);
        try {
            this.appLogger.log(`[sendClassCertificate]: Start complete class ... id=${job.id}`);
            const courseClasses = await this.classService.findMany({
                'progress.percentage': 100,
                hasSentCertificate: { $exists: false }
            }, ['instructorId', 'title', 'code', 'sessions'], [{ path: 'instructor', select: ['name'] }]);
            const sendClassCertificatePromises = [];
            courseClasses.forEach((courseClass) => {
                sendClassCertificatePromises.push(this.generateCertificateForClass(courseClass));
            });
            await Promise.allSettled(sendClassCertificatePromises);
            this.appLogger.log(`[sendClassCertificate]: End complete class... id=${job.id}`);
            return { status: true, numbersOfHasSentCertificateClass: sendClassCertificatePromises.length };
        }
        catch (error) {
            this.appLogger.error(`[sendClassCertificate]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`);
            return false;
        }
    }
    async generateCertificateForClass(courseClass) {
        const dateMoment = moment().tz(config_1.VN_TIMEZONE).format('LL');
        const learnerClasses = await this.learnerClassService.findMany({ classId: courseClass._id }, ['learnerId'], [{ path: 'learner', select: ['_id', 'name'] }]);
        const classAttendanceRate = Number((await this.settingService.findByKey(constant_3.SettingKey.ClassAttendanceRate)).value) || 0.8;
        const classAssignmentPointAverage = Number((await this.settingService.findByKey(constant_3.SettingKey.ClassAssignmentPointAverage)).value) || 6;
        const generatePDFPromises = [];
        for await (const learnerClass of learnerClasses) {
            const learnerId = _.get(learnerClass, 'learnerId');
            const classAssignmentCount = courseClass.sessions.filter((session) => session.assignments.length > 0).length;
            const [attendances, submissions] = await Promise.all([
                this.attendanceService.findMany({
                    learnerId,
                    classId: courseClass._id
                }),
                this.assignmentSubmissionService.findMany({
                    learnerId,
                    classId: courseClass._id
                })
            ]);
            const presentAttendances = attendances.filter((attendance) => attendance.status === constant_1.AttendanceStatus.PRESENT);
            let totalAssignmentPoint = 0;
            submissions.forEach((submission) => {
                if (submission.point) {
                    totalAssignmentPoint += submission.point;
                }
                else {
                    totalAssignmentPoint += 10;
                }
            });
            const isAttendanceRateEnough = attendances.length === 0 || presentAttendances.length / attendances.length >= classAttendanceRate;
            const isAssignmentPointAvgEnough = classAssignmentCount === 0 || totalAssignmentPoint / classAssignmentCount >= classAssignmentPointAverage;
            if (!isAttendanceRateEnough || !isAssignmentPointAvgEnough)
                continue;
            const certificateCode = await this.certificateService.generateCertificateCode();
            const data = {
                learnerName: _.get(learnerClass, 'learner.name') || 'Learner',
                courseTitle: _.get(courseClass, 'title') || 'Course',
                dateCompleted: dateMoment,
                certificateCode,
                instructorName: _.get(courseClass, 'instructor.name') || 'Instructor'
            };
            const certificatePath = `certs/cert-${_.get(courseClass, 'code')}-${learnerId}.pdf`;
            const metadata = {
                learnerId,
                code: certificateCode,
                name: _.get(courseClass, 'title'),
                learnerClassId: learnerClass._id
            };
            generatePDFPromises.push(this.helperService.generatePDF({ data, certificatePath, metadata }));
        }
        const generatePDFResponses = (await Promise.all(generatePDFPromises)).filter((res) => res.status === true);
        const mediaPaths = generatePDFResponses.map((res) => path.resolve(__dirname, '../../../', res.certificatePath));
        const uploadResponses = await this.mediaService.uploadMultiple(mediaPaths);
        const saveCertificatePromises = [];
        generatePDFResponses.forEach((res, index) => {
            const { metadata } = res;
            saveCertificatePromises.push(this.certificateService.create({
                url: uploadResponses.at(index).url,
                ownerId: _.get(metadata, 'learnerId'),
                code: _.get(metadata, 'code'),
                name: _.get(metadata, 'name'),
                learnerClassId: _.get(metadata, 'learnerClassId')
            }));
        });
        await Promise.all(saveCertificatePromises);
        await this.classService.update({ _id: courseClass._id }, {
            $set: { hasSentCertificate: true }
        });
        this.notificationService.sendFirebaseCloudMessaging({
            title: `Congratulations on completing the course`,
            body: `Class ${courseClass.code}: ${courseClass.title} has ended. Click to view details.`,
            receiverIds: learnerClasses.map((learnerClass) => learnerClass.learnerId.toString()),
            data: {
                type: constant_4.FCMNotificationDataType.CLASS,
                id: courseClass._id.toString()
            }
        });
        const unlinkMediaFilePromises = [];
        mediaPaths.forEach((mediaPath) => {
            unlinkMediaFilePromises.push(fs.unlink(mediaPath, (err) => {
                if (err) {
                    console.error(`Error removing file: ${err}`);
                    return;
                }
                console.log(`File ${mediaPath} has been successfully removed.`);
            }));
        });
        Promise.allSettled(unlinkMediaFilePromises);
    }
    async remindClassStartSlot(job) {
        const { slotNumber } = job.data;
        this.appLogger.debug(`[remindClassStartSlot]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`);
        try {
            this.appLogger.log(`[remindClassStartSlot]: Start remind class start slot... id=${job.id}`);
            const startOfDate = moment().tz(config_1.VN_TIMEZONE).startOf('date');
            let start, end;
            switch (slotNumber) {
                case constant_1.SlotNumber.ONE:
                    start = startOfDate.clone().add(7, 'hour').toDate();
                    end = startOfDate.clone().add(9, 'hour').toDate();
                    break;
                case constant_1.SlotNumber.TWO:
                    start = startOfDate.clone().add(9, 'hour').add(30, 'minute').toDate();
                    end = startOfDate.clone().add(11, 'hour').add(30, 'minute').toDate();
                    break;
                case constant_1.SlotNumber.THREE:
                    start = startOfDate.clone().add(13, 'hour').toDate();
                    end = startOfDate.clone().add(15, 'hour').toDate();
                    break;
                case constant_1.SlotNumber.FOUR:
                    start = startOfDate.clone().add(15, 'hour').add(30, 'minute').toDate();
                    end = startOfDate.clone().add(17, 'hour').add(30, 'minute').toDate();
                    break;
            }
            const timesheets = await this.gardenTimesheetService.findMany({
                'slots.start': start,
                'slots.end': end
            });
            const classIds = new Set();
            for (const timesheet of timesheets) {
                for (const slot of timesheet.slots) {
                    if (slot.status === constant_1.SlotStatus.NOT_AVAILABLE && slot.slotNumber === slotNumber) {
                        classIds.add(slot.classId);
                    }
                }
            }
            const courseClasses = await this.classService.findMany({
                _id: {
                    $in: [...classIds]
                }
            });
            const remindClassSlotStartIn1HourPromises = [];
            courseClasses.forEach((courseClass) => {
                remindClassSlotStartIn1HourPromises.push(this.sendClassSlotStartRemindNotificationForLearner(courseClass));
            });
            await Promise.all(remindClassSlotStartIn1HourPromises);
            this.appLogger.log(`[remindClassStartSlot]: End remind class start slot... id=${job.id}`);
            return { status: true, classIds: [...classIds] };
        }
        catch (error) {
            this.appLogger.error(`[remindClassStartSlot]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`);
            return false;
        }
    }
    async sendClassSlotStartRemindNotificationForLearner(courseClass) {
        const learnerClasses = await this.learnerClassService.findMany({ classId: new mongoose_1.Types.ObjectId(courseClass._id) }, [
            'learnerId'
        ]);
        if (learnerClasses.length === 0)
            return;
        await this.notificationService.sendFirebaseCloudMessaging({
            title: `Session will start in 1 hour`,
            body: `Class ${courseClass.code}: ${courseClass.title} session is about to start. Click to view details.`,
            receiverIds: learnerClasses.map((learnerClass) => learnerClass?.learnerId?.toString()),
            data: {
                type: constant_4.FCMNotificationDataType.CLASS,
                id: courseClass._id.toString()
            }
        });
    }
    async remindClassStartSoon(job) {
        this.appLogger.debug(`[remindClassStartSoon]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`);
        try {
            this.appLogger.log(`[remindClassStartSoon]: Start remind class start soon... id=${job.id}`);
            const courseClasses = await this.classService.findManyByStatus([constant_1.ClassStatus.PUBLISHED]);
            if (courseClasses.length === 0)
                return 'No PUBLISHED status class';
            const tomorrowMoment = moment().tz(config_1.VN_TIMEZONE).startOf('date').add(1, 'day');
            const remindClassStartSoonPromises = [];
            const classIds = [];
            for await (const courseClass of courseClasses) {
                const startOfDate = moment(courseClass.startDate).tz(config_1.VN_TIMEZONE).startOf('date');
                if (startOfDate.isSame(tomorrowMoment)) {
                    remindClassStartSoonPromises.push(this.sendClassStartSoonRemindNotification(courseClass));
                    classIds.push(courseClass._id);
                }
            }
            await Promise.all(remindClassStartSoonPromises);
            this.appLogger.log(`[remindClassStartSoon]: End remind class start soon... id=${job.id}`);
            return { status: true, classIds };
        }
        catch (error) {
            this.appLogger.error(`[remindClassStartSoon]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`);
            return false;
        }
    }
    async sendClassStartSoonRemindNotification(courseClass) {
        const [learnerClasses, garden] = await Promise.all([
            this.learnerClassService.findMany({ classId: new mongoose_1.Types.ObjectId(courseClass._id) }, ['learnerId']),
            this.gardenService.findById(courseClass.gardenId.toString())
        ]);
        const receiverIds = learnerClasses.map((learnerClass) => learnerClass?.learnerId?.toString());
        receiverIds.push(courseClass.instructorId.toString());
        receiverIds.push(garden.gardenManagerId.toString());
        if (receiverIds.length === 0)
            return;
        await this.notificationService.sendFirebaseCloudMessaging({
            title: `Class will start tomorrow`,
            body: `Class ${courseClass.code}: ${courseClass.title} will start tomorrow. Click to view details.`,
            receiverIds,
            data: {
                type: constant_4.FCMNotificationDataType.CLASS,
                id: courseClass._id.toString()
            }
        });
    }
};
exports.ClassQueueConsumer = ClassQueueConsumer;
exports.ClassQueueConsumer = ClassQueueConsumer = ClassQueueConsumer_1 = __decorate([
    (0, bullmq_1.Processor)(constant_2.QueueName.CLASS),
    __param(2, (0, common_1.Inject)(class_service_1.IClassService)),
    __param(3, (0, common_1.Inject)(garden_timesheet_service_1.IGardenTimesheetService)),
    __param(4, (0, common_1.Inject)(setting_service_1.ISettingService)),
    __param(5, (0, common_1.Inject)(learner_class_service_1.ILearnerClassService)),
    __param(6, (0, common_1.Inject)(certificate_service_1.ICertificateService)),
    __param(7, (0, common_1.Inject)(attendance_service_1.IAttendanceService)),
    __param(8, (0, common_1.Inject)(assignment_submission_service_1.IAssignmentSubmissionService)),
    __param(9, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __param(10, (0, common_1.Inject)(garden_service_1.IGardenService)),
    __param(11, (0, common_1.Inject)(report_service_1.IReportService)),
    __metadata("design:paramtypes", [helper_service_1.HelperService,
        media_service_1.MediaService, Object, Object, Object, Object, Object, Object, Object, Object, Object, Object])
], ClassQueueConsumer);
//# sourceMappingURL=class.queue-consumer.js.map