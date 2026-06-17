import {
  CreateRecruitmentRequest,
  JobLevel,
  RecruitmentStatus,
  RemoteType,
  UpdateRecruitmentRequest,
} from '../../../shared';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateRecruitmentDto implements CreateRecruitmentRequest {
  @ApiProperty() @IsString() company!: string;
  @ApiProperty() @IsString() position!: string;
  @ApiProperty({ enum: JobLevel }) @IsEnum(JobLevel) level!: JobLevel;
  @ApiProperty({ enum: RemoteType }) @IsEnum(RemoteType) workMode!: RemoteType;

  @ApiPropertyOptional() @IsOptional() @IsInt() salaryMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() salaryMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() appliedAt?: string;

  @ApiPropertyOptional({ enum: RecruitmentStatus })
  @IsOptional()
  @IsEnum(RecruitmentStatus)
  status?: RecruitmentStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() jobOfferId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateRecruitmentDto
  extends PartialType(CreateRecruitmentDto)
  implements UpdateRecruitmentRequest
{
  @ApiPropertyOptional({ enum: RecruitmentStatus })
  @IsOptional()
  @IsEnum(RecruitmentStatus)
  status?: RecruitmentStatus;
}
