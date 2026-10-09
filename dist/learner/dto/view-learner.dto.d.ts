import { BaseLearnerDto } from './base.learner.dto';
import { LearnerStatus } from '@common/contracts/constant';
export declare class QueryLearnerDto {
    name: string;
    email: string;
    status: LearnerStatus[];
}
declare const LearnerProfileResponse_base: import("@nestjs/common").Type<Pick<BaseLearnerDto, "status" | "_id" | "name" | "email" | "avatar" | "dateOfBirth" | "phone">>;
declare class LearnerProfileResponse extends LearnerProfileResponse_base {
}
declare const LearnerProfileDataResponse_base: import("@nestjs/common").Type<{
    data: typeof LearnerProfileResponse;
}>;
export declare class LearnerProfileDataResponse extends LearnerProfileDataResponse_base {
}
declare const LearnerDetailResponse_base: import("@nestjs/common").Type<Pick<BaseLearnerDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "email" | "avatar" | "dateOfBirth" | "phone">>;
export declare class LearnerDetailResponse extends LearnerDetailResponse_base {
}
declare const LearnerDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof LearnerDetailResponse;
}>;
export declare class LearnerDetailDataResponse extends LearnerDetailDataResponse_base {
}
declare const LearnerListItemResponse_base: import("@nestjs/common").Type<Pick<BaseLearnerDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "email" | "avatar" | "dateOfBirth" | "phone">>;
declare class LearnerListItemResponse extends LearnerListItemResponse_base {
}
declare const LearnerListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof LearnerListItemResponse)[];
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
declare class LearnerListResponse extends LearnerListResponse_base {
}
declare const LearnerListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof LearnerListResponse;
}>;
export declare class LearnerListDataResponse extends LearnerListDataResponse_base {
}
export {};
