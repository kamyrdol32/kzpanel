import { CreateProjectRequest, ProjectStatus, UpdateProjectRequest } from '@evpanel/shared';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateProjectDto implements CreateProjectRequest {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  liveUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  technologies?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  healthEndpoint?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) implements UpdateProjectRequest {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
