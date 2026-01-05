# RateGuard - Phase 1 Build Prompts

## Overview

**29 Prompts across 7 sections:**

| Section | Focus | Prompts |
|---------|-------|---------|
| 1.1 | Authentication | 4 |
| 1.2 | Core Proxy | 5 |
| 1.3 | Rate Limiting | 4 |
| 1.4 | Cost Tracking | 3 |
| 1.5 | Analytics Pipeline | 4 |
| 1.6 | Dashboard MVP | 6 |
| 1.7 | Integration | 3 |

---

## SECTION 1.1: AUTHENTICATION (4 Prompts)

### PROMPT 1.1.1: Shared Auth Utilities

Create authentication utilities in `packages/shared/src/utils/`

**FILE: `packages/shared/src/utils/crypto.ts`**
```typescript
// Functions to implement:
hashPassword(password: string): Promise<string>
// - Use bcrypt with cost factor 12

verifyPassword(password: string, hash: string): Promise<boolean>
// - Compare password against bcrypt hash

generateApiKey(environment: 'live' | 'test'): string
// - Format: rg_{env}_{32 random chars}
// - Example: rg_live_K7dF9xQ2mN8bV3hJ5wR1tY6uI0oP4lA2

hashApiKey(key: string): string
// - SHA-256 hash for database storage

getApiKeyPrefix(key: string): string
// - First 12 characters for display

generateToken(length: number): string
// - Random token for refresh tokens
```

**FILE: `packages/shared/src/utils/jwt.ts`**
Using 'jose' library:
```typescript
signAccessToken(payload: TokenPayload): Promise<string>
// - 15 minute expiry
// - RS256 or HS256 algorithm

signRefreshToken(userId: string): Promise<string>
// - 7 day expiry

verifyAccessToken(token: string): Promise<TokenPayload>
// - Verify signature and expiration

verifyRefreshToken(token: string): Promise<{ userId: string }>
// - Verify signature and expiration
```

**FILE: `packages/shared/src/utils/encryption.ts`**
AES-256-GCM for API credentials:
```typescript
encrypt(plaintext: string): string
// - Returns: iv:authTag:ciphertext (base64 encoded)
// - Use random IV for each encryption

decrypt(encrypted: string): string
// - Parse iv:authTag:ciphertext
// - Decrypt and return plaintext
```

**FILE: `packages/shared/src/schemas/auth.ts`**
Zod schemas:
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const tokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});
```

**Dependencies:** bcrypt, jose, zod
**Export:** All from `packages/shared/src/index.ts`

---

### PROMPT 1.1.2: Database Services

Create database service layer in `packages/db/src/services/`

**FILE: `packages/db/src/services/user.service.ts`**
```typescript
class UserService {
  async create(data: { email: string; name: string; passwordHash: string }): Promise<User>
  async findByEmail(email: string): Promise<User | null>
  async findById(id: string): Promise<User | null>
  async updatePassword(id: string, hash: string): Promise<User>
}
```

**FILE: `packages/db/src/services/workspace.service.ts`**
```typescript
class WorkspaceService {
  async create(data: { name: string; slug: string; ownerId: string }): Promise<Workspace>
  // - Also creates WorkspaceMember with OWNER role
  
  async findById(id: string): Promise<Workspace | null>
  async findBySlug(slug: string): Promise<Workspace | null>
  async findByUserId(userId: string): Promise<Workspace[]>
  async addMember(workspaceId: string, userId: string, role: Role): Promise<WorkspaceMember>
  async updateSettings(id: string, settings: any): Promise<Workspace>
}
```

**FILE: `packages/db/src/services/api-key.service.ts`**
```typescript
class ApiKeyService {
  async create(data: { 
    workspaceId: string; 
    name: string; 
    keyHash: string; 
    keyPrefix: string 
  }): Promise<ApiKey>
  
  async findByHash(keyHash: string): Promise<ApiKey | null>
  // - Include workspace in result
  
