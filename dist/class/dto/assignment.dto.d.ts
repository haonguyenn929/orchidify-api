import { BaseMediaDto } from '@media/dto/base-media.dto';
export declare class BaseAssignmentDto {
    _id: string;
    title: string;
    description: string;
    attachments: BaseMediaDto[];
    deadline: Date;
}
declare const CreateAssignmentDto_base: import("@nestjs/common").Type<Pick<BaseAssignmentDto, "description" | "title" | "attachments">>;
export declare class CreateAssignmentDto extends CreateAssignmentDto_base {
}
export declare class UpdateAssignmentDto {
    deadline: Date;
}
export {};
