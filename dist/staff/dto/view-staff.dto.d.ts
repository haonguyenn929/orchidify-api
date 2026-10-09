import { BaseStaffDto } from './base.staff.dto';
import { StaffStatus } from '@common/contracts/constant';
export declare class QueryStaffDto {
    name: string;
    email: string;
    status: StaffStatus[];
}
declare const StaffDetailResponse_base: import("@nestjs/common").Type<Pick<BaseStaffDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "email" | "role" | "idCardPhoto" | "staffCode">>;
declare class StaffDetailResponse extends StaffDetailResponse_base {
}
declare const StaffListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof StaffDetailResponse)[];
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
declare class StaffListResponse extends StaffListResponse_base {
}
declare const StaffListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffListResponse;
}>;
export declare class StaffListDataResponse extends StaffListDataResponse_base {
}
declare const StaffDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof StaffDetailResponse;
}>;
export declare class StaffDetailDataResponse extends StaffDetailDataResponse_base {
}
export {};
