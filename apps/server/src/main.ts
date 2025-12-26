import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import * as compression from "compression";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  // Create application instance
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port") ?? 3000;
  const apiPrefix = configService.get<string>("app.apiPrefix") ?? "api/v1";
  const nodeEnv = configService.get<string>("app.nodeEnv") ?? "development";
  const corsOrigins = configService.get<string[]>("app.corsOrigins") ?? [
    "http://localhost:3001",
  ];

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === "production" ? undefined : false,
    })
  );

  // Compression
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-Request-Id",
    ],
  });

  // Global API prefix (excludes proxy routes)
  app.setGlobalPrefix(apiPrefix, {
    exclude: ["proxy/*path", "health", "ready"],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation (non-production only)
  if (nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("RateGuard API")
      .setDescription("API Rate Limiting Gateway Platform")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
        "JWT"
      )
      .addApiKey(
        {
          type: "apiKey",
          name: "X-API-Key",
          in: "header",
          description: "API Key for proxy requests",
        },
        "API-Key"
      )
      .addTag("Auth", "Authentication endpoints")
      .addTag("Users", "User management")
      .addTag("Workspaces", "Workspace management")
      .addTag("API Keys", "API key management")
      .addTag("Rate Limits", "Rate limit rules")
      .addTag("Upstreams", "Upstream backend configuration")
      .addTag("Gateway", "Proxy gateway")
      .addTag("Analytics", "Usage analytics")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  // Health check endpoint
  app.getHttpAdapter().get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Start server
  await app.listen(port);

  const logger = new Logger("Bootstrap");
  logger.log(`
╔══════════════════════════════════════════════════════════════╗
║                    RateGuard Server                          ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Server running on: http://localhost:${port}              ║
║  📚 API Docs: http://localhost:${port}/docs                  ║
║  🏥 Health Check: http://localhost:${port}/health            ║
║  🌍 Environment: ${nodeEnv.padEnd(41)}                       ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
