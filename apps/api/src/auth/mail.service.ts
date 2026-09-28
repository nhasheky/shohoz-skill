import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendOtp(to: string, code: string, userName?: string): Promise<boolean> {
    try {
      const emailApiUrl = 'https://shohozskill.com.bd/api/send-email';
      const res = await fetch(emailApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          code,
          userName,
          secret: 'shohoz_email_secret_2026',
        }),
      });

      if (!res.ok) {
        throw new Error(`Email API returned ${res.status}`);
      }

      this.logger.log(`OTP email sent to ${to} via Vercel API`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${to}:`, err);
      return false;
    }
  }
}
