import * as moment from 'moment-timezone'
import { AttendanceStatus, ClassStatus, SlotNumber, SlotStatus, UserRole } from '@common/contracts/constant'
import { AppLogger } from '@common/services/app-logger.service'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject } from '@nestjs/common'
import { JobName, QueueName } from '@queue/contracts/constant'
import { Job } from 'bullmq'
import { VN_TIMEZONE } from '@src/config'
import { IClassService } from '@class/services/class.service'
import { IGardenTimesheetService } from '@garden-timesheet/services/garden-timesheet.service'
import { ISettingService } from '@setting/services/setting.service'
import { SettingKey } from '@setting/contracts/constant'
import { Class } from '@class/schemas/class.schema'
import { ILearnerClassService } from '@class/services/learner-class.service'
import { GeneratePDFResponse, HelperService } from '@common/services/helper.service'
import * as _ from 'lodash'
import * as fs from 'fs'
import { MediaService } from '@media/services/media.service'
import { ICertificateService } from '@certificate/services/certificate.service'
import * as path from 'path'
import { UploadApiResponse } from 'cloudinary'
import { IAttendanceService } from '@attendance/services/attendance.service'
import { IAssignmentSubmissionService } from '@class/services/assignment-submission.service'
import { INotificationService } from '@notification/services/notification.service'
import { FCMNotificationDataType } from '@notification/contracts/constant'
import { Types } from 'mongoose'
import { IGardenService } from '@garden/services/garden.service'
import { ReportTag, ReportType } from '@report/contracts/constant'
import { IReportService } from '@report/services/report.service'

@Processor(QueueName.CLASS)
export class ClassQueueConsumer extends WorkerHost {
  private readonly appLogger = new AppLogger(ClassQueueConsumer.name)
  constructor(
    private readonly helperService: HelperService,
    private readonly mediaService: MediaService,
    @Inject(IClassService)
    private readonly classService: IClassService,
    @Inject(IGardenTimesheetService)
    private readonly gardenTimesheetService: IGardenTimesheetService,
    @Inject(ISettingService)
    private readonly settingService: ISettingService,
    @Inject(ILearnerClassService)
    private readonly learnerClassService: ILearnerClassService,
    @Inject(ICertificateService)
    private readonly certificateService: ICertificateService,
    @Inject(IAttendanceService)
    private readonly attendanceService: IAttendanceService,
    @Inject(IAssignmentSubmissionService)
    private readonly assignmentSubmissionService: IAssignmentSubmissionService,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
    @Inject(IGardenService)
    private readonly gardenService: IGardenService,
    @Inject(IReportService)
    private readonly reportService: IReportService
  ) {
    super()
  }

  async process(job: Job<any>): Promise<any> {
    this.appLogger.log(`[process] Processing job id=${job.id}`)
    try {
      switch (job.name) {
        case JobName.UpdateClassStatus: {
          return await this.updateClassStatus(job)
        }
        case JobName.UpdateClassProgressEndSlot: {
          return await this.updateClassProgressEndSlot(job)
        }
        case JobName.ClassAutoCompleted: {
          return await this.completeClassAutomatically(job)
        }
        case JobName.SendClassCertificate: {
          return await this.sendClassCertificate(job)
        }
        case JobName.RemindClassStartSlot: {
          return await this.remindClassStartSlot(job)
        }
        case JobName.RemindClassStartSoon: {
          return await this.remindClassStartSoon(job)
        }
        default:
      }
      this.appLogger.log('[process] Job processed successfully')
    } catch (error) {
      this.appLogger.error(error)
      throw error // Re-queue job in case of failure
    }
  }

