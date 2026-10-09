import { BaseCourseDto } from './base.course.dto';
import { CourseInstructorDto } from './view-course.dto';
export declare class QueryCourseComboDto {
    title: string;
}
export declare class StaffQueryCourseComboDto extends QueryCourseComboDto {
}
declare const CourseComboListItemResponse_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "status" | "createdAt" | "updatedAt" | "_id" | "title" | "code" | "childCourseIds" | "discount" | "instructorId">>;
declare class CourseComboListItemResponse extends CourseComboListItemResponse_base {
    instructor: CourseInstructorDto;
}
declare const CourseComboListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof CourseComboListItemResponse)[];
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
declare class CourseComboListResponse extends CourseComboListResponse_base {
}
declare const CourseComboListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof CourseComboListResponse;
}>;
export declare class CourseComboListDataResponse extends CourseComboListDataResponse_base {
}
declare const ChildCourseComboDetailResponse_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "status" | "createdAt" | "updatedAt" | "_id" | "type" | "description" | "title" | "code" | "price" | "level" | "learnerLimit" | "rate" | "discount">>;
declare class ChildCourseComboDetailResponse extends ChildCourseComboDetailResponse_base {
}
declare const CourseComboDetailResponse_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "status" | "createdAt" | "updatedAt" | "_id" | "description" | "title" | "code" | "childCourseIds" | "discount" | "instructorId">>;
declare class CourseComboDetailResponse extends CourseComboDetailResponse_base {
    childCourses: ChildCourseComboDetailResponse[];
}
declare const CourseComboDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof CourseComboDetailResponse;
}>;
export declare class CourseComboDetailDataResponse extends CourseComboDetailDataResponse_base {
}
declare const StaffViewCourseComboListItemResponse_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "status" | "createdAt" | "updatedAt" | "_id" | "title" | "code" | "childCourseIds" | "discount" | "instructorId">>;
declare class StaffViewCourseComboListItemResponse extends StaffViewCourseComboListItemResponse_base {
    instructor: CourseInstructorDto;
}
declare const StaffViewCourseComboListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof StaffViewCourseComboListItemResponse)[];
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
declare class StaffViewCourseComboListResponse extends StaffViewCourseComboListResponse_base {
}
declare const StaffViewCourseComboListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffViewCourseComboListResponse;
}>;
export declare class StaffViewCourseComboListDataResponse extends StaffViewCourseComboListDataResponse_base {
}
declare class StaffViewCourseComboDetailResponse extends CourseComboDetailResponse {
    instructor: CourseInstructorDto;
}
declare const StaffViewCourseComboDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffViewCourseComboDetailResponse;
}>;
export declare class StaffViewCourseComboDetailDataResponse extends StaffViewCourseComboDetailDataResponse_base {
}
export {};
