import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApprovalsService } from './approvals.service';

@Controller('approvals')
@UseGuards(AuthGuard('jwt'))
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  // GET /approvals/requests  (admin only - dicek di service)
  @Get('requests')
  async listPending(@Req() req: any) {
    return this.approvals.listPending(req.user);
  }

  // POST /approvals/requests/:id/approve
  // NOTE: replaceFileUrl sudah diambil dari DB (PermissionRequest.replaceFileUrl)
  // jadi body tidak wajib. Kalau ada body dari versi lama, kita abaikan.
  @Post('requests/:id/approve')
  async approve(
    @Req() req: any,
    @Param('id') id: string,
    @Body() _body?: any,
  ) {
    return this.approvals.approve(req.user, id);
  }

  // POST /approvals/requests/:id/reject
  @Post('requests/:id/reject')
  async reject(@Req() req: any, @Param('id') id: string) {
    return this.approvals.reject(req.user, id);
  }
}
