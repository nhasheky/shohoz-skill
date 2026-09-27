import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): Record<string, string> {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): Record<string, string> {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
