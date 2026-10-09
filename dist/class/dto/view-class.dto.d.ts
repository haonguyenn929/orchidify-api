import { BaseClassDto } from './base.class.dto';
import { ClassStatus, CourseLevel } from '@common/contracts/constant';
import { BaseGardenDto } from '@garden/dto/base.garden.dto';
import { BaseInstructorDto } from '@instructor/dto/base.instructor.dto';
import { LearnerDetailResponse } from '@learner/dto/view-learner.dto';
export declare class QueryClassDto {
    title: string;
    type: string;
    level: CourseLevel[];
    status: ClassStatus[];
    fromPrice: number;
    toPrice: number;
}
declare const ClassInstructorDetailResponse_base: import("@nestjs/common").Type<Pick<BaseInstructorDto, "name">>;
declare class ClassInstructorDetailResponse extends ClassInstructorDetailResponse_base {
}
declare const ClassGardenDetailResponse_base: import("@nestjs/common").Type<Pick<BaseGardenDto, "name">>;
export declare class ClassGardenDetailResponse extends ClassGardenDetailResponse_base {
}
declare const ClassCourseDetailResponse_base: import("@nestjs/common").Type<Pick<BaseClassDto, "code">>;
export declare class ClassCourseDetailResponse extends ClassCourseDetailResponse_base {
}
declare const InstructorViewClassListItemResponse_base: import("@nestjs/common").Type<Pick<BaseClassDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "title" | "code" | "startDate" | "price" | "level" | "duration" | "thumbnail" | "learnerLimit" | "learnerQuantity" | "rate" | "instructorId" | "ratingSummary" | "courseId" | "weekdays" | "slotNumbers" | "progress">>;
declare class InstructorViewClassListItemResponse extends InstructorViewClassListItemResponse_base {
    course: ClassCourseDetailResponse;
}
declare const InstructorViewClassListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof InstructorViewClassListItemResponse)[];
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
declare class InstructorViewClassListResponse extends InstructorViewClassListResponse_base {
}
declare const InstructorViewClassListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorViewClassListResponse;
}>;
export declare class InstructorViewClassListDataResponse extends InstructorViewClassListDataResponse_base {
}
declare const InstructorViewClassDetailResponse_base: import("@nestjs/common").Type<Pick<BaseClassDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "title" | "code" | "startDate" | "histories" | "media" | "price" | "level" | "duration" | "thumbnail" | "sessions" | "learnerLimit" | "learnerQuantity" | "rate" | "gardenRequiredToolkits" | "instructorId" | "ratingSummary" | "courseId" | "weekdays" | "slotNumbers" | "cancelReason" | "gardenId" | "progress">>;
declare class InstructorViewClassDetailResponse extends InstructorViewClassDetailResponse_base {
    garden: ClassGardenDetailResponse;
    course: ClassCourseDetailResponse;
    learners: LearnerDetailResponse[];
}
declare const InstructorViewClassDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorViewClassDetailResponse;
}>;
export declare class InstructorViewClassDetailDataResponse extends InstructorViewClassDetailDataResponse_base {
}
declare const StaffViewClassListItemResponse_base: import("@nestjs/common").Type<Pick<BaseClassDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "title" | "code" | "startDate" | "price" | "level" | "duration" | "thumbnail" | "learnerLimit" | "learnerQuantity" | "rate" | "instructorId" | "ratingSummary" | "courseId" | "weekdays" | "slotNumbers" | "progress">>;
declare class StaffViewClassListItemResponse extends StaffViewClassListItemResponse_base {
    course: ClassCourseDetailResponse;
    instructor: ClassInstructorDetailResponse;
}
declare const StaffViewClassListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof StaffViewClassListItemResponse)[];
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
declare class StaffViewClassListResponse extends StaffViewClassListResponse_base {
}
declare const StaffViewClassListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffViewClassListResponse;
}>;
export declare class StaffViewClassListDataResponse extends StaffViewClassListDataResponse_base {
}
declare const StaffViewClassDetailResponse_base: import("@nestjs/common").Type<Pick<BaseClassDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "title" | "code" | "startDate" | "histories" | "media" | "price" | "level" | "duration" | "thumbnail" | "sessions" | "learnerLimit" | "learnerQuantity" | "rate" | "gardenRequiredToolkits" | "instructorId" | "ratingSummary" | "courseId" | "weekdays" | "slotNumbers" | "cancelReason" | "gardenId" | "progress">>;
declare class StaffViewClassDetailResponse extends StaffViewClassDetailResponse_base {
    garden: ClassGardenDetailResponse;
    instructor: ClassInstructorDetailResponse;
    course: ClassCourseDetailResponse;
    learners: LearnerDetailResponse[];
}
declare const StaffViewClassDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffViewClassDetailResponse;
}>;
export declare class StaffViewClassDetailDataResponse extends StaffViewClassDetailDataResponse_base {
}
declare const GardenManagerViewClassDetailResponse_base: import("@nestjs/common").Type<Pick<BaseClassDto, "_id" | "title" | "code" | "gardenRequiredToolkits" | "instructorId" | "courseId">>;
declare class GardenManagerViewClassDetailResponse extends GardenManagerViewClassDetailResponse_base {
    instructor: ClassInstructorDetailResponse;
    course: ClassCourseDetailResponse;
}
declare const GardenManagerViewClassDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof GardenManagerViewClassDetailResponse;
}>;
export declare class GardenManagerViewClassDetailDataResponse extends GardenManagerViewClassDetailDataResponse_base {
}
declare const LearnerViewMyClassListItemResponse_base: import("@nestjs/common").Type<Pick<BaseClassDto, "status" | "_id" | "type" | "title" | "code" | "price" | "level" | "thumbnail" | "progress">>;
declare class LearnerViewMyClassListItemResponse extends LearnerViewMyClassListItemResponse_base {
    instructor: ClassInstructorDetailResponse;
}
declare const LearnerViewMyClassListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof LearnerViewMyClassListItemResponse)[];
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
declare class LearnerViewMyClassListResponse extends LearnerViewMyClassListResponse_base {
}
declare const LearnerViewMyClassListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof LearnerViewMyClassListResponse;
}>;
export declare class LearnerViewMyClassListDataResponse extends LearnerViewMyClassListDataResponse_base {
}
declare const MyClassInstructorDetailResponse_base: import("@nestjs/common").Type<Pick<BaseInstructorDto, "_id" | "name" | "avatar" | "bio" | "idCardPhoto">>;
declare class MyClassInstructorDetailResponse extends MyClassInstructorDetailResponse_base {
}
declare const LearnerViewMyClassDetailResponse_base: import("@nestjs/common").Type<Pick<BaseClassDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "title" | "code" | "startDate" | "histories" | "media" | "price" | "level" | "duration" | "thumbnail" | "sessions" | "learnerLimit" | "learnerQuantity" | "rate" | "gardenRequiredToolkits" | "instructorId" | "ratingSummary" | "courseId" | "weekdays" | "slotNumbers" | "cancelReason" | "gardenId" | "progress">>;
declare class LearnerViewMyClassDetailResponse extends LearnerViewMyClassDetailResponse_base {
    garden: ClassGardenDetailResponse;
    instructor: MyClassInstructorDetailResponse;
    hasSentFeedback: boolean;
}
declare const LearnerViewMyClassDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof LearnerViewMyClassDetailResponse;
}>;
export declare class LearnerViewMyClassDetailDataResponse extends LearnerViewMyClassDetailDataResponse_base {
}
export {};
