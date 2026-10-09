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
exports.StaffService = exports.IStaffService = void 0;
const constant_1 = require("../../common/contracts/constant");
const error_1 = require("../../common/contracts/error");
const app_exception_1 = require("../../common/exceptions/app.exception");
const helper_service_1 = require("../../common/services/helper.service");
const common_1 = require("@nestjs/common");
const notification_service_1 = require("../../notification/services/notification.service");
const constant_2 = require("../../report/contracts/constant");
const report_service_1 = require("../../report/services/report.service");
const constant_3 = require("../contracts/constant");
const staff_repository_1 = require("../repositories/staff.repository");
exports.IStaffService = Symbol('IStaffService');
let StaffService = class StaffService {
    constructor(helperService, staffRepository, notificationService, reportService) {
        this.helperService = helperService;
        this.staffRepository = staffRepository;
        this.notificationService = notificationService;
        this.reportService = reportService;
    }
    async create(createStaffDto, options) {
        const password = this.helperService.generateRandomString(10, 'abcdefghijklmnopqrstuvwxyz0123456789');
        const hashPassword = await this.helperService.hashPassword(password);
        createStaffDto['password'] = hashPassword;
        const staffCode = await this.generateStaffCode();
        createStaffDto['staffCode'] = staffCode;
        const staff = await this.staffRepository.create(createStaffDto, options);
        this.notificationService.sendMail({
            to: staff.email,
            subject: `[Orchidify] Login Credentials`,
            template: 'management/add-staff',
            context: {
                email: staff.email,
                name: staff.name,
                password
            }
        });
        this.reportService.update({ type: constant_2.ReportType.StaffSum, tag: constant_2.ReportTag.System }, {
            $inc: {
                'data.quantity': 1,
                [`data.${constant_1.StaffStatus.ACTIVE}.quantity`]: 1
            }
        });
        return staff;
    }
    async findById(staffId, projection, populates) {
        const staff = await this.staffRepository.findOne({
            conditions: {
                _id: staffId
            },
            projection,
            populates
        });
        return staff;
    }
    async findByEmail(email, projection) {
        const staff = await this.staffRepository.findOne({
            conditions: {
                email
            },
            projection
        });
        return staff;
    }
    update(conditions, payload, options) {
        return this.staffRepository.findOneAndUpdate(conditions, payload, options);
    }
    async list(pagination, QueryStaffDto, projection = constant_3.STAFF_LIST_PROJECTION) {
        const { name, email, status } = QueryStaffDto;
        const filter = {
            role: constant_1.UserRole.STAFF
        };
        const validStatus = status?.filter((status) => [constant_1.StaffStatus.ACTIVE, constant_1.StaffStatus.INACTIVE].includes(status));
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
        return this.staffRepository.model.paginate(filter, {
            ...pagination,
            projection
        });
    }
    async findMany(conditions, projection, populates) {
        const staffs = await this.staffRepository.findMany({
            conditions,
            projection,
            populates
        });
        return staffs;
    }
    async generateStaffCode(length = 6, startTime = Date.now()) {
        const staffCode = 'OCP' + this.helperService.generateRandomString(length);
        const staff = await this.staffRepository.findOne({
            conditions: {
                staffCode
            }
        });
        const elapsedTime = Date.now() - startTime;
        if (!staff)
            return staffCode;
        const isRetry = elapsedTime < 60 * 1000;
        if (isRetry)
            return await this.generateStaffCode(length, startTime);
        throw new app_exception_1.AppException(error_1.Errors.INTERNAL_SERVER_ERROR);
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(staff_repository_1.IStaffRepository)),
    __param(2, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __param(3, (0, common_1.Inject)(report_service_1.IReportService)),
    __metadata("design:paramtypes", [helper_service_1.HelperService, Object, Object, Object])
], StaffService);
//# sourceMappingURL=staff.service.js.map