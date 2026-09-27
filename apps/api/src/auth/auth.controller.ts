import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const ua = req.headers['user-agent'] ?? '';
    const device: { deviceName?: string; browser?: string; os?: string; ip?: string } = {};
    if (dto.deviceName) {
      device.deviceName = dto.deviceName;
      device.browser = ua.split(')')[1]?.split('(')[0]?.trim().slice(0, 40) ?? ua.slice(0, 40);
      device.os = ua.split('(')[1]?.split(';')[0]?.trim() ?? 'unknown';
      device.ip = req.ip;
    }
    return this.auth.verifyOtp(dto, device);
  }

  @Post('admin-login')
  adminLogin(@Body() body: { email: string; password?: string }) {
    return this.auth.adminLogin(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('sessions')
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  listSessions(@Req() req: Request & { user: { sub: string } }) {
    return this.auth.listSessions(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('sessions/:id')
  @Roles('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'TEACHER')
  revokeSession(@Req() req: Request & { user: { sub: string } }, @Param('id') id: string) {
    if (!id) throw new BadRequestException('Missing session id.');
    return this.auth.revokeSession(req.user.sub, id);
  }
}
