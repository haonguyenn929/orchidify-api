"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
const common_1 = require("@nestjs/common");
exports.Errors = {
    INTERNAL_SERVER_ERROR: {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Our system is experiencing an issue. Please try again later.',
        httpStatus: common_1.HttpStatus.INTERNAL_SERVER_ERROR
    },
    OBJECT_NOT_FOUND: {
        error: 'OBJECT_NOT_FOUND',
        message: 'Object not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    UPLOAD_MEDIA_ERROR: {
        error: 'UPLOAD_MEDIA_ERROR',
        message: 'Media upload failed. Please try again later.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    VALIDATION_FAILED: {
        error: 'VALIDATION_FAILED',
        message: 'Invalid data.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    EMAIL_ALREADY_EXIST: {
        error: 'EMAIL_ALREADY_EXIST',
        message: 'This email is already in use. Please use another email.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    SETTING_NOT_FOUND: {
        error: 'SETTING_NOT_FOUND',
        message: 'Setting not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    WRONG_EMAIL_OR_PASSWORD: {
        error: 'WRONG_EMAIL_OR_PASSWORD',
        message: 'Incorrect email or password.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    UNVERIFIED_ACCOUNT: {
        error: 'UNVERIFIED_ACCOUNT',
        message: 'Account is not verified. Please verify and try again.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    INACTIVE_ACCOUNT: {
        error: 'INACTIVE_ACCOUNT',
        message: 'Account has been deactivated.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    REFRESH_TOKEN_INVALID: {
        error: 'REFRESH_TOKEN_INVALID',
        message: 'Invalid session.',
        httpStatus: common_1.HttpStatus.NOT_ACCEPTABLE
    },
    WRONG_OTP_CODE: {
        error: 'WRONG_OTP',
        message: 'Invalid OTP code.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    OTP_CODE_IS_EXPIRED: {
        error: 'OTP_CODE_IS_EXPIRED',
        message: 'OTP code has expired.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    RESEND_OTP_CODE_LIMITED: {
        error: 'RESEND_OTP_CODE_LIMITED',
        message: 'You have reached the daily limit for resending OTP.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    LEARNER_NOT_FOUND: {
        error: 'LEARNER_NOT_FOUND',
        message: 'Learner not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    INSTRUCTOR_NOT_FOUND: {
        error: 'INSTRUCTOR_NOT_FOUND',
        message: 'Instructor not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    INSTRUCTOR_HAS_IN_PROGRESSING_APPLICATIONS: {
        error: 'INSTRUCTOR_HAS_IN_PROGRESSING_APPLICATIONS',
        message: 'Your application is currently being evaluated. Please wait.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    INSTRUCTOR_HAS_PUBLISHED_OR_IN_PROGRESSING_CLASSES: {
        error: 'INSTRUCTOR_HAS_PUBLISHED_OR_IN_PROGRESSING_CLASSES',
        message: 'Instructor currently has published or in-progress classes.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    INSTRUCTOR_HAS_NO_SELECTED_APPLICATIONS: {
        error: 'INSTRUCTOR_HAS_NO_SELECTED_APPLICATIONS',
        message: 'Instructor application has not been approved by recruitment.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    GARDEN_MANAGER_NOT_FOUND: {
        error: 'GARDEN_MANAGER_NOT_FOUND',
        message: 'Garden manager not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    GARDEN_MANAGER_IS_ASSIGNED_TO_GARDEN: {
        error: 'GARDEN_MANAGER_IS_ASSIGNED_TO_GARDEN',
        message: 'Garden manager is currently assigned to a garden and cannot be deactivated.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    GARDEN_NOT_FOUND: {
        error: 'GARDEN_NOT_FOUND',
        message: 'Garden not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    GARDEN_NAME_EXISTED: {
        error: 'GARDEN_NAME_EXISTED',
        message: 'Garden name already exists. Please choose another name.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    SCHEDULED_OR_IN_PROGRESSING_CLASS_IN_GARDEN: {
        error: 'SCHEDULED_OR_IN_PROGRESSING_CLASS_IN_GARDEN',
        message: 'Garden has scheduled or in-progress classes and cannot be deactivated.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    GARDEN_INACTIVE: {
        error: 'GARDEN_INACTIVE',
        message: 'Garden has been deactivated.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    GARDEN_TIMESHEET_NOT_FOUND: {
        error: 'GARDEN_TIMESHEET_NOT_FOUND',
        message: 'Garden timesheet not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    CAN_NOT_UPDATE_GARDEN_TIMESHEET: {
        error: 'CAN_NOT_UPDATE_GARDEN_TIMESHEET',
        message: 'Cannot update garden timesheet.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    COURSE_NOT_FOUND: {
        error: 'COURSE_NOT_FOUND',
        message: 'Course not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    CAN_NOT_UPDATE_COURSE: {
        error: 'CAN_NOT_UPDATE_COURSE',
        message: 'Course cannot be updated.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CAN_NOT_DELETE_COURSE: {
        error: 'CAN_NOT_DELETE_COURSE',
        message: 'Course cannot be deleted.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    COURSE_CAN_NOT_CREATE_REQUEST_TO_PUBLISH_CLASS: {
        error: 'COURSE_CAN_NOT_CREATE_REQUEST_TO_PUBLISH_CLASS',
        message: 'Cannot create a class publication request from this course.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    COURSE_STATUS_INVALID: {
        error: 'COURSE_STATUS_INVALID',
        message: 'Invalid course status.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    TOTAL_SESSIONS_OF_COURSE_INVALID: {
        error: 'TOTAL_SESSIONS_OF_COURSE_INVALID',
        message: 'Invalid total number of course sessions.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    TOTAL_ASSIGNMENTS_OF_COURSE_INVALID: {
        error: 'TOTAL_ASSIGNMENTS_OF_COURSE_INVALID',
        message: 'Invalid total number of course assignments.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    LAST_SESSION_MUST_NOT_HAVE_ASSIGNMENTS: {
        error: 'LAST_SESSION_MUST_NOT_HAVE_ASSIGNMENTS',
        message: 'The last session must not contain assignments.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CHILD_COURSE_COMBO_INVALID: {
        error: 'CHILD_COURSE_COMBO_INVALID',
        message: 'Invalid course in combo.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    COURSE_COMBO_NOT_FOUND: {
        error: 'COURSE_COMBO_NOT_FOUND',
        message: 'Course combo not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    COURSE_COMBO_EXISTED: {
        error: 'COURSE_COMBO_EXISTED',
        message: 'Course combo already exists.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_NOT_FOUND: {
        error: 'CLASS_NOT_FOUND',
        message: 'Class not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    WEEKDAYS_OF_CLASS_INVALID: {
        error: 'WEEKDAYS_OF_CLASS_INVALID',
        message: 'Invalid class weekdays.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_STATUS_INVALID: {
        error: 'CLASS_STATUS_INVALID',
        message: 'Invalid class status.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_LEARNER_LIMIT: {
        error: 'CLASS_LEARNER_LIMIT',
        message: 'Class learner limit reached.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_TIMESHEET_INVALID: {
        error: 'CLASS_TIMESHEET_INVALID',
        message: 'Class schedule conflicts with your schedule.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_NOT_START_YET: {
        error: 'CLASS_NOT_START_YET',
        message: 'Class has not started yet. Please come back later.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_ENDED: {
        error: 'CLASS_ENDED',
        message: 'Class has ended.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_END_TIME_INVALID: {
        error: 'CLASS_END_TIME_INVALID',
        message: 'It is not time to end the class yet.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    NOT_ENROLL_CLASS_YET: {
        error: 'NOT_ENROLL_CLASS_YET',
        message: 'You have not enrolled in this class yet.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_CAN_NOT_CREATE_REQUEST_TO_CANCEL_CLASS: {
        error: 'CLASS_CAN_NOT_CREATE_REQUEST_TO_CANCEL_CLASS',
        message: 'Cannot create a cancellation request for this class.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    SESSION_NOT_FOUND: {
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    ASSIGNMENT_NOT_FOUND: {
        error: 'ASSIGNMENT_NOT_FOUND',
        message: 'Assignment not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    ASSIGNMENT_DEADLINE_INVALID: {
        error: 'ASSIGNMENT_DEADLINE_INVALID',
        message: 'Invalid assignment deadline.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    ASSIGNMENT_SUBMISSION_NOT_FOUND: {
        error: 'ASSIGNMENT_SUBMISSION_NOT_FOUND',
        message: 'Assignment submission not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    ASSIGNMENT_SUBMITTED: {
        error: 'ASSIGNMENT_SUBMITTED',
        message: 'You have already submitted this assignment.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    ASSIGNMENT_SUBMISSION_GRADED: {
        error: 'ASSIGNMENT_SUBMISSION_GRADED',
        message: 'Assignment submission has already been graded.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    ASSIGNMENT_SUBMISSION_NOT_START_YET: {
        error: 'ASSIGNMENT_SUBMISSION_NOT_START_YET',
        message: 'Submission period has not started yet. Please come back later.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    ASSIGNMENT_SUBMISSION_DEADLINE_IS_OVER: {
        error: 'ASSIGNMENT_SUBMISSION_DEADLINE_IS_OVER',
        message: 'Assignment submission deadline has passed.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    STAFF_NOT_FOUND: {
        error: 'STAFF_NOT_FOUND',
        message: 'Staff not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    STAFF_IS_ASSIGNED_TO_RECRUITMENT_PROCESS: {
        error: 'STAFF_IS_ASSIGNED_TO_RECRUITMENT_PROCESS',
        message: 'Staff is currently assigned to a recruitment process.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    RECRUITMENT_NOT_FOUND: {
        error: 'RECRUITMENT_NOT_FOUND',
        message: 'Recruitment application not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    RECRUITMENT_STATUS_INVALID: {
        error: 'RECRUITMENT_STATUS_INVALID',
        message: 'Invalid recruitment application status.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    RECRUITMENT_IS_IN_CHARGED_BY_ANOTHER_STAFF: {
        error: 'RECRUITMENT_IS_IN_CHARGED_BY_ANOTHER_STAFF',
        message: 'Recruitment application is being handled by another staff member.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_REQUEST_NOT_FOUND: {
        error: 'CLASS_REQUEST_NOT_FOUND',
        message: 'Class request not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    CREATE_CLASS_REQUEST_LIMIT: {
        error: 'CREATE_CLASS_REQUEST_LIMIT',
        message: 'You have reached the daily limit for creating class requests.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CREATE_CLASS_REQUEST_SLOT_NUMBERS_INVALID: {
        error: 'CREATE_CLASS_REQUEST_SLOT_NUMBERS_INVALID',
        message: 'Invalid slot numbers for class request.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CLASS_REQUEST_STATUS_INVALID: {
        error: 'CLASS_REQUEST_STATUS_INVALID',
        message: 'Invalid class request status.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST: {
        error: 'GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST',
        message: 'Selected garden is not available for this class request.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CANCEL_CLASS_REQUEST_CAN_NOT_BE_APPROVED: {
        error: 'CANCEL_CLASS_REQUEST_CAN_NOT_BE_APPROVED',
        message: 'Cannot approve cancellation request for this class. Learners have already enrolled.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    LEARNER_CLASS_EXISTED: {
        error: 'LEARNER_CLASS_EXISTED',
        message: 'You have already enrolled in this class.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    TRANSACTION_NOT_FOUND: {
        error: 'TRANSACTION_NOT_FOUND',
        message: 'Transaction not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    SLOT_NOT_FOUND: {
        error: 'SLOT_NOT_FOUND',
        message: 'Slot not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    NUMBER_OF_ATTENDANCES_INVALID: {
        error: 'NUMBER_OF_ATTENDANCES_INVALID',
        message: 'Invalid number of attendances.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    NOT_TIME_TO_TAKE_ATTENDANCE: {
        error: 'NOT_TIME_TO_TAKE_ATTENDANCE',
        message: 'It is not time to take attendance yet. Please come back later.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    TAKE_ATTENDANCE_IS_OVER: {
        error: 'TAKE_ATTENDANCE_IS_OVER',
        message: 'Attendance time has ended.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    PAYOUT_REQUEST_NOT_FOUND: {
        error: 'PAYOUT_REQUEST_NOT_FOUND',
        message: 'Payout request not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    PAYOUT_REQUEST_STATUS_INVALID: {
        error: 'PAYOUT_REQUEST_STATUS_INVALID',
        message: 'Invalid payout request status.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CREATE_PAYOUT_REQUEST_LIMIT: {
        error: 'CREATE_PAYOUT_REQUEST_LIMIT',
        message: 'You have reached the daily limit for creating payout requests.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    NOT_ENOUGH_BALANCE_TO_CREATE_PAYOUT_REQUEST: {
        error: 'NOT_ENOUGH_BALANCE_TO_CREATE_PAYOUT_REQUEST',
        message: 'Insufficient balance to create payout request.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    PAYOUT_AMOUNT_LIMIT_PER_DAY: {
        error: 'PAYOUT_AMOUNT_LIMIT_PER_DAY',
        message: 'You have reached the daily payout limit.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    REQUEST_ALREADY_HAS_MADE_PAYOUT: {
        error: 'REQUEST_ALREADY_HAS_MADE_PAYOUT',
        message: 'Payout request has already been paid.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    FEEDBACK_NOT_FOUND: {
        error: 'FEEDBACK_NOT_FOUND',
        message: 'Feedback not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    FEEDBACK_NOT_OPEN_YET: {
        error: 'FEEDBACK_NOT_OPEN_YET',
        message: 'Feedback period has not opened yet.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    FEEDBACK_IS_OVER: {
        error: 'FEEDBACK_IS_OVER',
        message: 'Feedback period has ended.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    FEEDBACK_SUBMITTED: {
        error: 'FEEDBACK_SUBMITTED',
        message: 'You have already submitted feedback.',
        httpStatus: common_1.HttpStatus.BAD_REQUEST
    },
    CERTIFICATE_NOT_FOUND: {
        error: 'CERTIFICATE_NOT_FOUND',
        message: 'Certificate not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    },
    USER_DEVICE_NOT_FOUND: {
        error: 'USER_DEVICE_NOT_FOUND',
        message: 'User device not found.',
        httpStatus: common_1.HttpStatus.NOT_FOUND
    }
};
//# sourceMappingURL=error.js.map