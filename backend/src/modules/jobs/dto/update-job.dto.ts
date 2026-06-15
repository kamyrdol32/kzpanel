import { UpdateJobRequest } from '@evpanel/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateJobDto implements UpdateJobRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dismissed?: boolean;
}
