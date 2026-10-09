import { BaseLearnerDto } from '@learner/dto/base.learner.dto';
import { BaseAssignmentSubmissionDto } from './assignment-submission.dto';
declare const SubmissionLearnerDetailResponse_base: import("@nestjs/common").Type<Pick<BaseLearnerDto, "_id" | "name" | "email" | "avatar">>;
declare class SubmissionLearnerDetailResponse extends SubmissionLearnerDetailResponse_base {
}
declare class AssignmentSubmissionItemResponse {
    learner: SubmissionLearnerDetailResponse;
    submission: BaseAssignmentSubmissionDto;
}
declare class AssignmentSubmissionListResponse {
    docs: AssignmentSubmissionItemResponse[];
}
declare const AssignmentSubmissionListDataResponse_base: import("@nestjs/common").Type<{
    data: typeof AssignmentSubmissionListResponse;
}>;
export declare class AssignmentSubmissionListDataResponse extends AssignmentSubmissionListDataResponse_base {
}
declare class ViewAssignmentSubmissionDetailResponse extends BaseAssignmentSubmissionDto {
    learner: SubmissionLearnerDetailResponse;
}
declare const ViewAssignmentSubmissionDetailDataResponse_base: import("@nestjs/common").Type<{
    data: typeof ViewAssignmentSubmissionDetailResponse;
}>;
export declare class ViewAssignmentSubmissionDetailDataResponse extends ViewAssignmentSubmissionDetailDataResponse_base {
}
export {};
