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
import { GardenStatus } from '@common/contracts/constant';
import { BaseGardenDto } from '@garden/dto/base.garden.dto';
import { BaseGardenManagerDto } from '@garden-manager/dto/base.garden-manager.dto';
import { Types } from 'mongoose';
export declare class QueryGardenDto {
    name: string;
    address: string;
    status: GardenStatus[];
    gardenManagerId: Types.ObjectId;
}
declare const GardenListItemResponse_base: import("@nestjs/common").Type<Pick<BaseGardenDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "description" | "gardenManagerId" | "address" | "addressLink" | "maxClass">>;
declare class GardenListItemResponse extends GardenListItemResponse_base {
    gardenManager: BaseGardenManagerDto;
}
declare const GardenListResponse_base: import("@nestjs/common").Type<{
    docs: (typeof GardenListItemResponse)[];
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
declare class GardenListResponse extends GardenListResponse_base {
}
declare const GardenListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof GardenListResponse;
}>;
export declare class GardenListDataResponse extends GardenListDataResponse_base {
}
declare const GardenDetailResponse_base: import("@nestjs/common").Type<Pick<BaseGardenDto, "status" | "createdAt" | "updatedAt" | "_id" | "name" | "description" | "gardenManagerId" | "address" | "addressLink" | "images" | "maxClass">>;
declare class GardenDetailResponse extends GardenDetailResponse_base {
    gardenManager: BaseGardenManagerDto;
}
declare const GardenDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof GardenDetailResponse;
}>;
export declare class GardenDetailDataResponse extends GardenDetailDataResponse_base {
}
export {};
