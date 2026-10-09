import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ClassStatus, SlotNumber, Weekday } from '@common/contracts/constant'
import { Transform, Type } from 'class-transformer'
import { BaseMediaDto } from '@media/dto/base-media.dto'
import { ClassStatusHistory } from '@src/class/schemas/class.schema'
import { CourseLevel } from '@src/common/contracts/constant'
import { BaseSessionDto } from './session.dto'
import { BaseProgressDto } from './progress.dto'
import { BaseRatingSummaryDto } from './rating-summary.dto'
import { MAX_PRICE, MIN_PRICE } from '@src/config'

export class BaseClassDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  _id: string

  @ApiProperty({ type: String })
  code: string

  @ApiProperty({ type: String, example: 'Class title' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  title: string

  @ApiProperty({ type: String, example: 'Class description' })
  @IsString()
  @MaxLength(500)
  description: string

  @ApiProperty({ type: Date, example: '2024-12-12' })
  @IsDateString()
  startDate: Date

  @ApiProperty({ type: Number, example: 500_000 })
  @IsInt()
  @Min(MIN_PRICE)
  @Max(MAX_PRICE)
  price: number

  @ApiProperty({ type: String, enum: CourseLevel })
  @IsEnum(CourseLevel)
  level: CourseLevel

  @ApiProperty({ type: [String], example: ['Propagation'] })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  type: string[]

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  duration: number

  @ApiProperty({
    type: String,
    example: 'https://res.cloudinary.com/orchidify/image/upload/v1726377866/hcgbmek4qa8kksw2zrcg.jpg'
  })
  @IsUrl()
  thumbnail: string

  @ApiProperty({ type: BaseMediaDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => BaseMediaDto)
  @ValidateNested({ each: true })
  media: BaseMediaDto[]

  @ApiProperty({ type: BaseSessionDto, isArray: true })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(24)
  @Type(() => BaseSessionDto)
  @ValidateNested({ each: true })
  sessions: BaseSessionDto[]

  @ApiProperty({ type: String, enum: ClassStatus })
  @IsEnum(ClassStatus)
  status: ClassStatus

  @ApiProperty({ type: ClassStatusHistory, isArray: true })
  histories: ClassStatusHistory[]

  @ApiProperty({ type: Number, example: 20 })
  @IsInt()
  @Min(10)
  @Max(30)
  learnerLimit: number

  @ApiProperty({ type: Number })
  learnerQuantity: number

  @ApiProperty({ enum: Weekday, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @Transform(({ value }) => (Array.isArray(value) ? [...new Set(value)] : Array(value)))
  weekdays: Weekday[]

  @ApiProperty({ enum: SlotNumber, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @Transform(({ value }) => (Array.isArray(value) ? [...new Set(value)].map(Number) : Array(value).map(Number)))
  slotNumbers: SlotNumber[]

  @ApiPropertyOptional({ type: Number })
  rate: number

  @ApiPropertyOptional({ type: String })
  cancelReason: string

  @ApiProperty({ type: String, example: 'Course Garden Required Toolkits' })
  @IsString()
  @MaxLength(500)
  gardenRequiredToolkits: string

  @ApiProperty({ type: String })
  instructorId: string

  @ApiProperty({ type: String })
  @IsMongoId()
  gardenId: string

  @ApiProperty({ type: String })
  courseId: string

  @ApiProperty({ type: BaseProgressDto })
  progress: BaseProgressDto

  @ApiPropertyOptional({ type: BaseRatingSummaryDto })
  ratingSummary: BaseRatingSummaryDto

  @ApiProperty({ type: Date })
  createdAt: Date

  @ApiProperty({ type: Date })
  updatedAt: Date
}
