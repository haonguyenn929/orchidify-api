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
import { BaseFeedbackDto } from '@feedback/dto/base.feedback.dto';
import { BaseLearnerDto } from '@learner/dto/base.learner.dto';
import { Types } from 'mongoose';
export declare class QueryFeedbackDto {
    rate: number;
    courseId: Types.ObjectId;
}
declare const FeedbackLearnerDetailResponse_base: import("@nestjs/common").Type<Pick<BaseLearnerDto, "_id" | "name" | "email" | "avatar" | "dateOfBirth" | "phone">>;
declare class FeedbackLearnerDetailResponse extends FeedbackLearnerDetailResponse_base {
}
declare const FeedbackDetailResponse_base: import("@nestjs/common").Type<Pick<BaseFeedbackDto, "createdAt" | "updatedAt" | "_id" | "comment" | "rate" | "classId" | "learnerId">>;
declare class FeedbackDetailResponse extends FeedbackDetailResponse_base {
}
declare const FeedbackDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof FeedbackDetailResponse;
}>;
export declare class FeedbackDetailDataResponse extends FeedbackDetailDataResponse_base {
}
declare const FeedbackListItemResponse_base: import("@nestjs/common").Type<Pick<BaseFeedbackDto, "createdAt" | "updatedAt" | "_id" | "comment" | "rate" | "classId" | "learnerId">>;
declare class FeedbackListItemResponse extends FeedbackListItemResponse_base {
    learner: FeedbackLearnerDetailResponse;
}
declare class ClassFeedbackListResponse {
    docs: FeedbackListItemResponse[];
}
declare const ClassFeedbackListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ClassFeedbackListResponse;
}>;
export declare class ClassFeedbackListDataResponse extends ClassFeedbackListDataResponse_base {
}
declare const InstructorViewFeedbackListItemResponse_base: import("@nestjs/common").Type<Pick<BaseFeedbackDto, "createdAt" | "updatedAt" | "_id" | "comment" | "rate" | "classId">>;
declare class InstructorViewFeedbackListItemResponse extends InstructorViewFeedbackListItemResponse_base {
}
declare class InstructorViewClassFeedbackListResponse {
    docs: InstructorViewFeedbackListItemResponse[];
}
declare const InstructorViewClassFeedbackListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorViewClassFeedbackListResponse;
}>;
export declare class InstructorViewClassFeedbackListDataResponse extends InstructorViewClassFeedbackListDataResponse_base {
}
declare const CourseFeedbackListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof FeedbackListItemResponse)[];
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
declare class CourseFeedbackListResponse extends CourseFeedbackListResponse_base {
}
declare const CourseFeedbackListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof CourseFeedbackListResponse;
}>;
export declare class CourseFeedbackListDataResponse extends CourseFeedbackListDataResponse_base {
}
declare const InstructorViewCourseFeedbackListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof InstructorViewFeedbackListItemResponse)[];
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
declare class InstructorViewCourseFeedbackListResponse extends InstructorViewCourseFeedbackListResponse_base {
}
declare const InstructorViewCourseFeedbackListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorViewCourseFeedbackListResponse;
}>;
export declare class InstructorViewCourseFeedbackListDataResponse extends InstructorViewCourseFeedbackListDataResponse_base {
}
export {};
