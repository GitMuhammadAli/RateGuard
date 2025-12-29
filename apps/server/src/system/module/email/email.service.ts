import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('email.from') || 'RateGuard <noreply@rateguard.io>';
    this.appUrl = this.configService.get<string>('app.url') || 'http://localhost:3001';
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    const emailHost = this.configService.get<string>('email.host');
    const emailUser = this.configService.get<string>('email.user');

    if (!emailHost || !emailUser) {
      this.logger.log('Email credentials not configured - using Ethereal test account');
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(`📧 Test email account: ${testAccount.user}`);
    } else {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: this.configService.get<number>('email.port') || 587,
        secure: this.configService.get<boolean>('email.secure') || false,
        auth: {
          user: emailUser,
          pass: this.configService.get<string>('email.password'),
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`📧 Preview URL: ${previewUrl}`);
      }

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.appUrl}/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify your RateGuard account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to RateGuard, ${name}!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Reset your RateGuard password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy and paste this link:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p>This link expires in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email or contact support.</p>
        </div>
      `,
    });
  }

  async sendPasswordChangedEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Your RateGuard password was changed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Changed Successfully</h2>
          <p>Hi ${name},</p>
          <p>Your password was successfully changed on ${new Date().toLocaleDateString()}.</p>
          <p>All other sessions have been logged out for security.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">If you didn't make this change, please contact support immediately.</p>
        </div>
      `,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

