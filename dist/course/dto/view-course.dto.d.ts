import { BaseCourseDto } from './base.course.dto';
import { CourseStatus } from '@common/contracts/constant';
import { CourseLevel } from '@src/common/contracts/constant';
import { BaseInstructorDto } from '@instructor/dto/base.instructor.dto';
import { BaseSessionDto } from '@class/dto/session.dto';
import { BaseClassDto } from '@class/dto/base.class.dto';
import { BaseGardenDto } from '@garden/dto/base.garden.dto';
import { BaseLearnerDto } from '@learner/dto/base.learner.dto';
export declare class QueryCourseDto {
    title: string;
    type: string;
    level: CourseLevel[];
    status: CourseStatus[];
}
export declare class StaffQueryCourseDto extends QueryCourseDto {
    status: CourseStatus[];
}
declare const PublicQueryCourseDto_base: import("@nestjs/common").Type<Pick<QueryCourseDto, "type" | "title" | "level">>;
export declare class PublicQueryCourseDto extends PublicQueryCourseDto_base {
    fromPrice: number;
    toPrice: number;
}
declare const CourseInstructorDto_base: import("@nestjs/common").Type<Pick<BaseInstructorDto, "_id" | "name" | "email" | "avatar" | "bio" | "idCardPhoto">>;
export declare class CourseInstructorDto extends CourseInstructorDto_base {
}
declare const CourseListItemResponse_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "title" | "code" | "price" | "level" | "duration" | "thumbnail" | "learnerLimit" | "rate" | "discount" | "instructorId" | "isRequesting" | "ratingSummary">>;
declare class CourseListItemResponse extends CourseListItemResponse_base {
    instructor: CourseInstructorDto;
}
declare const CourseListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof CourseListItemResponse)[];
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
declare class CourseListResponse extends CourseListResponse_base {
}
declare const CourseListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof CourseListResponse;
}>;
export declare class CourseListDataResponse extends CourseListDataResponse_base {
}
declare const CourseDetailResponse_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "title" | "code" | "media" | "price" | "level" | "duration" | "thumbnail" | "sessions" | "learnerLimit" | "rate" | "discount" | "gardenRequiredToolkits" | "instructorId" | "isRequesting" | "ratingSummary">>;
declare class CourseDetailResponse extends CourseDetailResponse_base {
    instructor: CourseInstructorDto;
}
declare const CourseDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof CourseDetailResponse;
}>;
export declare class CourseDetailDataResponse extends CourseDetailDataResponse_base {
}
declare const PublicCourseListItemResponse_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "title" | "code" | "price" | "level" | "duration" | "thumbnail" | "learnerLimit" | "rate" | "discount" | "instructorId" | "isRequesting" | "ratingSummary">>;
declare class PublicCourseListItemResponse extends PublicCourseListItemResponse_base {
    instructor: CourseInstructorDto;
    classesCount: number;
}
declare const PublicCourseListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof PublicCourseListItemResponse)[];
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
declare class PublicCourseListResponse extends PublicCourseListResponse_base {
}
declare const PublishCourseListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof PublicCourseListResponse;
}>;
export declare class PublishCourseListDataResponse extends PublishCourseListDataResponse_base {
}
declare class LearnerViewCourseListItemResponse extends PublicCourseListItemResponse {
    discount: number;
    finalPrice: number;
}
declare const LearnerViewCourseListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof LearnerViewCourseListItemResponse)[];
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
declare class LearnerViewCourseListResponse extends LearnerViewCourseListResponse_base {
}
declare const LearnerViewCourseListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof LearnerViewCourseListResponse;
}>;
export declare class LearnerViewCourseListDataResponse extends LearnerViewCourseListDataResponse_base {
}
declare const PublicCourseClassGardenDto_base: import("@nestjs/common").Type<Pick<BaseGardenDto, "_id" | "name">>;
declare class PublicCourseClassGardenDto extends PublicCourseClassGardenDto_base {
}
declare const PublicCourseLearnerClassDto_base: import("@nestjs/common").Type<Pick<BaseLearnerDto, "_id">>;
declare class PublicCourseLearnerClassDto extends PublicCourseLearnerClassDto_base {
}
declare const PublicCourseClassDto_base: import("@nestjs/common").Type<Pick<BaseClassDto, "status" | "_id" | "title" | "code" | "startDate" | "duration" | "learnerLimit" | "learnerQuantity" | "weekdays" | "slotNumbers" | "gardenId">>;
declare class PublicCourseClassDto extends PublicCourseClassDto_base {
    garden: PublicCourseClassGardenDto;
    learnerClass: PublicCourseLearnerClassDto;
}
declare const PublicCourseDetailResponse_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "title" | "code" | "media" | "price" | "level" | "duration" | "thumbnail" | "sessions" | "learnerLimit" | "rate" | "discount" | "gardenRequiredToolkits" | "instructorId" | "isRequesting" | "ratingSummary">>;
declare class PublicCourseDetailResponse extends PublicCourseDetailResponse_base {
    instructor: CourseInstructorDto;
    sessions: BaseSessionDto[];
    classes: PublicCourseClassDto;
}
declare const PublicCourseDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof PublicCourseDetailResponse;
}>;
export declare class PublicCourseDetailDataResponse extends PublicCourseDetailDataResponse_base {
}
declare class LearnerViewCourseDetailResponse extends PublicCourseDetailResponse {
    discount: number;
    finalPrice: number;
}
declare const LearnerViewCourseDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof LearnerViewCourseDetailResponse;
}>;
export declare class LearnerViewCourseDetailDataResponse extends LearnerViewCourseDetailDataResponse_base {
}
export {};
