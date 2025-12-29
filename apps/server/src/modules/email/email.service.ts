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
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    // Create transporter based on environment
    const isProduction = this.configService.get('app.nodeEnv') === 'production';

    if (isProduction) {
      // Production: Use real SMTP (SendGrid, AWS SES, etc.)
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('email.host'),
        port: this.configService.get('email.port'),
        secure: true,
        auth: {
          user: this.configService.get('email.user'),
          pass: this.configService.get('email.password'),
        },
      });
    } else {
      // Development: Use Ethereal (fake SMTP for testing)
      // Emails are captured and viewable at https://ethereal.email
      this.createEtherealTransporter();
    }
  }

  private async createEtherealTransporter() {
    try {
      // Create a test account on Ethereal
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

      this.logger.log(`📧 Ethereal email account created: ${testAccount.user}`);
      this.logger.log(`📧 View sent emails at: https://ethereal.email`);
    } catch (error) {
      this.logger.warn('Failed to create Ethereal account, using console logging');
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const from = this.configService.get('email.from') || 'RateGuard <noreply@rateguard.io>';

    try {
      if (!this.transporter) {
        // Fallback: Just log the email (useful for development)
        this.logger.log('═══════════════════════════════════════════════════════════');
        this.logger.log(`📧 EMAIL WOULD BE SENT:`);
        this.logger.log(`   To: ${options.to}`);
        this.logger.log(`   Subject: ${options.subject}`);
        this.logger.log(`   Body: ${options.text || 'See HTML'}`);
        this.logger.log('═══════════════════════════════════════════════════════════');
        return true;
      }

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`📧 Email sent: ${info.messageId}`);

      // For Ethereal, log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`📧 Preview URL: ${previewUrl}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  // ========================================
  // Email Templates
  // ========================================

  async sendVerificationEmail(email: string, fullName: string, token: string): Promise<boolean> {
    const verifyUrl = `${this.configService.get('app.frontendUrl')}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #00d4aa, #7c3aed); border-radius: 12px; margin: 0 auto 20px; }
          .content { background: #12121a; border-radius: 16px; padding: 40px; border: 1px solid #1e1e2e; }
          .button { display: inline-block; background: linear-gradient(135deg, #00d4aa, #00b894); color: #0a0a0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
          .code { background: #1e1e2e; padding: 12px 20px; border-radius: 8px; font-family: monospace; font-size: 18px; letter-spacing: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo"></div>
            <h1 style="margin: 0; color: #00d4aa;">RateGuard</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${fullName}! 🎉</h2>
            <p>Thanks for signing up for RateGuard. Please verify your email address to get started.</p>
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verify Email Address</a>
            </p>
            <p style="color: #888; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
            <p style="color: #888; font-size: 14px;">This link expires in 24 hours.</p>
          </div>
          <div class="footer">
            <p>© 2024 RateGuard. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Verify your RateGuard email',
      html,
      text: `Welcome ${fullName}! Verify your email: ${verifyUrl}`,
    });
  }

  async sendPasswordResetEmail(email: string, fullName: string, token: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('app.frontendUrl')}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #00d4aa, #7c3aed); border-radius: 12px; margin: 0 auto 20px; }
          .content { background: #12121a; border-radius: 16px; padding: 40px; border: 1px solid #1e1e2e; }
          .button { display: inline-block; background: linear-gradient(135deg, #00d4aa, #00b894); color: #0a0a0f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .warning { background: #2d1f1f; border: 1px solid #5c2a2a; border-radius: 8px; padding: 16px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo"></div>
            <h1 style="margin: 0; color: #00d4aa;">RateGuard</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${fullName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p style="color: #888; font-size: 14px;">This link expires in 24 hours.</p>
            <div class="warning">
              <p style="margin: 0; color: #ff6b6b;">⚠️ If you didn't request this, please ignore this email or contact support if you're concerned.</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 RateGuard. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔑 Reset your RateGuard password',
      html,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  async sendPasswordChangedEmail(email: string, fullName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .content { background: #12121a; border-radius: 16px; padding: 40px; border: 1px solid #1e1e2e; }
          .warning { background: #2d1f1f; border: 1px solid #5c2a2a; border-radius: 8px; padding: 16px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Password Changed Successfully ✅</h2>
            <p>Hi ${fullName},</p>
            <p>Your RateGuard password was just changed. All your other sessions have been logged out for security.</p>
            <div class="warning">
              <p style="margin: 0; color: #ff6b6b;">⚠️ If you didn't make this change, please reset your password immediately and contact support.</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 RateGuard. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔒 Your RateGuard password was changed',
      html,
      text: `Your password was changed. If this wasn't you, reset your password immediately.`,
    });
  }

  async sendLoginAlertEmail(email: string, fullName: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .content { background: #12121a; border-radius: 16px; padding: 40px; border: 1px solid #1e1e2e; }
          .info-box { background: #1e1e2e; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>New Login Detected 🔔</h2>
            <p>Hi ${fullName},</p>
            <p>We noticed a new login to your RateGuard account:</p>
            <div class="info-box">
              <p><strong>IP Address:</strong> ${ipAddress}</p>
              <p><strong>Device:</strong> ${userAgent}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            </div>
            <p style="color: #888;">If this was you, no action is needed. If not, please change your password immediately.</p>
          </div>
          <div class="footer">
            <p>© 2024 RateGuard. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔔 New login to your RateGuard account',
      html,
      text: `New login from ${ipAddress}`,
    });
  }
}

