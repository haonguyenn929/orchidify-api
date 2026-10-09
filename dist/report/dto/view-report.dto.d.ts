import { BaseReportDto } from './base.report.dto';
import { ClassStatus, InstructorStatus, LearnerStatus, StaffStatus } from '@common/contracts/constant';
export declare class QueryReportByMonthDto {
    year: number;
}
export declare class QueryReportByWeekDto {
    date: Date;
}
declare const ReportTotalSummaryReportListItemResponse_base: import("@nestjs/common").Type<Pick<BaseReportDto, "data" | "_id" | "type">>;
declare class ReportTotalSummaryReportListItemResponse extends ReportTotalSummaryReportListItemResponse_base {
}
declare class ReportTotalSummaryListResponse {
    docs: ReportTotalSummaryReportListItemResponse[];
}
declare const ReportTotalSummaryListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportTotalSummaryListResponse;
}>;
export declare class ReportTotalSummaryListDataResponse extends ReportTotalSummaryListDataResponse_base {
}
declare class ReportQuantityResponse {
    quantity: number;
}
declare class ReportUserByMonthListItemResponse {
    learner: ReportQuantityResponse;
    instructor: ReportQuantityResponse;
}
declare class ReportUserByMonthListResponse {
    docs: ReportUserByMonthListItemResponse[];
}
declare const ReportUserByMonthListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportUserByMonthListResponse;
}>;
export declare class ReportUserByMonthListDataResponse extends ReportUserByMonthListDataResponse_base {
}
declare class ReportInstructorByMonthListItemResponse {
    instructor: ReportQuantityResponse;
}
declare class ReportInstructorByMonthListResponse {
    docs: ReportInstructorByMonthListItemResponse[];
}
declare const ReportInstructorByMonthListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportInstructorByMonthListResponse;
}>;
export declare class ReportInstructorByMonthListDataResponse extends ReportInstructorByMonthListDataResponse_base {
}
declare class ReportLearnerByMonthListItemResponse {
    learner: ReportQuantityResponse;
}
declare class ReportLearnerByMonthListResponse {
    docs: ReportLearnerByMonthListItemResponse[];
}
declare const ReportLearnerByMonthListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportLearnerByMonthListResponse;
}>;
export declare class ReportLearnerByMonthListDataResponse extends ReportLearnerByMonthListDataResponse_base {
}
declare class ReportClassByStatusListItemResponse {
    quantity: number;
    status: ClassStatus;
}
declare class ReportClassByStatusListResponse {
    quantity: number;
    docs: ReportClassByStatusListItemResponse[];
}
declare const ReportClassByStatusListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportClassByStatusListResponse;
}>;
export declare class ReportClassByStatusListDataResponse extends ReportClassByStatusListDataResponse_base {
}
declare class ReportRevenueResponse {
    total: number;
}
declare class ReportRevenueByMonthListItemResponse {
    revenue: ReportRevenueResponse;
}
declare class ReportRevenueByMonthListResponse {
    docs: ReportRevenueByMonthListItemResponse[];
}
declare const ReportRevenueByMonthListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportRevenueByMonthListResponse;
}>;
export declare class ReportRevenueByMonthListDataResponse extends ReportRevenueByMonthListDataResponse_base {
}
declare class ReportStaffByStatusListItemResponse {
    quantity: number;
    status: StaffStatus;
}
declare class ReportStaffByStatusListResponse {
    quantity: number;
    docs: ReportStaffByStatusListItemResponse[];
}
declare const ReportStaffByStatusListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportStaffByStatusListResponse;
}>;
export declare class ReportStaffByStatusListDataResponse extends ReportStaffByStatusListDataResponse_base {
}
declare class ReportTransactionByDateListItemResponse {
    _id: string;
    date: Date;
    paymentAmount: number;
    payoutAmount: number;
}
declare class ReportTransactionByDateListResponse {
    docs: ReportTransactionByDateListItemResponse[];
}
declare const ReportTransactionByDateListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportTransactionByDateListResponse;
}>;
export declare class ReportTransactionByDateListDataResponse extends ReportTransactionByDateListDataResponse_base {
}
declare class ReportTransactionCountByMonthListItemResponse {
    _id: string;
    quantity: number;
    month: number;
}
declare class ReportTransactionCountByMonthListResponse {
    docs: ReportTransactionCountByMonthListItemResponse[];
}
declare const ReportTransactionCountByMonthListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportTransactionCountByMonthListResponse;
}>;
export declare class ReportTransactionCountByMonthListDataResponse extends ReportTransactionCountByMonthListDataResponse_base {
}
declare class ReportCourseByMonthListItemResponse {
    course: ReportQuantityResponse;
}
declare class ReportCourseByMonthListResponse {
    docs: ReportCourseByMonthListItemResponse[];
}
declare const ReportCourseByMonthListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportCourseByMonthListResponse;
}>;
export declare class ReportCourseByMonthListDataResponse extends ReportCourseByMonthListDataResponse_base {
}
declare class ReportCountResponse {
    _id: string;
    count: number;
}
declare class ReportCourseByRateListResponse {
    docs: ReportCountResponse[];
}
declare const ReportCourseByRateListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportCourseByRateListResponse;
}>;
export declare class ReportCourseByRateListDataResponse extends ReportCourseByRateListDataResponse_base {
}
declare class ReportClassByRateListResponse {
    docs: ReportCountResponse[];
}
declare const ReportClassByRateListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportClassByRateListResponse;
}>;
export declare class ReportClassByRateListDataResponse extends ReportClassByRateListDataResponse_base {
}
declare class ReportInstructorByStatusListItemResponse {
    quantity: number;
    status: InstructorStatus;
}
declare class ReportInstructorByStatusListResponse {
    quantity: number;
    docs: ReportInstructorByStatusListItemResponse[];
}
declare const ReportInstructorByStatusListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportInstructorByStatusListResponse;
}>;
export declare class ReportInstructorByStatusListDataResponse extends ReportInstructorByStatusListDataResponse_base {
}
declare class ReportLearnerByStatusListItemResponse {
    quantity: number;
    status: LearnerStatus;
}
declare class ReportLearnerByStatusListResponse {
    quantity: number;
    docs: ReportLearnerByStatusListItemResponse[];
}
declare const ReportLearnerByStatusListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ReportLearnerByStatusListResponse;
}>;
export declare class ReportLearnerByStatusListDataResponse extends ReportLearnerByStatusListDataResponse_base {
}
export {};
