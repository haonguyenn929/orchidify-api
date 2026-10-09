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
import { BaseAttendanceDto } from '@attendance/dto/base.attendance.dto';
import { BaseLearnerDto } from '@learner/dto/base.learner.dto';
import { Types } from 'mongoose';
import { BaseSlotDto } from '@garden-timesheet/dto/slot.dto';
export declare class QueryAttendanceDto {
    slotId: Types.ObjectId;
}
declare const AttendanceLearnerDetailResponse_base: import("@nestjs/common").Type<Pick<BaseLearnerDto, "_id" | "name" | "avatar">>;
declare class AttendanceLearnerDetailResponse extends AttendanceLearnerDetailResponse_base {
}
declare const AttendanceListItemResponse_base: import("@nestjs/common").Type<Pick<BaseAttendanceDto, "status" | "createdAt" | "updatedAt" | "_id" | "note" | "learnerId">>;
declare class AttendanceListItemResponse extends AttendanceListItemResponse_base {
    learner: AttendanceLearnerDetailResponse;
}
declare class AttendanceListResponse {
    docs: AttendanceListItemResponse[];
    slot: BaseSlotDto;
}
declare const AttendanceListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof AttendanceListResponse;
}>;
export declare class AttendanceListDataResponse extends AttendanceListDataResponse_base {
}
export {};