  async findByWorkspace(workspaceId: string): Promise<ApiKey[]>
  async updateLastUsed(id: string): Promise<void>
  async deactivate(id: string): Promise<ApiKey>
}
```

**FILE: `packages/db/src/services/index.ts`**
Export singleton instances using shared Prisma client

---

### PROMPT 1.1.3: Auth API Routes

Create auth routes in `apps/web/src/app/api/auth/`

**FILE: `apps/web/src/app/api/auth/register/route.ts`**
```typescript
// POST /api/auth/register
// Flow:
// 1. Validate body with registerSchema
// 2. Check email exists → 409 Conflict
// 3. Hash password, create user
// 4. Create default workspace (slug from name)
// 5. Generate tokens (access + refresh)
// 6. Set refresh token in HTTP-only cookie
// 7. Return { user, workspace, accessToken }
```

**FILE: `apps/web/src/app/api/auth/login/route.ts`**
```typescript
// POST /api/auth/login
// Flow:
// 1. Validate body with loginSchema
// 2. Find user by email → 401 if not found
// 3. Verify password → 401 if invalid
// 4. Get user's workspaces
// 5. Generate tokens
// 6. Set refresh cookie, return response
```

**FILE: `apps/web/src/app/api/auth/logout/route.ts`**
```typescript
// POST /api/auth/logout
// - Clear refresh token cookie
// - Return { success: true }
```

**FILE: `apps/web/src/app/api/auth/refresh/route.ts`**
```typescript
// POST /api/auth/refresh
// - Get refresh token from cookie
// - Verify refresh token
// - Generate new access token
// - Return { accessToken }
```

**FILE: `apps/web/src/app/api/auth/me/route.ts`**
```typescript
// GET /api/auth/me
// - Verify access token from Authorization header
// - Return user + workspaces
```

**Cookie settings:**
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60,  // 7 days
  path: '/',
}
```

---

### PROMPT 1.1.4: Auth Context & Middleware

**FILE: `apps/web/src/middleware.ts`**
Next.js middleware:
```typescript
// Public paths (no auth required):
// - /
// - /login
// - /register
// - /api/auth/*

// Protected paths:
// - /dashboard/*
// - /api/* (except /api/auth/*)

// Logic:
// 1. Check Authorization header or session cookie
// 2. For pages: redirect to /login if not authenticated
// 3. For API: return 401 if not authenticated
```

**FILE: `apps/web/src/components/providers/auth-provider.tsx`**
```typescript
interface AuthState {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, name: string): Promise<void>;
  logout(): Promise<void>;
  switchWorkspace(id: string): void;
  refreshToken(): Promise<void>;
}

// Features:
// - Auto-refresh access token at 14 minute mark
// - Persist current workspace in localStorage
// - Handle token expiration gracefully
```

**FILE: `apps/web/src/hooks/use-auth.ts`**
```typescript
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
}
```

**FILE: `apps/proxy/src/middleware/auth.ts`**
Fastify preHandler:
```typescript
// 1. Get X-RateGuard-Key header (or Authorization: Bearer)
// 2. Hash key with SHA-256
// 3. Lookup in database
// 4. If invalid → 401 { error: { code: "invalid_api_key", message: "..." } }
// 5. If expired → 403 { error: { code: "expired_api_key" } }
// 6. Update lastUsedAt (async, fire and forget)
// 7. Attach request.apiKey, request.workspace
```

---

## SECTION 1.2: CORE PROXY GATEWAY (5 Prompts)

### PROMPT 1.2.1: Fastify Server Setup

**FILE: `apps/proxy/src/server.ts`**
```typescript
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

export async function buildServer() {
  const server = Fastify({
    logger: /* pino logger */,
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024,  // 10MB
  });

  // Security
  await server.register(helmet);
  await server.register(cors, { origin: true, credentials: true });
  await server.register(cookie);

  // Custom plugins
  await registerPlugins(server);  // redis, prisma, kafka

  // Routes
  await registerRoutes(server);  // health, proxy

  // Global error handler
  server.setErrorHandler(errorHandler);

  return server;
}
```

