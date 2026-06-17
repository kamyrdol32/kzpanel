import {
  CreateScrapeTargetRequest,
  JobSource,
  RemoteType,
  UpdateScrapeTargetRequest,
} from '../../../shared';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateScrapeTargetDto implements CreateScrapeTargetRequest {
  @ApiProperty({ enum: JobSource })
  @IsEnum(JobSource)
  source!: JobSource;

  @ApiProperty({ example: 'Angular' })
  @IsString()
  @MaxLength(120)
  query!: string;

  @ApiPropertyOptional({ example: 'Warszawa' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: RemoteType })
  @IsOptional()
  @IsEnum(RemoteType)
  remoteType?: RemoteType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateScrapeTargetDto
  extends PartialType(CreateScrapeTargetDto)
  implements UpdateScrapeTargetRequest {}
