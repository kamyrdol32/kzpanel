import { Permission, SetUserActiveRequest, SetUserPermissionsRequest, SetUserRoleRequest } from '../../../shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum } from 'class-validator';
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

export class SetUserPermissionsDto implements SetUserPermissionsRequest {
  @ApiProperty({ enum: Permission, isArray: true })
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions!: Permission[];
}