**FILE: `apps/proxy/src/plugins/redis.ts`**
```typescript
// Fastify plugin using ioredis
// - Connect on startup
// - Decorate fastify.redis
// - Health check method
// - Graceful shutdown
```

**FILE: `apps/proxy/src/plugins/prisma.ts`**
```typescript
// - Import prisma from @rateguard/db
// - Decorate fastify.prisma
```

**FILE: `apps/proxy/src/routes/health.ts`**
```typescript
// GET /health - Always 200 (for load balancer)
// GET /ready - Check Redis + DB connectivity
// Response: { status, timestamp, services: { redis, database } }
```

**FILE: `apps/proxy/src/lib/config.ts`**
```typescript
// Zod-validated environment config:
const configSchema = z.object({
  port: z.number().default(3001),
  env: z.enum(['development', 'production']),
  database: z.object({ url: z.string() }),
  redis: z.object({ url: z.string() }),
  kafka: z.object({
    brokers: z.array(z.string()),
    topic: z.string().default('api-events'),
  }),
  jwt: z.object({ secret: z.string() }),
  encryption: z.object({ key: z.string() }),
  proxy: z.object({
    timeout: z.number().default(30000),
    maxBodySize: z.number().default(10 * 1024 * 1024),
  }),
});
```

---

### PROMPT 1.2.2: API Config Service

**FILE: `packages/db/src/services/api.service.ts`**
```typescript
class ApiService {
  async create(data): Promise<Api>
  // - Encrypt credentials before storing
  
  async findById(id: string): Promise<Api | null>
  async findByWorkspaceAndSlug(workspaceId: string, slug: string): Promise<Api | null>
  async findByWorkspace(workspaceId: string): Promise<Api[]>
  async update(id: string, data): Promise<Api>
  async updateCredentials(id: string, credentials: string): Promise<Api>
}
```

**FILE: `apps/proxy/src/services/api-config.ts`**
```typescript
class ApiConfigService {
  async getConfig(workspaceId: string, apiSlug: string): Promise<ApiConfig | null> {
    // 1. Check Redis cache: config:api:{workspaceId}:{slug}
    // 2. If cache hit, return cached config
    // 3. If cache miss, fetch from DB
    // 4. Decrypt credentials
    // 5. Cache for 60 seconds
    // 6. Return config
  }
  
  async invalidateCache(workspaceId: string, slug: string): Promise<void>
}

interface ApiConfig {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  authType: AuthType;
  authConfig: object;
  decryptedCredentials: string;
  costModel: CostModel;
  timeoutMs: number;
  isActive: boolean;
}
```

---

### PROMPT 1.2.3: Upstream Forwarding

**FILE: `apps/proxy/src/services/upstream.ts`**
```typescript
import { Agent, request } from 'undici';

class UpstreamService {
  private agent: Agent;
  
  constructor() {
    // Create agent with connection pooling (100 connections)
    this.agent = new Agent({
      pipelining: 1,
      connections: 100,
    });
  }

  async forward(req: ForwardRequest): Promise<ForwardResponse> {
    // 1. Build URL: apiConfig.baseUrl + path + query
    // 2. Prepare headers:
    //    - Copy allowed headers (content-type, accept, etc.)
    //    - Remove: host, connection, x-rateguard-*
    //    - Add auth based on authType:
    //      - BEARER: Authorization: Bearer {credentials}
    //      - API_KEY_HEADER: {headerName}: {credentials}
    //      - BASIC: Authorization: Basic {base64}
    // 3. Make request with undici
    // 4. Return { status, headers, body, timing }
  }
}

interface ForwardRequest {
  apiConfig: ApiConfig;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: string;
}

interface ForwardResponse {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
  timing: { startTime: number; endTime: number; durationMs: number };
}

// Custom errors:
// - UpstreamTimeoutError
// - UpstreamConnectionError
// - UpstreamError
```

