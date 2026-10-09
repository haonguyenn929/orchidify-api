import { BaseAssignmentDto } from './assignment.dto';
import { BaseAssignmentSubmissionDto } from './assignment-submission.dto';
import { BaseInstructorDto } from '@instructor/dto/base.instructor.dto';
declare const AssignmentInstructorDetailResponse_base: import("@nestjs/common").Type<Pick<BaseInstructorDto, "_id" | "name" | "avatar" | "idCardPhoto">>;
declare class AssignmentInstructorDetailResponse extends AssignmentInstructorDetailResponse_base {
}
declare class ViewAssignmentDetailResponse extends BaseAssignmentDto {
    sessionNumber: number;
    submission: BaseAssignmentSubmissionDto;
    instructor: AssignmentInstructorDetailResponse;
}
declare const ViewAssignmentDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ViewAssignmentDetailResponse;
}>;
export declare class ViewAssignmentDetailDataResponse extends ViewAssignmentDetailDataResponse_base {
}
export {};
