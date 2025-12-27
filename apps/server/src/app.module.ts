import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

// TODO: Uncomment as modules are created
// import { RedisModule } from "./redis/redis.module";
// import { UsersModule } from "./modules/users/users.module";
// import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
// import { ApiKeysModule } from "./modules/api-keys/api-keys.module";
// import { RateLimitsModule } from "./modules/rate-limits/rate-limits.module";
// import { UpstreamsModule } from "./modules/upstreams/upstreams.module";
// import { GatewayModule } from "./modules/gateway/gateway.module";
// import { AnalyticsModule } from "./modules/analytics/analytics.module";
// import { WebhooksModule } from "./modules/webhooks/webhooks.module";
// import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    // Configuration - loads environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
    }),

    // Database
    PrismaModule,

    // Authentication
    AuthModule,

    // TODO: Uncomment as modules are created
    // RedisModule,
    // UsersModule,
    // WorkspacesModule,
    // ApiKeysModule,
    // RateLimitsModule,
    // UpstreamsModule,
    // GatewayModule,
    // AnalyticsModule,
    // WebhooksModule,
    // AdminModule,
  ],
  providers: [
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
