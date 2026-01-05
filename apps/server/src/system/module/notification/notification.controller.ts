import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../decorator/current-user.decorator';
import { NotificationService, PushSubscription } from './notification.service';

class SubscribeDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName?: string;
}

class UnsubscribeDto {
  endpoint: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('vapid-public-key')
  @ApiOperation({
    summary: 'Get VAPID public key',
    description: 'Get the public key needed to subscribe to push notifications',
  })
  @ApiResponse({ status: 200, description: 'VAPID public key' })
  getPublicKey() {
    const key = this.notificationService.getPublicKey();
    return { 
      publicKey: key,
      enabled: !!key,
    };
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Subscribe to push notifications',
    description: 'Save the push subscription for the current user',
  })
  @ApiResponse({ status: 200, description: 'Subscription saved' })
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.notificationService.saveSubscription(userId, dto, dto.deviceName);
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unsubscribe from push notifications',
    description: 'Remove a push subscription',
  })
  async unsubscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: UnsubscribeDto,
  ) {
    return this.notificationService.removeSubscription(userId, dto.endpoint);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test notification',
    description: 'Send a test push notification to yourself',
  })
  async testNotification(@CurrentUser('id') userId: string) {
    const result = await this.notificationService.sendToUser(userId, {
      title: '🎉 Test Notification',
      body: 'Push notifications are working! You\'ll receive alerts here.',
      url: '/dashboard',
    });
    
    return {
      message: result.sent > 0 
        ? 'Test notification sent!' 
        : 'No subscriptions found. Enable notifications first.',
      ...result,
    };
  }
}

