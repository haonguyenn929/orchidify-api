import { HttpStatus } from '@nestjs/common'
export const Errors = {
  /**
   * General
   */
  INTERNAL_SERVER_ERROR: {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Our system is experiencing an issue. Please try again later.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR
  },
  OBJECT_NOT_FOUND: {
    error: 'OBJECT_NOT_FOUND',
    message: 'Object not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  UPLOAD_MEDIA_ERROR: {
    error: 'UPLOAD_MEDIA_ERROR',
    message: 'Media upload failed. Please try again later.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  VALIDATION_FAILED: {
    error: 'VALIDATION_FAILED',
    message: 'Invalid data.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  EMAIL_ALREADY_EXIST: {
    error: 'EMAIL_ALREADY_EXIST',
    message: 'This email is already in use. Please use another email.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Setting
   */
  SETTING_NOT_FOUND: {
    error: 'SETTING_NOT_FOUND',
    message: 'Setting not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },

  /**
   * Authentication
   */
  WRONG_EMAIL_OR_PASSWORD: {
    error: 'WRONG_EMAIL_OR_PASSWORD',
    message: 'Incorrect email or password.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  UNVERIFIED_ACCOUNT: {
    error: 'UNVERIFIED_ACCOUNT',
    message: 'Account is not verified. Please verify and try again.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  INACTIVE_ACCOUNT: {
    error: 'INACTIVE_ACCOUNT',
    message: 'Account has been deactivated.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  REFRESH_TOKEN_INVALID: {
    error: 'REFRESH_TOKEN_INVALID',
    message: 'Invalid session.',
    httpStatus: HttpStatus.NOT_ACCEPTABLE
  },
  WRONG_OTP_CODE: {
    error: 'WRONG_OTP',
    message: 'Invalid OTP code.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  OTP_CODE_IS_EXPIRED: {
    error: 'OTP_CODE_IS_EXPIRED',
    message: 'OTP code has expired.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  RESEND_OTP_CODE_LIMITED: {
    error: 'RESEND_OTP_CODE_LIMITED',
    message: 'You have reached the daily limit for resending OTP.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Learner
   */
  LEARNER_NOT_FOUND: {
    error: 'LEARNER_NOT_FOUND',
    message: 'Learner not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },

  /**
   * Instructor
   */
  INSTRUCTOR_NOT_FOUND: {
    error: 'INSTRUCTOR_NOT_FOUND',
    message: 'Instructor not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  INSTRUCTOR_HAS_IN_PROGRESSING_APPLICATIONS: {
    error: 'INSTRUCTOR_HAS_IN_PROGRESSING_APPLICATIONS',
    message: 'Your application is currently being evaluated. Please wait.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  INSTRUCTOR_HAS_PUBLISHED_OR_IN_PROGRESSING_CLASSES: {
    error: 'INSTRUCTOR_HAS_PUBLISHED_OR_IN_PROGRESSING_CLASSES',
    message: 'Instructor currently has published or in-progress classes.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  INSTRUCTOR_HAS_NO_SELECTED_APPLICATIONS: {
    error: 'INSTRUCTOR_HAS_NO_SELECTED_APPLICATIONS',
    message: 'Instructor application has not been approved by recruitment.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Garden Manager
   */
  GARDEN_MANAGER_NOT_FOUND: {
    error: 'GARDEN_MANAGER_NOT_FOUND',
    message: 'Garden manager not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  GARDEN_MANAGER_IS_ASSIGNED_TO_GARDEN: {
    error: 'GARDEN_MANAGER_IS_ASSIGNED_TO_GARDEN',
    message: 'Garden manager is currently assigned to a garden and cannot be deactivated.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Garden
   */
  GARDEN_NOT_FOUND: {
    error: 'GARDEN_NOT_FOUND',
    message: 'Garden not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  GARDEN_NAME_EXISTED: {
    error: 'GARDEN_NAME_EXISTED',
    message: 'Garden name already exists. Please choose another name.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  SCHEDULED_OR_IN_PROGRESSING_CLASS_IN_GARDEN: {
    error: 'SCHEDULED_OR_IN_PROGRESSING_CLASS_IN_GARDEN',
    message: 'Garden has scheduled or in-progress classes and cannot be deactivated.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  GARDEN_INACTIVE: {
    error: 'GARDEN_INACTIVE',
    message: 'Garden has been deactivated.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Garden Timesheet
   */
  GARDEN_TIMESHEET_NOT_FOUND: {
    error: 'GARDEN_TIMESHEET_NOT_FOUND',
    message: 'Garden timesheet not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  CAN_NOT_UPDATE_GARDEN_TIMESHEET: {
    error: 'CAN_NOT_UPDATE_GARDEN_TIMESHEET',
    message: 'Cannot update garden timesheet.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Course
   */
  COURSE_NOT_FOUND: {
    error: 'COURSE_NOT_FOUND',
    message: 'Course not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  CAN_NOT_UPDATE_COURSE: {
    error: 'CAN_NOT_UPDATE_COURSE',
    message: 'Course cannot be updated.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CAN_NOT_DELETE_COURSE: {
    error: 'CAN_NOT_DELETE_COURSE',
    message: 'Course cannot be deleted.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  COURSE_CAN_NOT_CREATE_REQUEST_TO_PUBLISH_CLASS: {
    error: 'COURSE_CAN_NOT_CREATE_REQUEST_TO_PUBLISH_CLASS',
    message: 'Cannot create a class publication request from this course.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  COURSE_STATUS_INVALID: {
    error: 'COURSE_STATUS_INVALID',
    message: 'Invalid course status.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  TOTAL_SESSIONS_OF_COURSE_INVALID: {
    error: 'TOTAL_SESSIONS_OF_COURSE_INVALID',
    message: 'Invalid total number of course sessions.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  TOTAL_ASSIGNMENTS_OF_COURSE_INVALID: {
    error: 'TOTAL_ASSIGNMENTS_OF_COURSE_INVALID',
    message: 'Invalid total number of course assignments.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  LAST_SESSION_MUST_NOT_HAVE_ASSIGNMENTS: {
    error: 'LAST_SESSION_MUST_NOT_HAVE_ASSIGNMENTS',
    message: 'The last session must not contain assignments.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Course Combo
   */
  CHILD_COURSE_COMBO_INVALID: {
    error: 'CHILD_COURSE_COMBO_INVALID',
    message: 'Invalid course in combo.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  COURSE_COMBO_NOT_FOUND: {
    error: 'COURSE_COMBO_NOT_FOUND',
    message: 'Course combo not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  COURSE_COMBO_EXISTED: {
    error: 'COURSE_COMBO_EXISTED',
    message: 'Course combo already exists.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Class
   */
  CLASS_NOT_FOUND: {
    error: 'CLASS_NOT_FOUND',
    message: 'Class not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  WEEKDAYS_OF_CLASS_INVALID: {
    error: 'WEEKDAYS_OF_CLASS_INVALID',
    message: 'Invalid class weekdays.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CLASS_STATUS_INVALID: {
    error: 'CLASS_STATUS_INVALID',
    message: 'Invalid class status.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CLASS_LEARNER_LIMIT: {
    error: 'CLASS_LEARNER_LIMIT',
    message: 'Class learner limit reached.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CLASS_TIMESHEET_INVALID: {
    error: 'CLASS_TIMESHEET_INVALID',
    message: 'Class schedule conflicts with your schedule.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CLASS_NOT_START_YET: {
    error: 'CLASS_NOT_START_YET',
    message: 'Class has not started yet. Please come back later.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CLASS_ENDED: {
    error: 'CLASS_ENDED',
    message: 'Class has ended.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CLASS_END_TIME_INVALID: {
    error: 'CLASS_END_TIME_INVALID',
    message: 'It is not time to end the class yet.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  NOT_ENROLL_CLASS_YET: {
    error: 'NOT_ENROLL_CLASS_YET',
    message: 'You have not enrolled in this class yet.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CLASS_CAN_NOT_CREATE_REQUEST_TO_CANCEL_CLASS: {
    error: 'CLASS_CAN_NOT_CREATE_REQUEST_TO_CANCEL_CLASS',
    message: 'Cannot create a cancellation request for this class.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Session
   */
  SESSION_NOT_FOUND: {
    error: 'SESSION_NOT_FOUND',
    message: 'Session not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },

  /**
   * Assignment
   */
  ASSIGNMENT_NOT_FOUND: {
    error: 'ASSIGNMENT_NOT_FOUND',
    message: 'Assignment not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  ASSIGNMENT_DEADLINE_INVALID: {
    error: 'ASSIGNMENT_DEADLINE_INVALID',
    message: 'Invalid assignment deadline.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Assignment Submission
   */
  ASSIGNMENT_SUBMISSION_NOT_FOUND: {
    error: 'ASSIGNMENT_SUBMISSION_NOT_FOUND',
    message: 'Assignment submission not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  ASSIGNMENT_SUBMITTED: {
    error: 'ASSIGNMENT_SUBMITTED',
    message: 'You have already submitted this assignment.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  ASSIGNMENT_SUBMISSION_GRADED: {
    error: 'ASSIGNMENT_SUBMISSION_GRADED',
    message: 'Assignment submission has already been graded.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  ASSIGNMENT_SUBMISSION_NOT_START_YET: {
    error: 'ASSIGNMENT_SUBMISSION_NOT_START_YET',
    message: 'Submission period has not started yet. Please come back later.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  ASSIGNMENT_SUBMISSION_DEADLINE_IS_OVER: {
    error: 'ASSIGNMENT_SUBMISSION_DEADLINE_IS_OVER',
    message: 'Assignment submission deadline has passed.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Staff
   */
  STAFF_NOT_FOUND: {
    error: 'STAFF_NOT_FOUND',
    message: 'Staff not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  STAFF_IS_ASSIGNED_TO_RECRUITMENT_PROCESS: {
    error: 'STAFF_IS_ASSIGNED_TO_RECRUITMENT_PROCESS',
    message: 'Staff is currently assigned to a recruitment process.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Recruitment
   */
  RECRUITMENT_NOT_FOUND: {
    error: 'RECRUITMENT_NOT_FOUND',
    message: 'Recruitment application not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  RECRUITMENT_STATUS_INVALID: {
    error: 'RECRUITMENT_STATUS_INVALID',
    message: 'Invalid recruitment application status.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  RECRUITMENT_IS_IN_CHARGED_BY_ANOTHER_STAFF: {
    error: 'RECRUITMENT_IS_IN_CHARGED_BY_ANOTHER_STAFF',
    message: 'Recruitment application is being handled by another staff member.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Class Request
   */
  CLASS_REQUEST_NOT_FOUND: {
    error: 'CLASS_REQUEST_NOT_FOUND',
    message: 'Class request not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  CREATE_CLASS_REQUEST_LIMIT: {
    error: 'CREATE_CLASS_REQUEST_LIMIT',
    message: 'You have reached the daily limit for creating class requests.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CREATE_CLASS_REQUEST_SLOT_NUMBERS_INVALID: {
    error: 'CREATE_CLASS_REQUEST_SLOT_NUMBERS_INVALID',
    message: 'Invalid slot numbers for class request.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CLASS_REQUEST_STATUS_INVALID: {
    error: 'CLASS_REQUEST_STATUS_INVALID',
    message: 'Invalid class request status.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST: {
    error: 'GARDEN_NOT_AVAILABLE_FOR_CLASS_REQUEST',
    message: 'Selected garden is not available for this class request.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CANCEL_CLASS_REQUEST_CAN_NOT_BE_APPROVED: {
    error: 'CANCEL_CLASS_REQUEST_CAN_NOT_BE_APPROVED',
    message: 'Cannot approve cancellation request for this class. Learners have already enrolled.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * LearnClass
   */
  LEARNER_CLASS_EXISTED: {
    error: 'LEARNER_CLASS_EXISTED',
    message: 'You have already enrolled in this class.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Transaction
   */
  TRANSACTION_NOT_FOUND: {
    error: 'TRANSACTION_NOT_FOUND',
    message: 'Transaction not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },

  /**
   * Slot
   */
  SLOT_NOT_FOUND: {
    error: 'SLOT_NOT_FOUND',
    message: 'Slot not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },

  /**
   * Attendance
   */
  NUMBER_OF_ATTENDANCES_INVALID: {
    error: 'NUMBER_OF_ATTENDANCES_INVALID',
    message: 'Invalid number of attendances.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  NOT_TIME_TO_TAKE_ATTENDANCE: {
    error: 'NOT_TIME_TO_TAKE_ATTENDANCE',
    message: 'It is not time to take attendance yet. Please come back later.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  TAKE_ATTENDANCE_IS_OVER: {
    error: 'TAKE_ATTENDANCE_IS_OVER',
    message: 'Attendance time has ended.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Payout Request
   */
  PAYOUT_REQUEST_NOT_FOUND: {
    error: 'PAYOUT_REQUEST_NOT_FOUND',
    message: 'Payout request not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  PAYOUT_REQUEST_STATUS_INVALID: {
    error: 'PAYOUT_REQUEST_STATUS_INVALID',
    message: 'Invalid payout request status.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  CREATE_PAYOUT_REQUEST_LIMIT: {
    error: 'CREATE_PAYOUT_REQUEST_LIMIT',
    message: 'You have reached the daily limit for creating payout requests.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  NOT_ENOUGH_BALANCE_TO_CREATE_PAYOUT_REQUEST: {
    error: 'NOT_ENOUGH_BALANCE_TO_CREATE_PAYOUT_REQUEST',
    message: 'Insufficient balance to create payout request.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  PAYOUT_AMOUNT_LIMIT_PER_DAY: {
    error: 'PAYOUT_AMOUNT_LIMIT_PER_DAY',
    message: 'You have reached the daily payout limit.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  REQUEST_ALREADY_HAS_MADE_PAYOUT: {
    error: 'REQUEST_ALREADY_HAS_MADE_PAYOUT',
    message: 'Payout request has already been paid.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Feedback
   */
  FEEDBACK_NOT_FOUND: {
    error: 'FEEDBACK_NOT_FOUND',
    message: 'Feedback not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },
  FEEDBACK_NOT_OPEN_YET: {
    error: 'FEEDBACK_NOT_OPEN_YET',
    message: 'Feedback period has not opened yet.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  FEEDBACK_IS_OVER: {
    error: 'FEEDBACK_IS_OVER',
    message: 'Feedback period has ended.',
    httpStatus: HttpStatus.BAD_REQUEST
  },
  FEEDBACK_SUBMITTED: {
    error: 'FEEDBACK_SUBMITTED',
    message: 'You have already submitted feedback.',
    httpStatus: HttpStatus.BAD_REQUEST
  },

  /**
   * Certificate
   */
  CERTIFICATE_NOT_FOUND: {
    error: 'CERTIFICATE_NOT_FOUND',
    message: 'Certificate not found.',
    httpStatus: HttpStatus.NOT_FOUND
  },

  /**
   * User Device
   */
  USER_DEVICE_NOT_FOUND: {
    error: 'USER_DEVICE_NOT_FOUND',
    message: 'User device not found.',
    httpStatus: HttpStatus.NOT_FOUND
  }
}
