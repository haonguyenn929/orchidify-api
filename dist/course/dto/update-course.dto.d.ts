import { BaseCourseDto } from './base.course.dto';
import { UpdateSessionDto } from '@class/dto/session.dto';
declare const UpdateCourseDto_base: import("@nestjs/common").Type<Pick<BaseCourseDto, "type" | "description" | "title" | "media" | "price" | "level" | "duration" | "thumbnail" | "learnerLimit" | "gardenRequiredToolkits">>;
export declare class UpdateCourseDto extends UpdateCourseDto_base {
    sessions: UpdateSessionDto[];
}
export {};