---

### PROMPT 1.2.4: Proxy Route Handler

**FILE: `apps/proxy/src/routes/proxy.ts`**
```typescript
// Route: ALL /proxy/:apiSlug/*
// Example: POST /proxy/openai/chat/completions

export async function proxyRoutes(server: FastifyInstance) {
  // Middleware chain (in order):
  server.addHook('preHandler', authMiddleware);
  server.addHook('preHandler', rateLimitMiddleware);  // PLACEHOLDER
  server.addHook('preHandler', budgetMiddleware);     // PLACEHOLDER

  server.all('/:apiSlug/*', async (request, reply) => {
    // 1. Extract: API key, slug, method, path, query, headers, body
    // 2. Load API config → 404 if not found, 403 if inactive
    // 3. Check rate limit (PLACEHOLDER - always pass)
    // 4. Check budget (PLACEHOLDER - always pass)
    // 5. Check cache (PLACEHOLDER - always miss)
    // 6. Forward to upstream
    // 7. Process response (extract usage, calculate cost)
    // 8. Add headers:
    //    - X-RateGuard-Request-Id
    //    - X-RateLimit-Limit, Remaining, Reset
    //    - X-RateGuard-Cost-Cents
    //    - X-RateGuard-Latency-Ms
    // 9. Log event (PLACEHOLDER - console.log)
    // 10. Return response
  });
}

// Error codes:
// - 401: invalid_api_key
// - 402: budget_exceeded
// - 404: api_not_found
// - 429: rate_limited (with Retry-After header)
// - 502: upstream_error
// - 504: upstream_timeout
```

---

### PROMPT 1.2.5: Error Handling

**FILE: `apps/proxy/src/lib/errors.ts`**
```typescript
class RateGuardError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'RateGuardError';
  }
}

// Subclasses:
class ValidationError extends RateGuardError { /* 400 */ }
class AuthenticationError extends RateGuardError { /* 401 */ }
class PaymentRequiredError extends RateGuardError { /* 402 */ }
class ForbiddenError extends RateGuardError { /* 403 */ }
class NotFoundError extends RateGuardError { /* 404 */ }
class RateLimitError extends RateGuardError { 
  /* 429 - includes retryAfter, limit, remaining */
}
class UpstreamError extends RateGuardError { /* 502 */ }
class CircuitOpenError extends RateGuardError { /* 503 */ }
class UpstreamTimeoutError extends RateGuardError { /* 504 */ }
```

**FILE: `apps/proxy/src/middleware/error-handler.ts`**
```typescript
// Global error handler
// - Map error types to status codes
// - Response format:
//   { error: { code, message, details }, requestId }
// - Log full error (with stack) internally
// - Don't leak stack traces in production
```

**FILE: `apps/proxy/src/middleware/request-logger.ts`**
```typescript
// Fastify hooks:
// - onRequest: Generate requestId, start timer, log request
// - onResponse: Log { requestId, statusCode, durationMs }
// - onError: Log { requestId, error.message, error.stack }
```

---

## SECTION 1.3: RATE LIMITING (4 Prompts)

### PROMPT 1.3.1: Token Bucket Lua Script

**FILE: `packages/rate-limiter/src/lua/token-bucket.lua`**
```lua
-- KEYS[1] = bucket key
-- ARGV[1] = bucket_size (max tokens)
-- ARGV[2] = refill_rate (tokens per second)
-- ARGV[3] = requested (tokens to consume)
-- ARGV[4] = now (timestamp in milliseconds)

-- Algorithm:
-- 1. Get current state: tokens, last_refill
-- 2. Initialize if new (tokens = bucket_size)
-- 3. Calculate tokens to add: elapsed_seconds * refill_rate
-- 4. Refill bucket (cap at bucket_size)
-- 5. If tokens >= requested:
--    - Consume tokens
--    - Save state with HMSET
--    - Set TTL for auto-cleanup
--    - Return [1, remaining, reset_at]
-- 6. Else:
--    - Calculate retry_after_ms
--    - Return [0, remaining, reset_at, retry_after_ms]
```

