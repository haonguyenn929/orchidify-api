import { Controller, Get, UseGuards, Inject, Query, Req, Put, Body, Param } from '@nestjs/common'
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import * as _ from 'lodash'
import { ErrorResponse, SuccessDataResponse, SuccessResponse } from '@common/contracts/dto'
import { Roles } from '@auth/decorators/roles.decorator'
import { GardenStatus, GardenTimesheetStatus, TimesheetType, UserRole } from '@common/contracts/constant'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { IGardenTimesheetService } from '@garden-timesheet/services/garden-timesheet.service'
import {
  QueryGardenTimesheetDto,
  ViewGardenTimesheetListDataResponse
} from '@garden-timesheet/dto/view-garden-timesheet.dto'
import { IGardenService } from '@garden/services/garden.service'
import { AppException } from '@common/exceptions/app.exception'
import { Errors } from '@common/contracts/error'
import { ApiErrorResponse } from '@common/decorators/api-response.decorator'
import {
  QueryInstructorTimesheetDto,
  ViewTeachingTimesheetListDataResponse
} from '@garden-timesheet/dto/view-teaching-timesheet.dto'
import { UpdateGardenTimesheetDto } from '@garden-timesheet/dto/update-garden-timesheet.dto'
import { Types } from 'mongoose'
import { INotificationService } from '@notification/services/notification.service'
import { FCMNotificationDataType } from '@notification/contracts/constant'
import {
  QuerySlotByGardenIdsDto,
  QueryInactiveTimesheetByGardenDto,
  ViewSlotListDataResponse
} from '@garden-timesheet/dto/garden-manager-view-timesheet.dto'
import { ViewSlotDto } from '@garden-timesheet/dto/slot.dto'

@ApiTags('GardenTimesheet - Management')
@ApiBearerAuth()
@ApiBadRequestResponse({ type: ErrorResponse })
@UseGuards(JwtAuthGuard.ACCESS_TOKEN, RolesGuard)
@Controller('management')
export class ManagementGardenTimesheetController {
  constructor(
    @Inject(IGardenTimesheetService)
    private readonly gardenTimesheetService: IGardenTimesheetService,
    @Inject(IGardenService)
    private readonly gardenService: IGardenService,
    @Inject(INotificationService)
    private readonly notificationService: INotificationService
  ) {}

  @ApiOperation({
    summary: `[${UserRole.STAFF}][${UserRole.GARDEN_MANAGER}] View GardenTimesheet List`
  })
  @ApiOkResponse({ type: ViewGardenTimesheetListDataResponse })
  @ApiErrorResponse([Errors.GARDEN_NOT_FOUND, Errors.GARDEN_INACTIVE])
  @Roles(UserRole.STAFF, UserRole.GARDEN_MANAGER)
  @Get()
  async viewGardenTimesheet(@Req() req, @Query() queryGardenTimesheetDto: QueryGardenTimesheetDto) {
    const { _id, role } = _.get(req, 'user')
    const garden = await this.gardenService.findById(queryGardenTimesheetDto.gardenId)
    if (!garden || (role === UserRole.GARDEN_MANAGER && garden?.gardenManagerId?.toString() !== _id))
      throw new AppException(Errors.GARDEN_NOT_FOUND)
    if (garden.status === GardenStatus.INACTIVE) throw new AppException(Errors.GARDEN_INACTIVE)

    const docs = await this.gardenTimesheetService.viewGardenTimesheetList(queryGardenTimesheetDto, garden)
    return { docs }
  }

  @ApiOperation({
    summary: `View Instructor Timesheet List`
  })
  @ApiOkResponse({ type: ViewTeachingTimesheetListDataResponse })
  @Roles(UserRole.STAFF)
  @Get('instructor-timesheet')
  async viewInstructorTimesheet(@Query() queryTeachingTimesheetDto: QueryInstructorTimesheetDto) {
    const docs = await this.gardenTimesheetService.viewTeachingTimesheet(queryTeachingTimesheetDto)
    return { docs }
  }

