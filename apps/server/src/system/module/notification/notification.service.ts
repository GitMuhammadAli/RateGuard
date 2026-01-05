import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../../../database/prisma.service';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Web Push Notification Service
 * 
 * Uses the Web Push API - completely FREE and works in all modern browsers!
 * 
 * How it works:
 * 1. Generate VAPID keys (one-time setup)
 * 2. Frontend subscribes to push notifications
 * 3. Backend sends push via web-push library
 * 4. Browser shows notification even when tab is closed!
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private isConfigured = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.initializeWebPush();
  }

  private initializeWebPush() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const email = this.configService.get<string>('VAPID_EMAIL') || 'mailto:admin@rateguard.io';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(email, publicKey, privateKey);
      this.isConfigured = true;
      this.logger.log('✅ Web Push notifications configured');
    } else {
      this.logger.warn('⚠️ VAPID keys not configured - push notifications disabled');
      this.logger.warn('Run: npx web-push generate-vapid-keys');
    }
  }

  /**
   * Get VAPID public key for frontend subscription
   */
  getPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  /**
   * Save a user's push subscription
   */
  async saveSubscription(userId: string, subscription: PushSubscription, deviceName?: string) {
    // Store in user preferences or a dedicated table
    // For now, we'll store in user.preferences JSON field
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const preferences = (user?.preferences as Record<string, any>) || {};
    const subscriptions = preferences.pushSubscriptions || [];
    
    // Check if this endpoint already exists
    const existingIndex = subscriptions.findIndex(
      (s: PushSubscription) => s.endpoint === subscription.endpoint
    );

    if (existingIndex >= 0) {
      subscriptions[existingIndex] = { ...subscription, deviceName, updatedAt: new Date() };
    } else {
      subscriptions.push({ ...subscription, deviceName, createdAt: new Date() });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: { ...preferences, pushSubscriptions: subscriptions },
      },
    });

    this.logger.log(`Push subscription saved for user ${userId}`);
    return { success: true };
  }

  /**
   * Remove a push subscription
   */
  async removeSubscription(userId: string, endpoint: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const preferences = (user?.preferences as Record<string, any>) || {};
    const subscriptions = (preferences.pushSubscriptions || []).filter(
      (s: PushSubscription) => s.endpoint !== endpoint
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: { ...preferences, pushSubscriptions: subscriptions },
      },
    });

    return { success: true };
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: NotificationPayload): Promise<{ sent: number; failed: number }> {
    if (!this.isConfigured) {
      this.logger.warn('Push notifications not configured');
      return { sent: 0, failed: 0 };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const preferences = (user?.preferences as Record<string, any>) || {};
    const subscriptions: PushSubscription[] = preferences.pushSubscriptions || [];

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const failedEndpoints: string[] = [];

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            ...payload,
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/badge-72.png',
          })
        );
        sent++;
      } catch (error: any) {
        failed++;
        // If subscription is invalid (410 Gone), mark for removal
        if (error.statusCode === 410 || error.statusCode === 404) {
          failedEndpoints.push(subscription.endpoint);
        }
        this.logger.error(`Failed to send push to ${subscription.endpoint}`, error.message);
      }
    }

    // Clean up invalid subscriptions
    if (failedEndpoints.length > 0) {
      await this.cleanupInvalidSubscriptions(userId, failedEndpoints);
    }

    return { sent, failed };
  }

  /**
   * Send push notification to all members of a workspace
   */
  async sendToWorkspace(
    workspaceId: string, 
    payload: NotificationPayload,
    options?: { excludeUserId?: string; roles?: string[] }
  ): Promise<{ totalSent: number; totalFailed: number }> {
    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        ...(options?.roles && { role: { in: options.roles as any } }),
        ...(options?.excludeUserId && { userId: { not: options.excludeUserId } }),
      },
      select: { userId: true },
    });

    let totalSent = 0;
    let totalFailed = 0;

    for (const member of members) {
      const result = await this.sendToUser(member.userId, payload);
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return { totalSent, totalFailed };
  }

  /**
   * Send alert notification (budget exceeded, rate limit hit, etc.)
   */
  async sendAlert(
    workspaceId: string,
    alertType: 'budget' | 'rate_limit' | 'error' | 'provider_down',
    details: { title: string; message: string; url?: string }
  ) {
    const icons: Record<string, string> = {
      budget: '💰',
      rate_limit: '⚡',
      error: '❌',
      provider_down: '🔴',
    };

    return this.sendToWorkspace(workspaceId, {
      title: `${icons[alertType]} ${details.title}`,
      body: details.message,
      tag: `alert-${alertType}-${workspaceId}`,
      url: details.url || `/dashboard/alerts`,
      data: { type: alertType, workspaceId },
    });
  }

  private async cleanupInvalidSubscriptions(userId: string, endpoints: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const preferences = (user?.preferences as Record<string, any>) || {};
    const subscriptions = (preferences.pushSubscriptions || []).filter(
      (s: PushSubscription) => !endpoints.includes(s.endpoint)
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: { ...preferences, pushSubscriptions: subscriptions },
      },
    });
  }
}

