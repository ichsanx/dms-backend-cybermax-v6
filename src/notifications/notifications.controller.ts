import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notif: NotificationsService) {}

  // alias: GET /notifications  ✅
  @Get()
  async list(@Req() req: any) {
    return this.notif.my(req.user.sub);
  }

  // tetap support: GET /notifications/me ✅
  @Get('me')
  async me(@Req() req: any) {
    return this.notif.my(req.user.sub);
  }

  @Post(':id/read')
  async read(@Req() req: any, @Param('id') id: string) {
    return this.notif.markRead(req.user.sub, id);
  }
}
