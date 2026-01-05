import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import configuration from './config/configuration';

// Core Modules
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WorkspaceModule } from './workspace/workspace.module';

// System Components
import { EmailModule } from './system/module/email/email.module';
import { NotificationModule } from './system/module/notification/notification.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoggingInterceptor } from './system/interceptor/logging.interceptor';
import { HttpExceptionFilter } from './system/filter/http-exception.filter';

@Module({
  imports: [
    // Configuration - loads environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    DatabaseModule,

    // System Modules (Global)
    EmailModule,
    NotificationModule,

    // Feature Modules
    AuthModule,
    UserModule,
    WorkspaceModule,

    // TODO: Add more modules as needed
    // ApiKeysModule,
    // RateLimitsModule,
    // UpstreamsModule,
    // GatewayModule,
    // AnalyticsModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global JWT auth guard (use @Public() to skip)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