  async updateClassStatus(job: Job) {
    this.appLogger.debug(`[updateClassStatus]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`)

    try {
      this.appLogger.log(`[updateClassStatus]: Start update class status... id=${job.id}`)
      const courseClasses = await this.classService.findManyByStatus([ClassStatus.PUBLISHED])
      if (courseClasses.length === 0) return 'No PUBLISHED status class'

      const nowMoment = moment().tz(VN_TIMEZONE).startOf('date')
      const updateClassStatusPromises = []
      const updateClassToInProgress = []
      const updateClassToCanceled = []
      const updateClassReportPromises = []
      const classAutoCancelMinLearners =
        Number((await this.settingService.findByKey(SettingKey.ClassAutoCancelMinLearners)).value) || 5

      for await (const courseClass of courseClasses) {
        const startOfDate = moment(courseClass.startDate).tz(VN_TIMEZONE).startOf('date')
        if (startOfDate.isSameOrBefore(nowMoment)) {
          // BR-42: If there are not enough 5 learners when the class starts, the class will be cancelled, learners will be refunded 100%.
          const learnerQuantity = courseClass.learnerQuantity
          if (learnerQuantity < classAutoCancelMinLearners) {
            updateClassToCanceled.push(courseClass._id)
            updateClassStatusPromises.push(
              this.classService.cancelClass(
                courseClass._id,
                { cancelReason: 'System cancel' },
                { role: 'SYSTEM' as UserRole }
              )
            )
          } else {
            updateClassToInProgress.push(courseClass._id)
            updateClassStatusPromises.push(
              this.classService.update(
                { _id: courseClass._id },
                {
                  $set: { status: ClassStatus.IN_PROGRESS },
                  $push: {
                    histories: {
                      status: ClassStatus.IN_PROGRESS,
                      timestamp: new Date(),
                      userRole: 'SYSTEM' as UserRole
                    }
                  }
                }
              )
            )
            // update class report
            updateClassReportPromises.push(
              this.reportService.update(
                {
                  type: ReportType.ClassSum,
                  tag: ReportTag.User,
                  ownerId: new Types.ObjectId(courseClass.instructorId)
                },
                {
                  $inc: {
                    [`data.${ClassStatus.PUBLISHED}.quantity`]: -1,
                    [`data.${ClassStatus.IN_PROGRESS}.quantity`]: 1
                  }
                }
              )
            )
          }
        }
      }
      await Promise.all(updateClassStatusPromises)
      await Promise.all(updateClassReportPromises)
      // update class report
      this.reportService.update(
        { type: ReportType.ClassSum, tag: ReportTag.System },
        {
          $inc: {
            [`data.${ClassStatus.PUBLISHED}.quantity`]: -updateClassToInProgress.length,
            [`data.${ClassStatus.IN_PROGRESS}.quantity`]: updateClassToInProgress.length
          }
        }
      )

      this.appLogger.log(`[updateClassStatus]: End update status... id=${job.id}`)
      return { status: true, updateClassToInProgress, updateClassToCanceled }
    } catch (error) {
      this.appLogger.error(
        `[updateClassStatus]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`
      )
      return false
    }
  }

  async updateClassProgressEndSlot(job: Job) {
    const { slotNumber } = job.data
    this.appLogger.debug(
      `[updateClassProgressEndSlot]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`
    )

    try {
      this.appLogger.log(`[updateClassProgressEndSlot]: Start update class progress... id=${job.id}`)

      const startOfDate = moment().tz(VN_TIMEZONE).startOf('date')
      let start, end: Date
      switch (slotNumber) {
        case SlotNumber.ONE:
          start = startOfDate.clone().add(7, 'hour').toDate()
          end = startOfDate.clone().add(9, 'hour').toDate()
          break
        case SlotNumber.TWO:
          start = startOfDate.clone().add(9, 'hour').add(30, 'minute').toDate()
          end = startOfDate.clone().add(11, 'hour').add(30, 'minute').toDate()
          break
        case SlotNumber.THREE:
          start = startOfDate.clone().add(13, 'hour').toDate()
          end = startOfDate.clone().add(15, 'hour').toDate()
          break
        case SlotNumber.FOUR:
          start = startOfDate.clone().add(15, 'hour').add(30, 'minute').toDate()
          end = startOfDate.clone().add(17, 'hour').add(30, 'minute').toDate()
          break
      }

      const timesheets = await this.gardenTimesheetService.findMany({
        'slots.start': start,
        'slots.end': end
      })

      const classIds = new Set()
      for (const timesheet of timesheets) {
        for (const slot of timesheet.slots) {
          if (slot.status === SlotStatus.NOT_AVAILABLE && slot.slotNumber === slotNumber) {
            classIds.add(slot.classId)
          }
        }
      }
      const courseClasses = await this.classService.findMany({
        _id: {
          $in: [...classIds]
        }
      })

      const updateClassProgressPromises = []
      courseClasses.forEach((courseClass) => {
        const { progress } = courseClass
        const completed = progress.completed + 1 > progress.total ? progress.total : progress.completed + 1
        const total = progress.total
        const percentage = Math.round((completed / total) * 100)
        updateClassProgressPromises.push(
          this.classService.update(
            { _id: courseClass._id },
            {
              $set: { progress: { completed, total, percentage } }
            }
          )
        )
      })
      await Promise.all(updateClassProgressPromises)

      this.appLogger.log(`[updateClassProgressEndSlot]: End update class progress... id=${job.id}`)
      return { status: true, numbersOfUpdatedClass: classIds.size }
    } catch (error) {
      this.appLogger.error(
        `[updateClassProgressEndSlot]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(
          job.data
        )}, error=${error}`
      )
      return false
    }
  }