**FILE: `packages/rate-limiter/src/algorithms/token-bucket.ts`**
```typescript
class TokenBucket {
  constructor(redis: Redis)
  
  async check(key: string, config: TokenBucketConfig, requested = 1): Promise<RateLimitResult>
  // - Load Lua script with SCRIPT LOAD (once)
  // - Execute with EVALSHA
  // - Handle NOSCRIPT error (reload script)
  
  async reset(key: string): Promise<void>
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}
```

---

### PROMPT 1.3.2: Sliding Window Lua Script

**FILE: `packages/rate-limiter/src/lua/sliding-window.lua`**
```lua
-- KEYS[1] = key prefix
-- ARGV[1] = limit
-- ARGV[2] = window_size_ms
-- ARGV[3] = now
-- ARGV[4] = request_id (unique per request)

-- Algorithm:
-- 1. Remove expired entries: ZREMRANGEBYSCORE key -inf (now - window)
-- 2. Count current: ZCARD key
-- 3. If count < limit:
--    - ZADD key now request_id
--    - Set TTL
--    - Return [1, remaining, reset_at]
-- 4. Else:
--    - Get oldest entry timestamp
--    - Calculate retry_after = oldest + window - now
--    - Return [0, 0, reset_at, retry_after]
```

**FILE: `packages/rate-limiter/src/algorithms/sliding-window.ts`**
```typescript
class SlidingWindowCounter {
  constructor(redis: Redis)
  
  async check(key: string, config: SlidingWindowConfig): Promise<RateLimitResult>
}
```

**Export both from `packages/rate-limiter/src/index.ts`**

---

### PROMPT 1.3.3: Rate Limit Service

**FILE: `packages/db/src/services/rate-limit-rule.service.ts`**
```typescript
class RateLimitRuleService {
  async create(data): Promise<RateLimitRule>
  
  async findByWorkspace(workspaceId: string): Promise<RateLimitRule[]>
  // - Order by priority DESC
  
  async findMatchingRules(workspaceId: string, apiId: string, endpoint: string): Promise<RateLimitRule[]>
  // - Match endpointPattern with glob pattern
  // - Include rules without pattern (global)
  
  async update(id: string, data): Promise<RateLimitRule>
  async delete(id: string): Promise<void>
}
```

**FILE: `apps/proxy/src/services/rate-limiter.ts`**
```typescript
class RateLimiterService {
  constructor(redis: Redis, ruleService: RateLimitRuleService)
  
  async check(context: RateLimitContext): Promise<CheckResult> {
    // 1. Get matching rules for workspace, API, endpoint
    // 2. For each rule (all must pass):
    //    - Build Redis key based on scope:
    //      - GLOBAL: rl:{alg}:global:{apiId}
    //      - PER_WORKSPACE: rl:{alg}:{workspaceId}:{apiId}
    //      - PER_KEY: rl:{alg}:{workspaceId}:{apiId}:{keyId}
    //      - PER_IP: rl:{alg}:{workspaceId}:{apiId}:{ip}
    //    - Execute rate limit check
    // 3. Return first failure or most restrictive success
  }
}

interface CheckResult {
  allowed: boolean;
  limitingRule?: RateLimitRule;
  results: Map<string, RateLimitResult>;
  headers: RateLimitHeaders;
}

// IMPORTANT: Implement fail-open
// If Redis fails, allow request with warning log
```

---

### PROMPT 1.3.4: Rate Limit Middleware

