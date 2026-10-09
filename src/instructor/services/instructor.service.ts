import { Injectable, Inject } from '@nestjs/common'
import { IInstructorRepository } from '@instructor/repositories/instructor.repository'
import { Instructor, InstructorDocument } from '@instructor/schemas/instructor.schema'
import { FilterQuery, QueryOptions, SaveOptions, UpdateQuery } from 'mongoose'
import { IAuthUserService } from '@auth/services/auth.service'
import { QueryInstructorDto } from '@instructor/dto/view-instructor.dto'
import { PaginationParams } from '@common/decorators/pagination.decorator'
import { INSTRUCTOR_LIST_PROJECTION } from '@instructor/contracts/constant'
import { InstructorStatus } from '@common/contracts/constant'
import { CreateInstructorDto } from '@instructor/dto/create-instructor.dto'
import { HelperService } from '@common/services/helper.service'
import { INotificationService } from '@notification/services/notification.service'

export const IInstructorService = Symbol('IInstructorService')

export interface IInstructorService extends IAuthUserService {
  create(createInstructorDto: CreateInstructorDto, options?: SaveOptions | undefined): Promise<InstructorDocument>
  findById(instructorId: string, projection?: string | Record<string, any>): Promise<InstructorDocument>
  findByEmail(email: string, projection?: string | Record<string, any>): Promise<InstructorDocument>
  update(
    conditions: FilterQuery<Instructor>,
    payload: UpdateQuery<Instructor>,
    options?: QueryOptions | undefined
  ): Promise<InstructorDocument>
  list(pagination: PaginationParams, queryLearnerDto: QueryInstructorDto)
}

@Injectable()
export class InstructorService implements IInstructorService {
  constructor(
    private readonly helperService: HelperService,
    @Inject(IInstructorRepository)
    private readonly instructorRepository: IInstructorRepository,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
  ) {}

  public async create(createInstructorDto: CreateInstructorDto, options?: SaveOptions | undefined) {
    const password = this.helperService.generateRandomString(10, 'abcdefghijklmnopqrstuvwxyz0123456789')
    const hashPassword = await this.helperService.hashPassword(password)
    createInstructorDto['password'] = hashPassword
    const instructor = await this.instructorRepository.create(createInstructorDto, options)

    this.notificationService.sendMail({
      to: instructor.email,
      subject: `[Orchidify] Login Credentials`,
      template: 'instructor/add-instructor',
      context: {
        email: instructor.email,
        name: instructor.name,
        password
      }
    })
    return instructor
  }

  public async findById(instructorId: string, projection?: string | Record<string, any>) {
    const instructor = await this.instructorRepository.findOne({
      conditions: {
        _id: instructorId
      },
      projection
    })
    return instructor
  }

  public async findByEmail(email: string, projection?: string | Record<string, any>) {
    const instructor = await this.instructorRepository.findOne({
      conditions: {
        email
      },
      projection
    })
    return instructor
  }

  public update(
    conditions: FilterQuery<Instructor>,
    payload: UpdateQuery<Instructor>,
    options?: QueryOptions | undefined
  ) {
    return this.instructorRepository.findOneAndUpdate(conditions, payload, options)
  }

  async list(
    pagination: PaginationParams,
    queryLearnerDto: QueryInstructorDto,
    projection = INSTRUCTOR_LIST_PROJECTION
  ) {
    const { name, email, status } = queryLearnerDto
    const filter: Record<string, any> = {}

    const validStatus = status?.filter((status) => [InstructorStatus.ACTIVE, InstructorStatus.INACTIVE].includes(status))
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

    return this.instructorRepository.model.paginate(filter, {
      ...pagination,
      projection
    })
  }
}
