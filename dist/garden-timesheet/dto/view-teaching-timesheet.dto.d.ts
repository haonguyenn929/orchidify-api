import { SlotNumber, TimesheetType } from '@common/contracts/constant';
import { BaseSlotMetadataDto } from './slot.dto';
import { BaseGardenDto } from '@garden/dto/base.garden.dto';
export declare class QueryInstructorTimesheetDto {
    readonly date: Date;
    readonly type: TimesheetType;
    readonly instructorId: string;
}
declare const QueryTeachingTimesheetDto_base: import("@nestjs/common").Type<Pick<QueryInstructorTimesheetDto, "date" | "type">>;
export declare class QueryTeachingTimesheetDto extends QueryTeachingTimesheetDto_base {
    instructorId: string;
}
declare const TeachingTimesheetGardenDetailResponse_base: import("@nestjs/common").Type<Pick<BaseGardenDto, "name">>;
declare class TeachingTimesheetGardenDetailResponse extends TeachingTimesheetGardenDetailResponse_base {
}
export declare class ViewTeachingTimesheetItemResponse {
    _id: string;
    slotNumber: SlotNumber;
    start: Date;
    end: Date;
    status: string;
    classId: string;
    metadata: BaseSlotMetadataDto;
    garden: TeachingTimesheetGardenDetailResponse;
}
declare class ViewTeachingTimesheetListResponse {
    docs: ViewTeachingTimesheetItemResponse[];
}
declare const ViewTeachingTimesheetListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ViewTeachingTimesheetListResponse;
}>;
export declare class ViewTeachingTimesheetListDataResponse extends ViewTeachingTimesheetListDataResponse_base {
}
export {};
