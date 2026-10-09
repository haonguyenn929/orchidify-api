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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCourseDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const constant_1 = require("../../common/contracts/constant");
const class_transformer_1 = require("class-transformer");
const base_media_dto_1 = require("../../media/dto/base-media.dto");
const constant_2 = require("../../common/contracts/constant");
const session_dto_1 = require("../../class/dto/session.dto");
const rating_summary_dto_1 = require("../../class/dto/rating-summary.dto");
const config_1 = require("../../config");
class BaseCourseDto {
}
exports.BaseCourseDto = BaseCourseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: String }),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, example: 'Course code' }),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, example: 'Course title' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, example: 'Course description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Number, example: 500000 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(config_1.MIN_PRICE),
    (0, class_validator_1.Max)(config_1.MAX_PRICE),
    __metadata("design:type", Number)
], BaseCourseDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, enum: constant_2.CourseLevel }),
    (0, class_validator_1.IsEnum)(constant_2.CourseLevel),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['Propagation'] }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], BaseCourseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Number }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], BaseCourseDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'https://res.cloudinary.com/orchidify/image/upload/v1726377866/hcgbmek4qa8kksw2zrcg.jpg'
    }),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "thumbnail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: base_media_dto_1.BaseMediaDto, isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(10),
    (0, class_transformer_1.Type)(() => base_media_dto_1.BaseMediaDto),
    (0, class_validator_1.ValidateNested)({ each: true }),
    __metadata("design:type", Array)
], BaseCourseDto.prototype, "media", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, enum: constant_1.CourseStatus }),
    (0, class_validator_1.IsEnum)(constant_1.CourseStatus),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: session_dto_1.BaseSessionDto, isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.ArrayMaxSize)(24),
    (0, class_transformer_1.Type)(() => session_dto_1.BaseSessionDto),
    (0, class_validator_1.ValidateNested)({ each: true }),
    __metadata("design:type", Array)
], BaseCourseDto.prototype, "sessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.ArrayMaxSize)(3),
    (0, class_validator_1.IsMongoId)({ each: true }),
    __metadata("design:type", Array)
], BaseCourseDto.prototype, "childCourseIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Number, example: 20 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], BaseCourseDto.prototype, "learnerLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Number }),
    __metadata("design:type", Number)
], BaseCourseDto.prototype, "rate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Number, example: 20 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], BaseCourseDto.prototype, "discount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, example: 'Course Garden Required Toolkits' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "gardenRequiredToolkits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String }),
    __metadata("design:type", String)
], BaseCourseDto.prototype, "instructorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Boolean }),
    __metadata("design:type", Boolean)
], BaseCourseDto.prototype, "isRequesting", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: rating_summary_dto_1.BaseRatingSummaryDto }),
    __metadata("design:type", rating_summary_dto_1.BaseRatingSummaryDto)
], BaseCourseDto.prototype, "ratingSummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Date }),
    __metadata("design:type", Date)
], BaseCourseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Date }),
    __metadata("design:type", Date)
], BaseCourseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=base.course.dto.js.map