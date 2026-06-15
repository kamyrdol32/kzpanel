import { JwtPayload } from '@evpanel/shared';
import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get() list(@CurrentUser() user: JwtPayload) {
    return this.notifications.findForUser(user.sub);
  }

  @Get('unread-count') unread(@CurrentUser() user: JwtPayload) {
    return this.notifications.countUnread(user.sub);
  }

  @Patch(':id/read') markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }
}
