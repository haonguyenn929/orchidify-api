import { BaseCourseDto } from './base.course.dto';
import { CreateSessionDto } from '@class/dto/session.dto';
declare const CreateCourseDto_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "type" | "description" | "title" | "media" | "price" | "level" | "duration" | "thumbnail" | "learnerLimit" | "gardenRequiredToolkits">>;
export declare class CreateCourseDto extends CreateCourseDto_base {
    sessions: CreateSessionDto[];
}
export {};
