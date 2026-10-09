import { Injectable, Inject } from '@nestjs/common'
import { IGardenManagerRepository } from '@garden-manager/repositories/garden-manager.repository'
import { GardenManager, GardenManagerDocument } from '@garden-manager/schemas/garden-manager.schema'
import { FilterQuery, PopulateOptions, QueryOptions, SaveOptions, Types, UpdateQuery } from 'mongoose'
import { IAuthUserService } from '@auth/services/auth.service'
import { CreateGardenManagerDto } from '@garden-manager/dto/create-garden-manager.dto'
import { QueryGardenManagerDto } from '@garden-manager/dto/view-garden-manager.dto'
import { PaginationParams } from '@common/decorators/pagination.decorator'
import { GARDEN_MANAGER_LIST_PROJECTION } from '@garden-manager/contracts/constant'
import { GardenManagerStatus } from '@common/contracts/constant'
import { HelperService } from '@common/services/helper.service'
import { INotificationService } from '@notification/services/notification.service'

export const IGardenManagerService = Symbol('IGardenManagerService')

export interface IGardenManagerService extends IAuthUserService {
  create(gardenManager: CreateGardenManagerDto, options?: SaveOptions | undefined): Promise<GardenManagerDocument>
  findById(
    gardenManagerId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ): Promise<GardenManagerDocument>
  findByEmail(email: string, projection?: string | Record<string, any>): Promise<GardenManagerDocument>
  update(
    conditions: FilterQuery<GardenManager>,
    payload: UpdateQuery<GardenManager>,
    options?: QueryOptions | undefined
  ): Promise<GardenManagerDocument>
  list(pagination: PaginationParams, queryGardenManagerDto: QueryGardenManagerDto)
}

@Injectable()
export class GardenManagerService implements IGardenManagerService {
  constructor(
    private readonly helperService: HelperService,
    @Inject(IGardenManagerRepository)
    private readonly gardenManagerRepository: IGardenManagerRepository,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
  ) {}

  public async create(createGardenManagerDto: CreateGardenManagerDto, options?: SaveOptions | undefined) {
    const password = this.helperService.generateRandomString(10, 'abcdefghijklmnopqrstuvwxyz0123456789')
    const hashPassword = await this.helperService.hashPassword(password)
    createGardenManagerDto['password'] = hashPassword
    const gardenManager = await this.gardenManagerRepository.create(createGardenManagerDto, options)

    this.notificationService.sendMail({
      to: gardenManager.email,
      subject: `[Orchidify] Login Credentials`,
      template: 'management/add-garden-manager',
      context: {
        email: gardenManager.email,
        name: gardenManager.name,
        password
      }
    })
    return gardenManager
  }

  public async findById(
    gardenManagerId: string,
    projection?: string | Record<string, any>,
    populates?: Array<PopulateOptions>
  ) {
    const gardenManager = await this.gardenManagerRepository.findOne({
      conditions: {
        _id: gardenManagerId
      },
      projection,
      populates
    })
    return gardenManager
  }

  public async findByEmail(email: string, projection?: string | Record<string, any>) {
    const gardenManager = await this.gardenManagerRepository.findOne({
      conditions: {
        email
      },
      projection
    })
    return gardenManager
  }

  public update(
    conditions: FilterQuery<GardenManager>,
    payload: UpdateQuery<GardenManager>,
    options?: QueryOptions | undefined
  ) {
    return this.gardenManagerRepository.findOneAndUpdate(conditions, payload, options)
  }

  async list(
    pagination: PaginationParams,
    queryGardenManagerDto: QueryGardenManagerDto,
    projection = GARDEN_MANAGER_LIST_PROJECTION
  ) {
    const { name, email, status } = queryGardenManagerDto
    const filter: Record<string, any> = {}

    const validStatus = status?.filter((status) =>
      [GardenManagerStatus.ACTIVE, GardenManagerStatus.INACTIVE].includes(status)
    )
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

    return this.gardenManagerRepository.model.paginate(filter, {
      ...pagination,
      projection
    })
  }
}
