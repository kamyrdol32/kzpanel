import { SetUserActiveRequest, SetUserRoleRequest } from '../../../shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { Role } from '../../../shared';

export class SetUserActiveDto implements SetUserActiveRequest {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

export class SetUserRoleDto implements SetUserRoleRequest {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role!: Role;
}
