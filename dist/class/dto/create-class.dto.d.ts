import { BaseClassDto } from './base.class.dto';
import { CreateSessionDto } from './session.dto';
declare const CreateClassDto_base: import("@nestjs/common").Type<Pick<BaseClassDto, "type" | "description" | "title" | "media" | "price" | "level" | "thumbnail" | "learnerLimit">>;
export declare class CreateClassDto extends CreateClassDto_base {
    sessions: CreateSessionDto[];
}
export {};