  async completeClassAutomatically(job: Job) {
    this.appLogger.debug(
      `[completeClassAutomatically]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`
    )

    try {
      this.appLogger.log(`[completeClassAutomatically]: Start complete class ... id=${job.id}`)

      const startOfDate = moment().tz(VN_TIMEZONE).startOf('date')
      const classAutoCompleteAfterDay =
        Number((await this.settingService.findByKey(SettingKey.ClassAutoCompleteAfterDay)).value) || 5

      const courseClasses = await this.classService.findMany({
        status: ClassStatus.IN_PROGRESS
      })

      const completeClassPromises = []
      courseClasses.forEach((courseClass) => {
        const { startDate, duration, weekdays } = courseClass
        const classEndTime = this.classService.getClassEndTime({ startDate, duration, weekdays })

        if (classEndTime.clone().add(classAutoCompleteAfterDay, 'day').isSameOrBefore(startOfDate)) {
          completeClassPromises.push(this.classService.completeClass(courseClass._id, { role: 'SYSTEM' as UserRole }))
        }
      })
      await Promise.all(completeClassPromises)

      this.appLogger.log(`[completeClassAutomatically]: End complete class... id=${job.id}`)
      return { status: true, numbersOfCompletedClass: completeClassPromises.length }
    } catch (error) {
      this.appLogger.error(
        `[completeClassAutomatically]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(
          job.data
        )}, error=${error}`
      )
      return false
    }
  }

  async sendClassCertificate(job: Job) {
    this.appLogger.debug(`[sendClassCertificate]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`)

    try {
      this.appLogger.log(`[sendClassCertificate]: Start complete class ... id=${job.id}`)

      const courseClasses = await this.classService.findMany(
        {
          'progress.percentage': 100,
          hasSentCertificate: { $exists: false }
        },
        ['instructorId', 'title', 'code', 'sessions'],
        [{ path: 'instructor', select: ['name'] }]
      )

      const sendClassCertificatePromises = []
      courseClasses.forEach((courseClass) => {
        sendClassCertificatePromises.push(this.generateCertificateForClass(courseClass))
      })
      await Promise.allSettled(sendClassCertificatePromises)

      this.appLogger.log(`[sendClassCertificate]: End complete class... id=${job.id}`)
      return { status: true, numbersOfHasSentCertificateClass: sendClassCertificatePromises.length }
    } catch (error) {
      this.appLogger.error(
        `[sendClassCertificate]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`
      )
      return false
    }
  }

