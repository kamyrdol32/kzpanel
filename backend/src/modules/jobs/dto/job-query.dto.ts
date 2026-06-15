import { JobFilter, JobLevel, JobSource, Language, RemoteType } from '@evpanel/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class JobQueryDto implements JobFilter {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: JobSource })
  @IsOptional()
  @IsEnum(JobSource)
  source?: JobSource;

  @ApiPropertyOptional({ enum: JobLevel })
  @IsOptional()
  @IsEnum(JobLevel)
  level?: JobLevel;

  @ApiPropertyOptional({ enum: RemoteType })
  @IsOptional()
  @IsEnum(RemoteType)
  remoteType?: RemoteType;

  @ApiPropertyOptional({ enum: Language })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
