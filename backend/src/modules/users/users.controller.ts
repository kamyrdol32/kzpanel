import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminUserDto, Role } from '../../shared';

import { SetUserActiveDto } from './dto/users.dto';
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

  private toDto(user: User): AdminUserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
