import { BaseGardenManagerDto } from './base.garden-manager.dto';
import { GardenManagerStatus } from '@common/contracts/constant';
import { BaseGardenDto } from '@garden/dto/base.garden.dto';
export declare class QueryGardenManagerDto {
    name: string;
    email: string;
    status: GardenManagerStatus[];
}
declare const GardenManagerDetailResponse_base: import("@nestjs/common").Type<Pick<BaseGardenManagerDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "email" | "idCardPhoto">>;
declare class GardenManagerDetailResponse extends GardenManagerDetailResponse_base {
    gardens: BaseGardenDto[];
}
declare const GardenManagerListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof GardenManagerDetailResponse)[];
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
declare class GardenManagerListResponse extends GardenManagerListResponse_base {
}
declare const GardenManagerListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof GardenManagerListResponse;
}>;
export declare class GardenManagerListDataResponse extends GardenManagerListDataResponse_base {
}
declare const GardenManagerDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof GardenManagerDetailResponse;
}>;
export declare class GardenManagerDetailDataResponse extends GardenManagerDetailDataResponse_base {
}
export {};