  async generateCertificateForClass(courseClass: Class) {
    const dateMoment = moment().tz(VN_TIMEZONE).format('LL')
    const learnerClasses = await this.learnerClassService.findMany(
      { classId: courseClass._id },
      ['learnerId'],
      [{ path: 'learner', select: ['_id', 'name'] }]
    )

    const classAttendanceRate =
      Number((await this.settingService.findByKey(SettingKey.ClassAttendanceRate)).value) || 0.8
    const classAssignmentPointAverage =
      Number((await this.settingService.findByKey(SettingKey.ClassAssignmentPointAverage)).value) || 6

    // generate PDF
    const generatePDFPromises = []
    for await (const learnerClass of learnerClasses) {
      // BR-11: Learners must attend 80% of total class’s slots and get assignment average points at least 6 to receive the certificate.
      // BR-48: If the instructors forget to take attendance, it will not affect the attendance percentage required to achieve the certificate at the end of the class.
      // BR-50: After the class ends, if the instructor does not take attendance or grade any assignments, the learner will automatically get a certificate.
      const learnerId = _.get(learnerClass, 'learnerId')

      const classAssignmentCount = courseClass.sessions.filter((session) => session.assignments.length > 0).length
      const [attendances, submissions] = await Promise.all([
        this.attendanceService.findMany({
          learnerId,
          classId: courseClass._id
        }),
        this.assignmentSubmissionService.findMany({
          learnerId,
          classId: courseClass._id
        })
      ])
      const presentAttendances = attendances.filter((attendance) => attendance.status === AttendanceStatus.PRESENT)
      let totalAssignmentPoint = 0
      submissions.forEach((submission) => {
        if (submission.point) {
          totalAssignmentPoint += submission.point
        } else {
          totalAssignmentPoint += 10
        }
      })

      const isAttendanceRateEnough =
        attendances.length === 0 || presentAttendances.length / attendances.length >= classAttendanceRate
      const isAssignmentPointAvgEnough =
        classAssignmentCount === 0 || totalAssignmentPoint / classAssignmentCount >= classAssignmentPointAverage
      if (!isAttendanceRateEnough || !isAssignmentPointAvgEnough) continue

      const certificateCode = await this.certificateService.generateCertificateCode()
      const data = {
        learnerName: _.get(learnerClass, 'learner.name') || 'Learner',
        courseTitle: _.get(courseClass, 'title') || 'Course',
        dateCompleted: dateMoment,
        certificateCode,
        instructorName: _.get(courseClass, 'instructor.name') || 'Instructor'
      }
      const certificatePath = `certs/cert-${_.get(courseClass, 'code')}-${learnerId}.pdf`
      const metadata = {
        learnerId,
        code: certificateCode,
        name: _.get(courseClass, 'title'),
        learnerClassId: learnerClass._id
      }
      generatePDFPromises.push(this.helperService.generatePDF({ data, certificatePath, metadata }))
    }
    const generatePDFResponses: GeneratePDFResponse[] = (await Promise.all(generatePDFPromises)).filter(
      (res) => res.status === true
    )

    // Upload multiple to Cloudinary
    const mediaPaths = generatePDFResponses.map((res) => path.resolve(__dirname, '../../../', res.certificatePath))
    const uploadResponses: UploadApiResponse[] = await this.mediaService.uploadMultiple(mediaPaths)

    // Save certificate
    const saveCertificatePromises = []
    generatePDFResponses.forEach((res, index) => {
      const { metadata } = res
      saveCertificatePromises.push(
        this.certificateService.create({
          url: uploadResponses.at(index).url,
          ownerId: _.get(metadata, 'learnerId'),
          code: _.get(metadata, 'code'),
          name: _.get(metadata, 'name'),
          learnerClassId: _.get(metadata, 'learnerClassId')
        })
      )
    })
    await Promise.all(saveCertificatePromises)

    // update class hasSentCertificate true
    await this.classService.update(
      { _id: courseClass._id },
      {
        $set: { hasSentCertificate: true }
      }
    )

    //  send notification for learners
    this.notificationService.sendFirebaseCloudMessaging({
      title: `Congratulations on completing the course`,
      body: `Class ${courseClass.code}: ${courseClass.title} has ended. Click to view details.`,
      receiverIds: learnerClasses.map((learnerClass) => learnerClass.learnerId.toString()),
      data: {
        type: FCMNotificationDataType.CLASS,
        id: courseClass._id.toString()
      }
    })

    // unlink pdf in disk
    const unlinkMediaFilePromises = []
    mediaPaths.forEach((mediaPath) => {
      unlinkMediaFilePromises.push(
        fs.unlink(mediaPath, (err) => {
          if (err) {
            console.error(`Error removing file: ${err}`)
            return
          }
          console.log(`File ${mediaPath} has been successfully removed.`)
        })
      )
    })
    Promise.allSettled(unlinkMediaFilePromises)
  }

