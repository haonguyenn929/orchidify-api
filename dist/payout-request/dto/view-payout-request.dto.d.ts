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
import { BasePayoutRequestDto } from './base.payout-request.dto';
import { PayoutRequestStatus } from '@common/contracts/constant';
import { Types } from 'mongoose';
import { BaseInstructorDto } from '@instructor/dto/base.instructor.dto';
export declare class QueryPayoutRequestDto {
    status: PayoutRequestStatus[];
    hasMadePayout: boolean;
    createdBy: string;
}
declare const InstructorViewPayoutRequestListItemResponse_base: import("@nestjs/common").Type<Pick<BasePayoutRequestDto, "status" | "createdAt" | "updatedAt" | "_id" | "description" | "rejectReason" | "amount" | "createdBy" | "hasMadePayout">>;
declare class InstructorViewPayoutRequestListItemResponse extends InstructorViewPayoutRequestListItemResponse_base {
}
declare const InstructorViewPayoutRequestListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof InstructorViewPayoutRequestListItemResponse)[];
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
declare class InstructorViewPayoutRequestListResponse extends InstructorViewPayoutRequestListResponse_base {
}
declare const InstructorViewPayoutRequestListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorViewPayoutRequestListResponse;
}>;
export declare class InstructorViewPayoutRequestListDataResponse extends InstructorViewPayoutRequestListDataResponse_base {
}
declare const InstructorViewPayoutRequestDetailResponse_base: import("@nestjs/common").Type<Pick<BasePayoutRequestDto, "status" | "createdAt" | "updatedAt" | "_id" | "description" | "histories" | "rejectReason" | "handledBy" | "amount" | "transactionId" | "createdBy" | "hasMadePayout" | "transactionCode" | "attachment">>;
declare class InstructorViewPayoutRequestDetailResponse extends InstructorViewPayoutRequestDetailResponse_base {
}
declare const InstructorViewPayoutRequestDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorViewPayoutRequestDetailResponse;
}>;
export declare class InstructorViewPayoutRequestDetailDataResponse extends InstructorViewPayoutRequestDetailDataResponse_base {
}
declare const StaffViewPayoutRequestListItemResponse_base: import("@nestjs/common").Type<Pick<BasePayoutRequestDto, "status" | "createdAt" | "updatedAt" | "_id" | "description" | "rejectReason" | "amount" | "createdBy" | "hasMadePayout">>;
declare class StaffViewPayoutRequestListItemResponse extends StaffViewPayoutRequestListItemResponse_base {
    createdBy: Types.ObjectId | BaseInstructorDto;
}
declare const StaffViewPayoutRequestListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof StaffViewPayoutRequestListItemResponse)[];
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
declare class StaffViewPayoutRequestListResponse extends StaffViewPayoutRequestListResponse_base {
}
declare const StaffViewPayoutRequestListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffViewPayoutRequestListResponse;
}>;
export declare class StaffViewPayoutRequestListDataResponse extends StaffViewPayoutRequestListDataResponse_base {
}
declare class StaffViewPayoutRequestDetailResponse extends InstructorViewPayoutRequestDetailResponse {
    createdBy: Types.ObjectId | BaseInstructorDto;
}
declare const StaffViewPayoutRequestDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffViewPayoutRequestDetailResponse;
}>;
export declare class StaffViewPayoutRequestDetailDataResponse extends StaffViewPayoutRequestDetailDataResponse_base {
}
declare class ViewPayoutUsageResponse {
    balance: number;
    usage: number;
    count: number;
}
declare const ViewPayoutUsageDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ViewPayoutUsageResponse;
}>;
export declare class ViewPayoutUsageDataResponse extends ViewPayoutUsageDataResponse_base {
}
export {};
