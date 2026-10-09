import { BaseMediaDto } from '@media/dto/base-media.dto';
import { BaseAssignmentDto, CreateAssignmentDto } from './assignment.dto';
export declare class SessionMediaDto extends BaseMediaDto {
    isAddedLater: boolean;
}
export declare class BaseSessionDto {
    _id: string;
    sessionNumber: number;
    title: string;
    description: string;
    media: SessionMediaDto[];
    assignments: BaseAssignmentDto[];
}
declare const CreateSessionDto_base: import("@nestjs/common").Type<Pick<BaseSessionDto, "description" | "title">>;
export declare class CreateSessionDto extends CreateSessionDto_base {
    media: BaseMediaDto[];
    assignments: CreateAssignmentDto[];
}
export declare class UpdateSessionDto extends CreateSessionDto {
}
export declare class UploadSessionResourcesDto {
    media: SessionMediaDto[];
}
export {};
