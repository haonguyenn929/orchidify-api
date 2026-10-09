/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
/// <reference types="mongoose-paginate-v2" />
import { BaseClassRequestDto } from './base.class-request.dto';
import { ClassRequestStatus, ClassRequestType } from '@common/contracts/constant';
import { Types } from 'mongoose';
import { BaseInstructorDto } from '@instructor/dto/base.instructor.dto';
import { BaseClassDto } from '@class/dto/base.class.dto';
export declare class QueryClassRequestDto {
    type: ClassRequestType[];
    status: ClassRequestStatus[];
    createdBy: string;
}
declare const InstructorViewClassRequestListItemResponse_base: import("@nestjs/common").Type<Pick<BaseClassRequestDto, "metadata" | "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "rejectReason" | "courseId" | "classId" | "createdBy">>;
declare class InstructorViewClassRequestListItemResponse extends InstructorViewClassRequestListItemResponse_base {
}
declare const InstructorViewClassRequestListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof InstructorViewClassRequestListItemResponse)[];
    totalDocs: number;
    offset: number;
    limit: number;
    totalPages: number;
    page?: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage?: number;
    nextPage?: number;
}>;
declare class InstructorViewClassRequestListResponse extends InstructorViewClassRequestListResponse_base {
}
declare const InstructorViewClassRequestListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorViewClassRequestListResponse;
}>;
export declare class InstructorViewClassRequestListDataResponse extends InstructorViewClassRequestListDataResponse_base {
}
declare const InstructorViewClassRequestDetailResponse_base: import("@nestjs/common").Type<Pick<BaseClassRequestDto, "metadata" | "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "histories" | "rejectReason" | "courseId" | "classId" | "createdBy">>;
declare class InstructorViewClassRequestDetailResponse extends InstructorViewClassRequestDetailResponse_base {
    class: BaseClassDto;
}
declare const InstructorViewClassRequestDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorViewClassRequestDetailResponse;
}>;
export declare class InstructorViewClassRequestDetailDataResponse extends InstructorViewClassRequestDetailDataResponse_base {
}
declare const StaffViewClassRequestListItemResponse_base: import("@nestjs/common").Type<Pick<BaseClassRequestDto, "metadata" | "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "rejectReason" | "courseId" | "classId" | "createdBy">>;
declare class StaffViewClassRequestListItemResponse extends StaffViewClassRequestListItemResponse_base {
    createdBy: Types.ObjectId | BaseInstructorDto;
}
declare const StaffViewClassRequestListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof StaffViewClassRequestListItemResponse)[];
    totalDocs: number;
    offset: number;
    limit: number;
    totalPages: number;
    page?: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage?: number;
    nextPage?: number;
}>;
declare class StaffViewClassRequestListResponse extends StaffViewClassRequestListResponse_base {
}
declare const StaffViewClassRequestListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffViewClassRequestListResponse;
}>;
export declare class StaffViewClassRequestListDataResponse extends StaffViewClassRequestListDataResponse_base {
}
declare class StaffViewClassRequestDetailResponse extends InstructorViewClassRequestDetailResponse {
    createdBy: Types.ObjectId | BaseInstructorDto;
    class: BaseClassDto;
}
declare const StaffViewClassRequestDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffViewClassRequestDetailResponse;
}>;
export declare class StaffViewClassRequestDetailDataResponse extends StaffViewClassRequestDetailDataResponse_base {
}
export {};
