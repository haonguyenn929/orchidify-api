import { IAuthUserService } from '@auth/services/auth.service'
import { StaffStatus, UserRole } from '@common/contracts/constant'
import { Errors } from '@common/contracts/error'
import { PaginationParams } from '@common/decorators/pagination.decorator'
import { AppException } from '@common/exceptions/app.exception'
import { HelperService } from '@common/services/helper.service'
import { Injectable, Inject } from '@nestjs/common'
import { INotificationService } from '@notification/services/notification.service'
import { ReportTag, ReportType } from '@report/contracts/constant'
import { IReportService } from '@report/services/report.service'
import { STAFF_LIST_PROJECTION } from '@staff/contracts/constant'
import { CreateStaffDto } from '@staff/dto/create-staff.dto'
import { QueryStaffDto } from '@staff/dto/view-staff.dto'
import { IStaffRepository } from '@staff/repositories/staff.repository'
import { Staff, StaffDocument } from '@staff/schemas/staff.schema'
import { FilterQuery, PopulateOptions, QueryOptions, SaveOptions, UpdateQuery } from 'mongoose'

export const IStaffService = Symbol('IStaffService')

export interface IStaffService extends IAuthUserService {
  create(createStaffDto: CreateStaffDto, options?: SaveOptions | undefined): Promise<StaffDocument>
  findById(
    staffId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<StaffDocument>
  findByEmail(email: string, projection?: string | Record<string, any>): Promise<StaffDocument>
  update(
    conditions: FilterQuery<Staff>,
    payload: UpdateQuery<Staff>,
    options?: QueryOptions | undefined
  ): Promise<StaffDocument>
  list(pagination: PaginationParams, queryStaffDto: QueryStaffDto)
  findMany(
    conditions: FilterQuery<StaffDocument>,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<StaffDocument[]>
}

@Injectable()
export class StaffService implements IStaffService {
  constructor(
    private readonly helperService: HelperService,
    @Inject(IStaffRepository)
    private readonly staffRepository: IStaffRepository,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
    @Inject(IReportService)
    private readonly reportService: IReportService
  ) {}

  public async create(createStaffDto: CreateStaffDto, options?: SaveOptions | undefined) {
    const password = this.helperService.generateRandomString(10, 'abcdefghijklmnopqrstuvwxyz0123456789')
    const hashPassword = await this.helperService.hashPassword(password)
    createStaffDto['password'] = hashPassword

    const staffCode = await this.generateStaffCode()

    createStaffDto['staffCode'] = staffCode
    const staff = await this.staffRepository.create(createStaffDto, options)

    this.notificationService.sendMail({
      to: staff.email,
      subject: `[Orchidify] Login Credentials`,
      template: 'management/add-staff',
      context: {
        email: staff.email,
        name: staff.name,
        password
      }
    })

    // update staff report
    this.reportService.update(
      { type: ReportType.StaffSum, tag: ReportTag.System },
      {
        $inc: {
          'data.quantity': 1,
          [`data.${StaffStatus.ACTIVE}.quantity`]: 1
        }
      }
    )
    return staff
  }

  public async findById(
    staffId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const staff = await this.staffRepository.findOne({
      conditions: {
        _id: staffId
      },
      projection,
      populates
    })
    return staff
  }

  public async findByEmail(email: string, projection?: string | Record<string, any>) {
    const staff = await this.staffRepository.findOne({
      conditions: {
        email
      },
      projection
    })
    return staff
  }

  public update(
    conditions: FilterQuery<Staff>,
    payload: UpdateQuery<StaffDocument>,
    options?: QueryOptions | undefined
  ) {
    return this.staffRepository.findOneAndUpdate(conditions, payload, options)
  }

  async list(pagination: PaginationParams, QueryStaffDto: QueryStaffDto, projection = STAFF_LIST_PROJECTION) {
    const { name, email, status } = QueryStaffDto
    const filter: Record<string, any> = {
      role: UserRole.STAFF
    }

    const validStatus = status?.filter((status) => [StaffStatus.ACTIVE, StaffStatus.INACTIVE].includes(status))
    if (validStatus?.length > 0) {
      filter['status'] = {
        $in: validStatus
      }
    }

    let textSearch = ''
    if (name) textSearch += name.trim()
    if (email) textSearch += ' ' + email.trim()
    if (textSearch) {
      filter['$text'] = {
        $search: textSearch.trim()
      }
    }

    return this.staffRepository.model.paginate(filter, {
      ...pagination,
      projection
    })
  }

  public async findMany(
    conditions: FilterQuery<StaffDocument>,
    projection?: Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const staffs = await this.staffRepository.findMany({
      conditions,
      projection,
      populates
    })
    return staffs
  }

  private async generateStaffCode(length = 6, startTime = Date.now()) {
    const staffCode = 'OCP' + this.helperService.generateRandomString(length)
    const staff = await this.staffRepository.findOne({
      conditions: {
        staffCode
      }
    })

    const elapsedTime = Date.now() - startTime
    if (!staff) return staffCode
    const isRetry = elapsedTime < 60 * 1000
    if (isRetry) return await this.generateStaffCode(length, startTime)
    throw new AppException(Errors.INTERNAL_SERVER_ERROR)
  }
}
