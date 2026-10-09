import { BaseCertificateDto } from './base.certificate.dto';
export declare class QueryCertificateDto {
    ownerId: string;
}
declare const CertificateDetailResponse_base: import("@nestjs/common").Type<Pick<BaseCertificateDto, "createdAt" | "updatedAt" | "_id" | "name" | "url" | "ownerId" | "code">>;
declare class CertificateDetailResponse extends CertificateDetailResponse_base {
}
declare const CertificateListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof CertificateDetailResponse)[];
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
declare class CertificateListResponse extends CertificateListResponse_base {
}
declare const CertificateListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof CertificateListResponse;
}>;
export declare class CertificateListDataResponse extends CertificateListDataResponse_base {
}
declare const CertificateDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof CertificateDetailResponse;
}>;
export declare class CertificateDetailDataResponse extends CertificateDetailDataResponse_base {
}
export {};
