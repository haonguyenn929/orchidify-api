import { BaseInstructorDto, InstructorCertificateDto } from './base.instructor.dto';
import { InstructorStatus } from '@common/contracts/constant';
declare const InstructorProfileResponse_base: import("@nestjs/common").Type<Pick<BaseInstructorDto, "status" | "_id" | "name" | "email" | "avatar" | "dateOfBirth" | "phone" | "bio" | "idCardPhoto" | "balance" | "paymentInfo">>;
declare class InstructorProfileResponse extends InstructorProfileResponse_base {
}
declare const InstructorProfileDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorProfileResponse;
}>;
export declare class InstructorProfileDataResponse extends InstructorProfileDataResponse_base {
}
declare class InstructorCertificationsResponse {
    docs: InstructorCertificateDto[];
}
declare const InstructorCertificationsDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorCertificationsResponse;
}>;
export declare class InstructorCertificationsDataResponse extends InstructorCertificationsDataResponse_base {
}
export declare class QueryInstructorDto {
    name: string;
    email: string;
    status: InstructorStatus[];
}
declare const InstructorDetailResponse_base: import("@nestjs/common").Type<Pick<BaseInstructorDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "email" | "avatar" | "dateOfBirth" | "phone" | "certificates" | "bio" | "idCardPhoto" | "balance">>;
declare class InstructorDetailResponse extends InstructorDetailResponse_base {
}
declare const InstructorDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorDetailResponse;
}>;
export declare class InstructorDetailDataResponse extends InstructorDetailDataResponse_base {
}
declare const InstructorListItemResponse_base: import("@nestjs/common").Type<Pick<BaseInstructorDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "email" | "avatar" | "dateOfBirth" | "phone" | "bio" | "idCardPhoto">>;
declare class InstructorListItemResponse extends InstructorListItemResponse_base {
}
declare const InstructorListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof InstructorListItemResponse)[];
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
declare class InstructorListResponse extends InstructorListResponse_base {
}
declare const InstructorListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof InstructorListResponse;
}>;
export declare class InstructorListDataResponse extends InstructorListDataResponse_base {
}
declare const ViewerViewInstructorDetailResponse_base: import("@nestjs/common").Type<Pick<BaseInstructorDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "email" | "avatar" | "dateOfBirth" | "phone" | "certificates" | "bio" | "idCardPhoto">>;
declare class ViewerViewInstructorDetailResponse extends ViewerViewInstructorDetailResponse_base {
}
declare const ViewerViewInstructorDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ViewerViewInstructorDetailResponse;
}>;
export declare class ViewerViewInstructorDetailDataResponse extends ViewerViewInstructorDetailDataResponse_base {
}
export {};
