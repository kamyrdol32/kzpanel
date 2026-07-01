import { CreateScrapeScheduleRequest, RecurrenceType, UpdateScrapeScheduleRequest } from '../../../shared';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class CreateScrapeScheduleDto implements CreateScrapeScheduleRequest {
  @ApiProperty({ enum: RecurrenceType })
  @IsEnum(RecurrenceType)
  public recurrenceType!: RecurrenceType;

  @ApiProperty({ example: '08:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  public time!: string;

  @ApiPropertyOptional({ type: [Number], example: [1, 3, 5] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  public daysOfWeek?: number[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  public dayOfMonth?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;
}

export class UpdateScrapeScheduleDto
  extends PartialType(CreateScrapeScheduleDto)
  implements UpdateScrapeScheduleRequest {}