  @ApiOperation({
    summary: `[${UserRole.STAFF}] Update Garden Timesheet`
  })
  @ApiOkResponse({ type: SuccessDataResponse })
  @ApiErrorResponse([Errors.GARDEN_TIMESHEET_NOT_FOUND, Errors.CAN_NOT_UPDATE_GARDEN_TIMESHEET])
  @Roles(UserRole.STAFF)
  @Put()
  async updateGardenTimesheet(@Body() updateGardenTimesheetDto: UpdateGardenTimesheetDto) {
    const { date, gardenId, status } = updateGardenTimesheetDto

    const gardenTimesheet = await this.gardenTimesheetService.findOneBy({
      date: date,
      gardenId: new Types.ObjectId(gardenId)
    })
    if (!gardenTimesheet) throw new AppException(Errors.GARDEN_TIMESHEET_NOT_FOUND)

    // BR-27: Garden timesheet is not allowed to update the time that there is a course already scheduled.
    if (gardenTimesheet.slots.length > 0 && status === GardenTimesheetStatus.INACTIVE)
      throw new AppException(Errors.CAN_NOT_UPDATE_GARDEN_TIMESHEET)

    await this.gardenTimesheetService.update(
      { _id: gardenTimesheet._id },
      {
        $set: { status }
      }
    )

    // Send notification to garden manager
    const garden = await this.gardenService.findById(gardenId.toString())
    this.notificationService.sendFirebaseCloudMessaging({
      title: `Garden schedule for ${garden.name} has been updated`,
      body: `Garden schedule for ${garden.name} has been updated. Click to view details.`,
      receiverIds: [garden.gardenManagerId.toString()],
      data: {
        type: FCMNotificationDataType.GARDEN_TIMESHEET,
        id: gardenTimesheet._id,
        date: date?.toString(),
        gardenId: gardenId.toString()
      }
    })

    return new SuccessResponse(true)
  }

  @ApiOperation({
    summary: `[${UserRole.GARDEN_MANAGER}] View Slot List`
  })
  @ApiOkResponse({ type: ViewSlotListDataResponse })
  @Roles(UserRole.GARDEN_MANAGER)
  @Get('garden-manager/slots')
  async gardenManagerViewSlotList(@Req() req, @Query() querySlotByGardenIdsDto: QuerySlotByGardenIdsDto) {
    const { _id } = _.get(req, 'user')
    const gardens = await this.gardenService.findManyByGardenManagerId(_id)
    const gardenIds = gardens.map((garden) => garden._id)
    querySlotByGardenIdsDto.type = TimesheetType.DAY
    querySlotByGardenIdsDto.gardenIds = gardenIds

    const docs = await this.gardenTimesheetService.viewSlotsByGardenIds(querySlotByGardenIdsDto)
    return { docs }
  }

  @ApiOperation({
    summary: `[${UserRole.GARDEN_MANAGER}] View Inactive timesheet List`
  })
  @ApiOkResponse({ type: ViewGardenTimesheetListDataResponse })
  @Roles(UserRole.GARDEN_MANAGER)
  @Get('garden-manager/inactive-timesheets')
  async gardenManagerViewUnavailableTimesheet(
    @Req() req,
    @Query() queryInactiveTimesheetByGardenDto: QueryInactiveTimesheetByGardenDto
  ) {
    const { _id } = _.get(req, 'user')
    const garden = await this.gardenService.findById(queryInactiveTimesheetByGardenDto.gardenId)
    if (!garden || garden?.gardenManagerId?.toString() !== _id) return { docs: [] }

    const docs = await this.gardenTimesheetService.viewInactiveTimesheetByGarden(queryInactiveTimesheetByGardenDto)
    return { docs }
  }

  @ApiOperation({
    summary: `[${UserRole.GARDEN_MANAGER}] View Slot Detail`
  })
  @ApiOkResponse({ type: ViewSlotDto })
  @ApiErrorResponse([Errors.SLOT_NOT_FOUND])
  @Roles(UserRole.GARDEN_MANAGER)
  @Get('garden-manager/slots/:slotId([0-9a-f]{24})')
  async gardenManagerViewSlotDetail(@Req() req, @Param('slotId') slotId: string) {
    const { _id } = _.get(req, 'user')
    const gardens = await this.gardenService.findManyByGardenManagerId(_id)
    const gardenIds = gardens.map((garden) => garden._id.toString())
    const slot = await this.gardenTimesheetService.findSlotBy({ slotId, gardenIds })

    if (!slot) throw new AppException(Errors.SLOT_NOT_FOUND)
    return slot
  }
}
