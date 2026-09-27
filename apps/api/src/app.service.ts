import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): Record<string, string> {
    return { name: 'Shohoz Skill API', tagline: 'Learn to Earn', status: 'running' };
  }
}