**FILE: `apps/proxy/src/middleware/rate-limit.ts`**
```typescript
function createRateLimitMiddleware(rateLimiter: RateLimiterService) {
  return async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
    // 1. Skip for /health routes
    // 2. Build context from request (workspaceId, apiId, keyId, ip, endpoint)
    // 3. Call rateLimiter.check(context)
    // 4. Always add headers:
    //    - X-RateLimit-Limit
    //    - X-RateLimit-Remaining
    //    - X-RateLimit-Reset
    // 5. If not allowed:
    //    - Add Retry-After header
    //    - Throw RateLimitError
    // 6. Attach result to request for logging
  }
}
```

**FILE: `packages/rate-limiter/tests/token-bucket.test.ts`**
Tests using Vitest:
1. Should allow requests within limit
2. Should deny requests over limit
3. Should refill tokens over time
4. Should handle burst correctly
5. Should return correct retry-after
6. Should handle concurrent requests

---

## SECTION 1.4: COST TRACKING (3 Prompts)

### PROMPT 1.4.1: Cost Calculator

**FILE: `packages/shared/src/types/cost.ts`**
```typescript
type CostModel =
  | { type: 'PER_REQUEST'; costCentsPerRequest: number }
  | { type: 'PER_TOKEN'; inputCostPer1kTokens: number; outputCostPer1kTokens: number }
  | { type: 'PER_UNIT'; unitName: string; costCentsPerUnit: number }
  | { type: 'TIERED'; tiers: Array<{ upTo: number; costCentsPerUnit: number }> };

interface UsageInfo {
  promptTokens?: number;
  completionTokens?: number;
  units?: number;
  requestCount?: number;
}
```

**FILE: `apps/proxy/src/services/cost-calculator.ts`**
```typescript
class CostCalculator {
  calculate(costModel: CostModel, usage: UsageInfo): number {
    // Returns cost in cents
    switch (costModel.type) {
      case 'PER_REQUEST':
        return costModel.costCentsPerRequest * (usage.requestCount || 1);
      case 'PER_TOKEN':
        return Math.ceil(
          ((usage.promptTokens || 0) / 1000 * costModel.inputCostPer1kTokens) +
          ((usage.completionTokens || 0) / 1000 * costModel.outputCostPer1kTokens)
        );
      // ... other cases
    }
  }
  
  estimate(costModel: CostModel, averageUsage?: UsageInfo): number
  // Use historical average or defaults
}
```

**FILE: `apps/proxy/src/services/usage-extractor.ts`**
```typescript
class UsageExtractor {
  extract(apiSlug: string, responseBody: Buffer, headers: Headers): UsageInfo {
    // Parse JSON response
    // OpenAI format: body.usage.prompt_tokens, completion_tokens
    // Anthropic format: body.usage.input_tokens, output_tokens
    // Default: { requestCount: 1 }
  }
}
```

---

### PROMPT 1.4.2: Budget Tracker

**FILE: `apps/proxy/src/services/budget-tracker.ts`**
```typescript
class BudgetTracker {
  constructor(redis: Redis)
  
  // Redis key format: budget:{workspaceId}:{YYYYMM}
  
  async getCurrentSpend(workspaceId: string): Promise<number>
  // GET key, return 0 if not found
  
  async addSpend(workspaceId: string, costCents: number): Promise<number>
  // INCRBY key costCents
  // Set expiry to end of next month (safety buffer)
  
  async check(
    workspaceId: string, 
    budgetCents: number, 
    estimatedCost: number,
    autoShutoff: boolean
  ): Promise<BudgetCheckResult>
  // If no budget set → always allowed
  // If currentSpend + estimated > budget && autoShutoff → denied
  
  async getStatus(workspaceId: string, budgetCents: number): Promise<BudgetStatus>
  // Returns current spend, percent used, remaining, projected month-end
}

interface BudgetStatus {
  currentSpendCents: number;
  budgetCents: number;
  percentUsed: number;
  remaining: number;
  projectedMonthEnd: number;  // dailyRate * daysInMonth
}
```

---

### PROMPT 1.4.3: Cost Integration

