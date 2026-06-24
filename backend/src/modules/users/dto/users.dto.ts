import { SetUserActiveRequest } from '../../../shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetUserActiveDto implements SetUserActiveRequest {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}