  async remindClassStartSlot(job: Job) {
    const { slotNumber } = job.data
    this.appLogger.debug(`[remindClassStartSlot]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`)

    try {
      this.appLogger.log(`[remindClassStartSlot]: Start remind class start slot... id=${job.id}`)

      const startOfDate = moment().tz(VN_TIMEZONE).startOf('date')
      let start, end: Date
      switch (slotNumber) {
        case SlotNumber.ONE:
          start = startOfDate.clone().add(7, 'hour').toDate()
          end = startOfDate.clone().add(9, 'hour').toDate()
          break
        case SlotNumber.TWO:
          start = startOfDate.clone().add(9, 'hour').add(30, 'minute').toDate()
          end = startOfDate.clone().add(11, 'hour').add(30, 'minute').toDate()
          break
        case SlotNumber.THREE:
          start = startOfDate.clone().add(13, 'hour').toDate()
          end = startOfDate.clone().add(15, 'hour').toDate()
          break
        case SlotNumber.FOUR:
          start = startOfDate.clone().add(15, 'hour').add(30, 'minute').toDate()
          end = startOfDate.clone().add(17, 'hour').add(30, 'minute').toDate()
          break
      }

      const timesheets = await this.gardenTimesheetService.findMany({
        'slots.start': start,
        'slots.end': end
      })

      const classIds = new Set()
      for (const timesheet of timesheets) {
        for (const slot of timesheet.slots) {
          if (slot.status === SlotStatus.NOT_AVAILABLE && slot.slotNumber === slotNumber) {
            classIds.add(slot.classId)
          }
        }
      }
      const courseClasses = await this.classService.findMany({
        _id: {
          $in: [...classIds]
        }
      })

      const remindClassSlotStartIn1HourPromises = []
      courseClasses.forEach((courseClass) => {
        remindClassSlotStartIn1HourPromises.push(this.sendClassSlotStartRemindNotificationForLearner(courseClass))
      })
      await Promise.all(remindClassSlotStartIn1HourPromises)

      this.appLogger.log(`[remindClassStartSlot]: End remind class start slot... id=${job.id}`)
      return { status: true, classIds: [...classIds] }
    } catch (error) {
      this.appLogger.error(
        `[remindClassStartSlot]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`
      )
      return false
    }
  }

  private async sendClassSlotStartRemindNotificationForLearner(courseClass: Class) {
    const learnerClasses = await this.learnerClassService.findMany({ classId: new Types.ObjectId(courseClass._id) }, [
      'learnerId'
    ])
    if (learnerClasses.length === 0) return

    await this.notificationService.sendFirebaseCloudMessaging({
      title: `Session will start in 1 hour`,
      body: `Class ${courseClass.code}: ${courseClass.title} session is about to start. Click to view details.`,
      receiverIds: learnerClasses.map((learnerClass) => learnerClass?.learnerId?.toString()),
      data: {
        type: FCMNotificationDataType.CLASS,
        id: courseClass._id.toString()
      }
    })
  }

  async remindClassStartSoon(job: Job) {
    this.appLogger.debug(`[remindClassStartSoon]: id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}`)

    try {
      this.appLogger.log(`[remindClassStartSoon]: Start remind class start soon... id=${job.id}`)
      const courseClasses = await this.classService.findManyByStatus([ClassStatus.PUBLISHED])
      if (courseClasses.length === 0) return 'No PUBLISHED status class'

      const tomorrowMoment = moment().tz(VN_TIMEZONE).startOf('date').add(1, 'day')
      const remindClassStartSoonPromises = []
      const classIds = []

      for await (const courseClass of courseClasses) {
        const startOfDate = moment(courseClass.startDate).tz(VN_TIMEZONE).startOf('date')
        if (startOfDate.isSame(tomorrowMoment)) {
          remindClassStartSoonPromises.push(this.sendClassStartSoonRemindNotification(courseClass))
          classIds.push(courseClass._id)
        }
      }
      await Promise.all(remindClassStartSoonPromises)

      this.appLogger.log(`[remindClassStartSoon]: End remind class start soon... id=${job.id}`)
      return { status: true, classIds }
    } catch (error) {
      this.appLogger.error(
        `[remindClassStartSoon]: error id=${job.id}, name=${job.name}, data=${JSON.stringify(job.data)}, error=${error}`
      )
      return false
    }
  }

  private async sendClassStartSoonRemindNotification(courseClass: Class) {
    const [learnerClasses, garden] = await Promise.all([
      this.learnerClassService.findMany({ classId: new Types.ObjectId(courseClass._id) }, ['learnerId']),
      this.gardenService.findById(courseClass.gardenId.toString())
    ])

    const receiverIds = learnerClasses.map((learnerClass) => learnerClass?.learnerId?.toString())
    receiverIds.push(courseClass.instructorId.toString())
    receiverIds.push(garden.gardenManagerId.toString())

    if (receiverIds.length === 0) return

    await this.notificationService.sendFirebaseCloudMessaging({
      title: `Class will start tomorrow`,
      body: `Class ${courseClass.code}: ${courseClass.title} will start tomorrow. Click to view details.`,
      receiverIds,
      data: {
        type: FCMNotificationDataType.CLASS,
        id: courseClass._id.toString()
      }
    })
  }
}