Update `apps/proxy/src/routes/proxy.ts`:
```typescript
// After upstream response:
// 1. Extract usage with usageExtractor
// 2. Calculate cost with costCalculator
// 3. Add spend with budgetTracker.addSpend()
// 4. Add header X-RateGuard-Cost-Cents
// 5. Attach cost to request for event logging
```

**FILE: `apps/proxy/src/middleware/budget.ts`**
```typescript
function createBudgetMiddleware(budgetTracker, costCalculator) {
  return async function budgetMiddleware(request, reply) {
    // Before forwarding:
    // 1. Skip if no budget set for workspace
    // 2. Estimate cost from request (use average or default)
    // 3. Check budget with budgetTracker.check()
    // 4. Add headers:
    //    - X-RateGuard-Budget-Used
    //    - X-RateGuard-Budget-Limit
    //    - X-RateGuard-Budget-Remaining
    // 5. If not allowed → throw PaymentRequiredError
  }
}
```

**FILE: `apps/web/src/app/api/costs/route.ts`**
```typescript
// GET /api/costs
// Return budget status for current workspace
```

**FILE: `apps/web/src/app/api/workspaces/[id]/budget/route.ts`**
```typescript
// PATCH /api/workspaces/:id/budget
// Update monthlyBudgetCents, autoShutoff setting
```

---

## SECTION 1.5: ANALYTICS PIPELINE (4 Prompts)

### PROMPT 1.5.1: Kafka Producer

**FILE: `apps/proxy/src/plugins/kafka.ts`**
```typescript
// Fastify plugin using kafkajs

// Setup:
// - Create Kafka client with clientId 'rateguard-proxy'
// - Create producer
// - Connect on startup

// Event batching:
// - Buffer events in array
// - Flush when: buffer >= 100 OR every 100ms
// - Use Snappy compression

fastify.kafka.sendEvent(event: RequestEvent)
// - Add to buffer
// - If buffer full, flush immediately
// - Else start/reset flush timer

// On close:
// - Flush remaining
// - Disconnect producer
```

**FILE: `packages/shared/src/types/events.ts`**
```typescript
interface RequestEvent {
  event_id: string;
  timestamp: string;
  workspace_id: string;
  api_key_id: string;
  api_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  latency_ms: number;
  upstream_latency_ms: number;
  request_bytes?: number;
  response_bytes?: number;
  cost_cents: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  cache_hit: boolean;
  rate_limited: boolean;
  error_type?: string;
}
```

---

### PROMPT 1.5.2: ClickHouse Consumer

**FILE: `packages/analytics/src/client.ts`**
```typescript
// createClickHouseClient() using @clickhouse/client
// - host from CLICKHOUSE_URL
// - database from CLICKHOUSE_DATABASE
// - async_insert enabled for performance
```

**FILE: `apps/analytics/src/consumer.ts`**
```typescript
class AnalyticsConsumer {
  // - Kafka consumer with groupId 'analytics-consumer'
  // - ClickHouse client
  // - Event buffer
  
  async start() {
    // Connect consumer
    // Subscribe to topic
    // Start flush interval (5 seconds)
    // Run with eachBatch handler
  }
  
  async processMessage(message) {
    // Parse as RequestEvent
    // Add to buffer
    // If buffer >= 1000, flush
  }
  
  async flush() {
    // Insert batch to ClickHouse api_events table
    // Use JSONEachRow format
    // Log success/error
    // On error, re-add to buffer (with limit)
  }
}
```

---

### PROMPT 1.5.3: Analytics Queries

