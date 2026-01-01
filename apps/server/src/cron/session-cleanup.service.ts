import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clean up expired sessions every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredSessions() {
    this.logger.log('Starting expired session cleanup...');

    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired/revoked sessions`);
  }

  /**
   * Clean up old audit logs (older than 90 days)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldAuditLogs() {
    this.logger.log('Starting old audit log cleanup...');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old audit logs`);
  }
}

