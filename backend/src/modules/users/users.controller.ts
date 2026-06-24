import { Body, Controller, Delete, Get, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminUserDto, JwtPayload, Role } from '../../shared';

import { SetUserActiveDto, SetUserRoleDto } from './dto/users.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async findAll(): Promise<AdminUserDto[]> {
    const rows = await this.users.listAll();
    return rows.map((u) => this.toDto(u));
  }

  @Patch(':id/active')
  async setActive(
    @Param('id') id: string,
    @Body() dto: SetUserActiveDto,
  ): Promise<AdminUserDto> {
    const user = await this.users.setActive(id, dto.isActive);
    return this.toDto(user);
  }

  @Patch(':id/role')
  async setRole(
    @Param('id') id: string,
    @Body() dto: SetUserRoleDto,
  ): Promise<AdminUserDto> {
    const user = await this.users.update(id, { role: dto.role });
    return this.toDto(user);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id') id: string,
    @CurrentUser() caller: JwtPayload,
  ): Promise<void> {
    await this.users.remove(id, caller.sub);
  }

  private toDto(user: User): AdminUserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    };
  }
}