**FILE: `packages/analytics/src/queries.ts`**
```typescript
class AnalyticsQueries {
  constructor(client: ClickHouseClient)
  
  async getRequestsOverTime(workspaceId, range, granularity): Promise<TimeSeriesData[]>
  // GROUP BY toStartOfMinute/Hour/Day(timestamp)
  
  async getCostBreakdown(workspaceId, range): Promise<CostByApi[]>
  // GROUP BY api_id
  
  async getTopEndpoints(workspaceId, range, limit): Promise<EndpointStats[]>
  // GROUP BY endpoint, method
  // Include: request_count, avg_latency_ms, error_rate, total_cost_cents
  
  async getLatencyPercentiles(workspaceId, range, apiId?): Promise<LatencyPercentiles>
  // quantile(0.5), quantile(0.95), quantile(0.99)
  
  async getSummaryStats(workspaceId, range): Promise<SummaryStats>
  // totalRequests, totalErrors, totalCostCents, avgLatencyMs, cacheHitRate
}

// All methods use parameterized queries for SQL injection safety
```

---

### PROMPT 1.5.4: Analytics API

**FILE: `apps/web/src/app/api/analytics/requests/route.ts`**
```typescript
// GET /api/analytics/requests
// Query params: start, end, granularity (minute|hour|day), apiId
// Returns: { range, granularity, data: [...] }
```

**FILE: `apps/web/src/app/api/analytics/summary/route.ts`**
```typescript
// GET /api/analytics/summary
// Query params: start, end
// Returns: { range, requests, cost, latency, cache, rateLimit }
```

**FILE: `apps/web/src/app/api/analytics/top-endpoints/route.ts`**
```typescript
// GET /api/analytics/top-endpoints
// Query params: start, end, limit
// Returns: { range, endpoints: [...] }
```

**FILE: `apps/web/src/lib/analytics.ts`**
```typescript
// Initialize ClickHouse client and AnalyticsQueries instance
// Export for use in API routes
```

---

## SECTION 1.6: DASHBOARD MVP (6 Prompts)

*(See separate file for detailed dashboard component implementations)*

### Summary:

1. **PROMPT 1.6.1: Layout & Navigation**
   - Dashboard layout with sidebar
   - Header with breadcrumbs
   - Workspace selector

2. **PROMPT 1.6.2: Overview Page**
   - Stats cards (requests, cost, errors, latency)
   - Request chart (line)
   - Cost chart (bar)
   - Top endpoints table

3. **PROMPT 1.6.3: APIs Page**
   - List/Create/Edit/Delete APIs
   - API form with validation

4. **PROMPT 1.6.4: API Keys Page**
   - List keys (show prefix only)
   - Create key (show full key ONCE)
   - Delete key

5. **PROMPT 1.6.5: Rate Limits Page**
   - List/Create/Edit/Delete rules
   - Algorithm and scope selection

6. **PROMPT 1.6.6: Analytics & Costs Pages**
   - Time range selector
   - Charts and tables
   - Budget management

---

## SECTION 1.7: INTEGRATION & TESTING (3 Prompts)

### PROMPT 1.7.1: End-to-End Integration

Wire everything together and create start scripts.

### PROMPT 1.7.2: Database Seed

Create seed data with test user, workspace, APIs, and keys.

### PROMPT 1.7.3: Documentation

Create README with setup instructions and usage examples.

---

## Timeline

| Week | Section | Deliverable |
|------|---------|-------------|
| 1 | 1.1-1.2 | Auth + Basic Proxy |
| 2 | 1.2-1.3 | Proxy + Rate Limiting |
| 3 | 1.3 | Rate Limiting Complete |
| 4 | 1.4 | Cost Tracking |
| 5 | 1.5 | Analytics Pipeline |
| 6 | 1.6 | Dashboard (part 1) |
| 7 | 1.6 | Dashboard (part 2) |
| 8 | 1.7 | Integration + Testing |

---

## Success Criteria

After Phase 1, you should have:

- ✅ Working proxy that forwards to upstream APIs
- ✅ Token Bucket rate limiting with Lua scripts
- ✅ Cost tracking with Redis counters
- ✅ Events flowing to ClickHouse via Kafka
- ✅ Dashboard showing analytics
- ✅ API key management
- ✅ Rate limit rule configuration

**This is interview-ready for "Design a Rate Limiter"!**

