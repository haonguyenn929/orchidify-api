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
var RecruitmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentService = exports.IRecruitmentService = void 0;
const constant_1 = require("../../common/contracts/constant");
const dto_1 = require("../../common/contracts/dto");
const error_1 = require("../../common/contracts/error");
const app_exception_1 = require("../../common/exceptions/app.exception");
const app_logger_service_1 = require("../../common/services/app-logger.service");
const helper_service_1 = require("../../common/services/helper.service");
const common_1 = require("@nestjs/common");
const notification_service_1 = require("../../notification/services/notification.service");
const constant_2 = require("../../queue/contracts/constant");
const queue_producer_service_1 = require("../../queue/services/queue-producer.service");
const constant_3 = require("../contracts/constant");
const recruitment_repository_1 = require("../repositories/recruitment.repository");
const constant_4 = require("../../setting/contracts/constant");
const setting_service_1 = require("../../setting/services/setting.service");
const config_1 = require("../../config");
const moment = require("moment-timezone");
const mongoose_1 = require("mongoose");
exports.IRecruitmentService = Symbol('IRecruitmentService');
let RecruitmentService = RecruitmentService_1 = class RecruitmentService {
    constructor(helperService, recruitmentRepository, settingService, queueProducerService, notificationService) {
        this.helperService = helperService;
        this.recruitmentRepository = recruitmentRepository;
        this.settingService = settingService;
        this.queueProducerService = queueProducerService;
        this.notificationService = notificationService;
        this.appLogger = new app_logger_service_1.AppLogger(RecruitmentService_1.name);
    }
    async create(createRecruitmentDto, options) {
        const recruitment = await this.recruitmentRepository.create(createRecruitmentDto, options);
        this.addAutoExpiredJobWhenCreateRecruitmentApplication(recruitment);
        return recruitment;
    }
    async findById(recruitmentId, projection, populates) {
        const recruitment = await this.recruitmentRepository.findOne({
            conditions: {
                _id: recruitmentId
            },
            projection,
            populates
        });
        return recruitment;
    }
    findOneByApplicationEmailAndStatus(applicationEmail, status) {
        return this.recruitmentRepository.findOne({
            conditions: {
                'applicationInfo.email': applicationEmail,
                status: {
                    $in: status
                }
            }
        });
    }
    findByHandledByAndStatus(handledBy, status) {
        return this.recruitmentRepository.findMany({
            conditions: {
                handledBy: new mongoose_1.Types.ObjectId(handledBy),
                status: {
                    $in: status
                }
            }
        });
    }
    update(conditions, payload, options) {
        return this.recruitmentRepository.findOneAndUpdate(conditions, payload, options);
    }
    async list(pagination, queryLearnerDto, projection = constant_3.RECRUITMENT_LIST_PROJECTION) {
        const { name, email, status } = queryLearnerDto;
        const filter = {};
        const validStatus = status?.filter((status) => [
            constant_1.RecruitmentStatus.PENDING,
            constant_1.RecruitmentStatus.INTERVIEWING,
            constant_1.RecruitmentStatus.SELECTED,
            constant_1.RecruitmentStatus.EXPIRED,
            constant_1.RecruitmentStatus.REJECTED
        ].includes(status));
        if (validStatus?.length > 0) {
            filter['status'] = {
                $in: validStatus
            };
        }
        let textSearch = '';
        if (name)
            textSearch += name.trim();
        if (email)
            textSearch += ' ' + email.trim();
        if (textSearch) {
            filter['$text'] = {
                $search: textSearch.trim()
            };
        }
        return this.recruitmentRepository.model.paginate(filter, {
            ...pagination,
            projection,
            populate: [
                {
                    path: 'handledBy',
                    select: ['name']
                }
            ]
        });
    }
    async processRecruitmentApplication(recruitmentId, processRecruitmentApplicationDto, userAuth) {
        const { meetingUrl, meetingDate } = processRecruitmentApplicationDto;
        const { _id, role } = userAuth;
        const recruitment = await this.findById(recruitmentId);
        if (!recruitment)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_NOT_FOUND);
        if (recruitment.status !== constant_1.RecruitmentStatus.PENDING)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_STATUS_INVALID);
        const newRecruitment = await this.recruitmentRepository.findOneAndUpdate({ _id: recruitmentId }, {
            $set: {
                status: constant_1.RecruitmentStatus.INTERVIEWING,
                handledBy: new mongoose_1.Types.ObjectId(_id),
                meetingUrl,
                meetingDate
            },
            $push: {
                histories: {
                    status: constant_1.RecruitmentStatus.INTERVIEWING,
                    timestamp: new Date(),
                    userId: new mongoose_1.Types.ObjectId(_id),
                    userRole: role
                }
            }
        }, { new: true });
        this.notificationService.sendMail({
            to: recruitment?.applicationInfo?.email,
            subject: `[Orchidify] Invitation to Instructor Interview - Orchidify`,
            template: 'viewer/process-recruitment-application',
            context: {
                platform: 'Google Meet',
                meetingUrl: meetingUrl,
                name: recruitment?.applicationInfo?.name
            }
        });
        this.updateAutoExpiredJobWhenCreateRecruitmentApplication(newRecruitment);
        return new dto_1.SuccessResponse(true);
    }
    async processRecruitmentInterview(recruitmentId, userAuth) {
        const { _id, role } = userAuth;
        const recruitment = await this.findById(recruitmentId);
        if (!recruitment)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_NOT_FOUND);
        if (recruitment.status !== constant_1.RecruitmentStatus.INTERVIEWING)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_STATUS_INVALID);
        if (recruitment.handledBy.toString() !== _id)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_IS_IN_CHARGED_BY_ANOTHER_STAFF);
        await this.recruitmentRepository.findOneAndUpdate({ _id: recruitmentId }, {
            $set: {
                status: constant_1.RecruitmentStatus.SELECTED
            },
            $push: {
                histories: {
                    status: constant_1.RecruitmentStatus.SELECTED,
                    timestamp: new Date(),
                    userId: new mongoose_1.Types.ObjectId(_id),
                    userRole: role
                }
            }
        });
        this.notificationService.sendMail({
            to: recruitment?.applicationInfo?.email,
            subject: `[Orchidify] Congratulations on becoming a part of Orchidify`,
            template: 'viewer/process-recruitment-interview',
            context: {
                name: recruitment?.applicationInfo?.name
            }
        });
        this.queueProducerService.removeJob(constant_2.QueueName.RECRUITMENT, recruitment._id?.toString());
        return new dto_1.SuccessResponse(true);
    }
    async rejectRecruitmentProcess(recruitmentId, rejectRecruitmentProcessDto, userAuth) {
        const { rejectReason } = rejectRecruitmentProcessDto;
        const { _id, role } = userAuth;
        const recruitment = await this.findById(recruitmentId);
        if (!recruitment)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_NOT_FOUND);
        if ([constant_1.RecruitmentStatus.PENDING, constant_1.RecruitmentStatus.INTERVIEWING].includes(recruitment.status) === false)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_STATUS_INVALID);
        if (recruitment.status === constant_1.RecruitmentStatus.INTERVIEWING && recruitment.handledBy.toString() !== _id)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_IS_IN_CHARGED_BY_ANOTHER_STAFF);
        await this.recruitmentRepository.findOneAndUpdate({ _id: recruitmentId }, {
            $set: {
                status: constant_1.RecruitmentStatus.REJECTED,
                handledBy: new mongoose_1.Types.ObjectId(_id),
                rejectReason
            },
            $push: {
                histories: {
                    status: constant_1.RecruitmentStatus.REJECTED,
                    timestamp: new Date(),
                    userId: new mongoose_1.Types.ObjectId(_id),
                    userRole: role
                }
            }
        });
        const mailTemplate = recruitment.status === constant_1.RecruitmentStatus.PENDING
            ? 'viewer/reject-recruitment-application.ejs'
            : 'viewer/reject-recruitment-interview.ejs';
        this.notificationService.sendMail({
            to: recruitment?.applicationInfo?.email,
            subject: `[Orchidify] Notification of Instructor Application Result`,
            template: mailTemplate,
            context: {
                name: recruitment?.applicationInfo?.name
            }
        });
        await this.queueProducerService.removeJob(constant_2.QueueName.RECRUITMENT, recruitment._id?.toString());
        return new dto_1.SuccessResponse(true);
    }
    async expiredRecruitmentProcess(recruitmentId, userAuth) {
        const { role } = userAuth;
        const recruitment = await this.findById(recruitmentId);
        if (!recruitment)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_NOT_FOUND);
        if ([constant_1.RecruitmentStatus.PENDING, constant_1.RecruitmentStatus.INTERVIEWING].includes(recruitment.status) === false)
            throw new app_exception_1.AppException(error_1.Errors.RECRUITMENT_STATUS_INVALID);
        await this.recruitmentRepository.findOneAndUpdate({ _id: recruitmentId }, {
            $set: {
                status: constant_1.RecruitmentStatus.EXPIRED
            },
            $push: {
                histories: {
                    status: constant_1.RecruitmentStatus.EXPIRED,
                    timestamp: new Date(),
                    userRole: role
                }
            }
        });
        return new dto_1.SuccessResponse(true);
    }
    async getExpiredAt(date, status) {
        const recruitmentProcessAutoExpiration = (await this.settingService.findByKey(constant_4.SettingKey.RecruitmentProcessAutoExpiration)).value || [7, 7];
        const dateMoment = moment.tz(date, config_1.VN_TIMEZONE);
        let expiredDate;
        if (status === constant_1.RecruitmentStatus.PENDING) {
            expiredDate = dateMoment.clone().add(Number(recruitmentProcessAutoExpiration[0]) || 7, 'day');
        }
        else {
            expiredDate = dateMoment.clone().add(Number(recruitmentProcessAutoExpiration[1]) || 7, 'day');
        }
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
    async addAutoExpiredJobWhenCreateRecruitmentApplication(recruitment) {
        try {
            const expiredAt = await this.getExpiredAt(recruitment['createdAt'], constant_1.RecruitmentStatus.PENDING);
            const delayTime = this.helperService.getDiffTimeByMilliseconds(expiredAt);
            await this.queueProducerService.addJob(constant_2.QueueName.RECRUITMENT, constant_2.JobName.RecruitmentAutoExpired, {
                recruitmentId: recruitment._id,
                expiredAt
            }, {
                delay: delayTime,
                jobId: recruitment._id.toString()
            });
        }
        catch (err) {
            this.appLogger.error(JSON.stringify(err));
        }
    }
    async updateAutoExpiredJobWhenCreateRecruitmentApplication(recruitment) {
        try {
            await this.queueProducerService.removeJob(constant_2.QueueName.RECRUITMENT, recruitment._id?.toString());
            const expiredAt = await this.getExpiredAt(recruitment['updatedAt'], constant_1.RecruitmentStatus.INTERVIEWING);
            const delayTime = this.helperService.getDiffTimeByMilliseconds(expiredAt);
            await this.queueProducerService.addJob(constant_2.QueueName.RECRUITMENT, constant_2.JobName.RecruitmentAutoExpired, {
                recruitmentId: recruitment._id,
                expiredAt
            }, {
                delay: delayTime,
                jobId: recruitment._id.toString()
            });
        }
        catch (err) {
            this.appLogger.error(JSON.stringify(err));
        }
    }
};
exports.RecruitmentService = RecruitmentService;
exports.RecruitmentService = RecruitmentService = RecruitmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(recruitment_repository_1.IRecruitmentRepository)),
    __param(2, (0, common_1.Inject)(setting_service_1.ISettingService)),
    __param(3, (0, common_1.Inject)(queue_producer_service_1.IQueueProducerService)),
    __param(4, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __metadata("design:paramtypes", [helper_service_1.HelperService, Object, Object, Object, Object])
], RecruitmentService);
//# sourceMappingURL=recruitment.service.js.map