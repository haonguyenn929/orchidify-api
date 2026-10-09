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
exports.GardenManagerService = exports.IGardenManagerService = void 0;
const common_1 = require("@nestjs/common");
const garden_manager_repository_1 = require("../repositories/garden-manager.repository");
const constant_1 = require("../contracts/constant");
const constant_2 = require("../../common/contracts/constant");
const helper_service_1 = require("../../common/services/helper.service");
const notification_service_1 = require("../../notification/services/notification.service");
exports.IGardenManagerService = Symbol('IGardenManagerService');
let GardenManagerService = class GardenManagerService {
    constructor(helperService, gardenManagerRepository, notificationService) {
        this.helperService = helperService;
        this.gardenManagerRepository = gardenManagerRepository;
        this.notificationService = notificationService;
    }
    async create(createGardenManagerDto, options) {
        const password = this.helperService.generateRandomString(10, 'abcdefghijklmnopqrstuvwxyz0123456789');
        const hashPassword = await this.helperService.hashPassword(password);
        createGardenManagerDto['password'] = hashPassword;
        const gardenManager = await this.gardenManagerRepository.create(createGardenManagerDto, options);
        this.notificationService.sendMail({
            to: gardenManager.email,
            subject: `[Orchidify] Login Credentials`,
            template: 'management/add-garden-manager',
            context: {
                email: gardenManager.email,
                name: gardenManager.name,
                password
            }
        });
        return gardenManager;
    }
    async findById(gardenManagerId, projection, populates) {
        const gardenManager = await this.gardenManagerRepository.findOne({
            conditions: {
                _id: gardenManagerId
            },
            projection,
            populates
        });
        return gardenManager;
    }
    async findByEmail(email, projection) {
        const gardenManager = await this.gardenManagerRepository.findOne({
            conditions: {
                email
            },
            projection
        });
        return gardenManager;
    }
    update(conditions, payload, options) {
        return this.gardenManagerRepository.findOneAndUpdate(conditions, payload, options);
    }
    async list(pagination, queryGardenManagerDto, projection = constant_1.GARDEN_MANAGER_LIST_PROJECTION) {
        const { name, email, status } = queryGardenManagerDto;
        const filter = {};
        const validStatus = status?.filter((status) => [constant_2.GardenManagerStatus.ACTIVE, constant_2.GardenManagerStatus.INACTIVE].includes(status));
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
        return this.gardenManagerRepository.model.paginate(filter, {
            ...pagination,
            projection
        });
    }
};
exports.GardenManagerService = GardenManagerService;
exports.GardenManagerService = GardenManagerService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(garden_manager_repository_1.IGardenManagerRepository)),
    __param(2, (0, common_1.Inject)(notification_service_1.INotificationService)),
    __metadata("design:paramtypes", [helper_service_1.HelperService, Object, Object])
], GardenManagerService);
//# sourceMappingURL=garden-manager.service.js.map