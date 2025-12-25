# RateGuard - Code Deep Dive

## Table of Contents
1. [Database Schema](#1-database-schema)
2. [Rate Limiting Implementation](#2-rate-limiting-implementation)
3. [Proxy Server Code](#3-proxy-server-code)
4. [Web Dashboard Code](#4-web-dashboard-code)
5. [Analytics Pipeline](#5-analytics-pipeline)
6. [Infrastructure Configuration](#6-infrastructure-configuration)

---

## 1. Database Schema

### Schema Overview (Prisma)

**File: `packages/db/prisma/schema.prisma`**

```prisma
// ═══════════════════════════════════════════════════════════════
// USER & AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

model User {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  name          String
  passwordHash  String   @map("password_hash")
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  memberships WorkspaceMember[]

  @@map("users")  // Table name in PostgreSQL
}
```

**Design Decisions Explained:**

| Decision | Reasoning | Alternative |
|----------|-----------|-------------|
| `@id @default(uuid())` | UUIDs are non-guessable, work in distributed systems | Auto-increment (guessable: `/users/1`, `/users/2`) |
| `@map("password_hash")` | camelCase in code, snake_case in DB (SQL convention) | Same name everywhere (inconsistent) |
| `@@map("users")` | Plural table names (SQL convention) | Singular (Prisma default) |
| Separate `passwordHash` | Never include password in default queries | Mixed with user data (security risk) |

### Multi-Tenancy Model

```prisma
model Workspace {
  id                 String   @id @default(uuid()) @db.Uuid
  name               String
  slug               String   @unique  // URL-friendly: "acme-corp"
  plan               Plan     @default(FREE)
  monthlyBudgetCents Int?     @map("monthly_budget_cents")
  settings           Json     @default("{}")
  
  members        WorkspaceMember[]
  apis           Api[]
  apiKeys        ApiKey[]
  alerts         Alert[]
  rateLimitRules RateLimitRule[]
}

enum Plan {
  FREE        // 1,000 requests/month
  PRO         // 100,000 requests/month
  ENTERPRISE  // Unlimited
}

model WorkspaceMember {
  id          String   @id @default(uuid()) @db.Uuid
  workspaceId String   @map("workspace_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  role        Role     @default(MEMBER)
  
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])  // User can only be in workspace once
  @@index([workspaceId])           // Fast lookup by workspace
  @@index([userId])                // Fast lookup by user
}

enum Role {
  OWNER   // Full access, billing
  ADMIN   // Full access, no billing
  MEMBER  // Read/write APIs, keys
  VIEWER  // Read-only
}
```

**Why This Multi-Tenancy Model?**

```
┌─────────────────────────────────────────────────────────────┐
│                 MULTI-TENANCY PATTERN                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Option 1: Single-tenant (separate DBs)                     │
│  ✗ Complex deployment                                       │
│  ✗ Expensive at scale                                       │
│                                                              │
│  Option 2: Schema-per-tenant                                │
│  ✗ Migration complexity                                     │
│  ✗ Connection pool exhaustion                               │
│                                                              │
│  Option 3: Row-level (workspace_id column) ✓                │
│  ✓ Simple queries                                           │
│  ✓ Single schema, single pool                               │
│  ✓ Easy to add RLS (Row Level Security) later               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Defense:**
> "We use row-level multi-tenancy where every table has a `workspace_id` foreign key. Every query is scoped: `WHERE workspace_id = ?`. This is simpler than schema-per-tenant and scales to thousands of tenants. For additional security, we could enable PostgreSQL Row Level Security (RLS) policies."

### API Key Security Model

```prisma
model ApiKey {
  id          String    @id @default(uuid()) @db.Uuid
  workspaceId String    @map("workspace_id") @db.Uuid
  name        String    // "Production", "Development"
  
  keyHash   String  @unique @map("key_hash")   // SHA256 of full key
  keyPrefix String  @map("key_prefix")          // "rg_live_K7dF" for display
  
  scopes    Json    @default("[]")              // ["read:*", "write:apis"]
  
  isActive   Boolean   @default(true) @map("is_active")
  lastUsedAt DateTime? @map("last_used_at")
  expiresAt  DateTime? @map("expires_at")
  
  createdAt DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([keyHash])  // Fast lookup during authentication
}
```

**Key Generation & Storage:**

```typescript
// packages/shared/src/utils/crypto.ts

import crypto from 'crypto';

export function generateApiKey(environment: 'live' | 'test'): string {
  // Format: rg_{env}_{32 random chars}
  // Example: rg_live_K7dF9xQ2mN8bV3hJ5wR1tY6uI0oP4lA2
  const randomPart = crypto.randomBytes(24).toString('base64url');
  return `rg_${environment}_${randomPart}`;
}

export function hashApiKey(key: string): string {
  // One-way hash - cannot be reversed
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function getApiKeyPrefix(key: string): string {
  // First 12 characters for display
  return key.substring(0, 12);
}
```

**Why SHA256 instead of bcrypt for API keys?**

| Algorithm | API Keys | Passwords |
|-----------|----------|-----------|
| **SHA256** | ✓ Fast lookup (millions of requests) | ✗ Too fast (brute-forceable) |
| **bcrypt** | ✗ Too slow (100ms per hash) | ✓ Intentionally slow |

> "API keys are high-entropy random strings (32 chars = 192 bits). They can't be brute-forced even with SHA256. Passwords are low-entropy (8-20 chars, dictionary words). bcrypt's slowness protects against brute-force. We use the right tool for each job."

### Rate Limit Rules

```prisma
model RateLimitRule {
  id              String             @id @default(uuid()) @db.Uuid
  workspaceId     String             @map("workspace_id") @db.Uuid
  apiId           String?            @map("api_id") @db.Uuid
  
  endpointPattern String?            @map("endpoint_pattern")  // "/v1/chat/*"
  
  algorithm     RateLimitAlgorithm @default(TOKEN_BUCKET)
  limit         Int                // 100 requests
  windowSeconds Int                @map("window_seconds")  // per 60 seconds
  burstSize     Int?               @map("burst_size")      // Token bucket only
  
  scope         RateLimitScope @default(PER_KEY)
  actionOnLimit LimitAction    @default(REJECT) @map("action_on_limit")
  
  priority Int     @default(0)   // Higher = checked first
  isActive Boolean @default(true) @map("is_active")
}

enum RateLimitAlgorithm {
  TOKEN_BUCKET     // Allows bursts, smooth refill
  SLIDING_WINDOW   // Precise counting
  FIXED_WINDOW     // Simple, but has boundary issues
  LEAKY_BUCKET     // Smooth output rate
}

enum RateLimitScope {
  GLOBAL        // All requests share one limit
  PER_WORKSPACE // Each workspace has its own limit
  PER_KEY       // Each API key has its own limit
  PER_IP        // Each IP address has its own limit
  PER_USER      // Each user (from JWT) has its own limit
}

enum LimitAction {
  REJECT    // Return 429 immediately
  QUEUE     // Queue request, process later
  THROTTLE  // Slow down, don't reject
}
```

---

## 2. Rate Limiting Implementation

### Token Bucket Algorithm

**Concept Visualization:**

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN BUCKET                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Configuration:                                              │
│    bucket_size = 100 tokens (burst capacity)                │
│    refill_rate = 10 tokens/second (sustained rate)          │
│                                                              │
│  Timeline:                                                   │
│                                                              │
│  T=0: Bucket full [████████████████████] 100 tokens         │
│                                                              │
│  T=0: 50 requests arrive                                    │
│       [██████████__________] 50 tokens remaining            │
│       All 50 allowed ✓                                      │
│                                                              │
│  T=1: 10 tokens refilled                                    │
│       [████████████________] 60 tokens                      │
│                                                              │
│  T=1: 80 requests arrive                                    │
│       60 allowed ✓, 20 rejected ✗                           │
│       [____________________] 0 tokens                        │
│                                                              │
│  T=2: 10 tokens refilled                                    │
│       [██__________________] 10 tokens                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Lua Script (Atomic Operation):**

**File: `packages/rate-limiter/src/lua/token-bucket.lua`**

```lua
-- KEYS[1] = bucket key (e.g., "rl:tb:workspace:api:key")
-- ARGV[1] = bucket_size (max tokens)
-- ARGV[2] = refill_rate (tokens per second)
-- ARGV[3] = requested (tokens to consume, usually 1)
-- ARGV[4] = now (current timestamp in milliseconds)

local key = KEYS[1]
local bucket_size = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local requested = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

-- Get current state from Redis hash
local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

-- Initialize bucket if new (first request ever)
if tokens == nil then
    tokens = bucket_size
    last_refill = now
end

-- Calculate tokens to add since last refill
-- Example: 500ms elapsed, rate = 10/sec → add 5 tokens
local elapsed_ms = math.max(0, now - last_refill)
local elapsed_seconds = elapsed_ms / 1000
local tokens_to_add = elapsed_seconds * refill_rate

-- Add tokens but don't exceed bucket size
tokens = math.min(tokens + tokens_to_add, bucket_size)

-- Check if we have enough tokens
if tokens >= requested then
    -- Consume tokens
    tokens = tokens - requested
    
    -- Update state in Redis
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    
    -- Set TTL for automatic cleanup (2x time to fill bucket)
    local ttl = math.ceil(bucket_size / refill_rate * 2)
    redis.call('EXPIRE', key, ttl)
    
    -- Calculate reset time (when bucket will be full)
    local seconds_to_full = (bucket_size - tokens) / refill_rate
    local reset_at = now + (seconds_to_full * 1000)
    
    -- Return: [allowed=1, remaining, reset_timestamp]
    return {1, math.floor(tokens), math.floor(reset_at)}
else
    -- Not enough tokens - calculate when to retry
    local tokens_needed = requested - tokens
    local wait_ms = math.ceil(tokens_needed / refill_rate * 1000)
    local reset_at = now + wait_ms
    
    -- Return: [allowed=0, remaining, reset_timestamp, retry_after_ms]
    return {0, math.floor(tokens), math.floor(reset_at), wait_ms}
end
```

**Why Lua in Redis?**

```
┌─────────────────────────────────────────────────────────────┐
│                 WITHOUT LUA (Race Condition)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Thread 1            Redis           Thread 2               │
│     │                  │                 │                  │
│     │─── GET tokens ──►│                 │                  │
│     │◄── 1 ───────────│                 │                  │
│     │                  │◄── GET tokens ──│                  │
│     │                  │─── 1 ──────────►│                  │
│     │─── SET 0 ───────►│                 │                  │
│     │                  │◄── SET 0 ───────│  ← WRONG!        │
│     │                  │                 │                  │
│  Both threads think they got the last token!                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 WITH LUA (Atomic)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Thread 1            Redis           Thread 2               │
│     │                  │                 │                  │
│     │── EVALSHA ──────►│                 │                  │
│     │   (entire        │                 │                  │
│     │    script)       │                 │                  │
│     │◄── [1, 0] ───────│                 │  Thread 2 waits  │
│     │                  │◄── EVALSHA ─────│                  │
│     │                  │─── [0, 0] ─────►│  ← Correctly     │
│     │                  │                 │     rejected     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**TypeScript Wrapper:**

**File: `packages/rate-limiter/src/algorithms/token-bucket.ts`**

```typescript
import type Redis from 'ioredis';

const LUA_SCRIPT = `... (embedded script) ...`;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}

export interface RateLimiterConfig {
  limit: number;        // e.g., 100 requests
  windowSeconds: number; // e.g., 60 seconds
  burstSize?: number;    // Optional burst capacity
}

export class TokenBucket {
  private redis: Redis;
  private bucketSize: number;
  private refillRate: number;
  private keyPrefix: string;
  private scriptSha: string | null = null;

  constructor(redis: Redis, config: RateLimiterConfig, keyPrefix = 'rl:tb') {
    this.redis = redis;
    this.bucketSize = config.burstSize ?? config.limit;
    // Calculate refill rate: tokens per second to reach limit in windowSeconds
    this.refillRate = config.limit / config.windowSeconds;
    this.keyPrefix = keyPrefix;
  }

  private async loadScript(): Promise<string> {
    if (this.scriptSha) {
      return this.scriptSha;
    }
    // Load script once, reuse SHA for performance
    this.scriptSha = await this.redis.script('LOAD', LUA_SCRIPT) as string;
    return this.scriptSha;
  }

  async check(key: string, cost = 1): Promise<RateLimitResult> {
    const fullKey = `${this.keyPrefix}:${key}`;
    const now = Date.now();

    try {
      const sha = await this.loadScript();
      const result = await this.redis.evalsha(
        sha,
        1,                  // Number of keys
        fullKey,            // KEYS[1]
        this.bucketSize,    // ARGV[1]
        this.refillRate,    // ARGV[2]
        cost,               // ARGV[3]
        now                 // ARGV[4]
      ) as number[];

      const [allowed, remaining, resetAt, retryAfterMs] = result;

      return {
        allowed: allowed === 1,
        remaining,
        resetAt: new Date(resetAt),
        retryAfterMs,
      };
    } catch (error: any) {
      // Handle Redis restart (script needs reloading)
      if (error.message?.includes('NOSCRIPT')) {
        this.scriptSha = null;
        return this.check(key, cost);
      }
      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(`${this.keyPrefix}:${key}`);
  }
}
```

### Sliding Window Algorithm

**Concept:**

```
┌─────────────────────────────────────────────────────────────┐
│                    SLIDING WINDOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Configuration: 100 requests per 60-second window           │
│                                                              │
│  Time (seconds) →                                           │
│  0    10    20    30    40    50    60    70    80          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │
│                                                              │
│  At T=50:                                                   │
│  Window covers [T=0 to T=50] (last 50 seconds)              │
│  NOT [T=0 to T=60] (fixed window)                           │
│                                                              │
│  At T=70:                                                   │
│  Window covers [T=10 to T=70] ← Window "slides"             │
│  Requests from T=0-10 have "fallen off"                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Why Sliding Window vs Fixed Window?**

```
┌─────────────────────────────────────────────────────────────┐
│                 FIXED WINDOW PROBLEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Limit: 100 requests per minute                             │
│                                                              │
│  Minute 1: [0:00 ─────────────────────────────── 0:59]      │
│            │                              90 requests at 0:59│
│                                                              │
│  Minute 2: [1:00 ─────────────────────────────── 1:59]      │
│            │90 requests at 1:00                              │
│                                                              │
│  Result: 180 requests in 2 seconds! (0:59 to 1:01)          │
│  Both minutes show under 100, but burst is 180!             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                 SLIDING WINDOW SOLUTION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  At T=1:01, window is [T=0:01 to T=1:01]                    │
│  Counts all 180 requests → REJECTS over 100                 │
│                                                              │
│  ✓ No boundary exploit possible                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Lua Script:**

```lua
-- Uses Redis Sorted Set (ZSET)
-- Score = timestamp, Member = request_id

local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local request_id = ARGV[4]

-- Calculate window boundary
local window_start = now - window_ms

-- Remove expired entries (outside the window)
redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

-- Count current requests in window
local current_count = redis.call('ZCARD', key)

if current_count < limit then
    -- Add this request to the window
    redis.call('ZADD', key, now, request_id)
    
    -- Set TTL for cleanup
    local ttl_seconds = math.ceil(window_ms / 1000) + 1
    redis.call('EXPIRE', key, ttl_seconds)
    
    local remaining = limit - current_count - 1
    return {1, remaining, now + window_ms}  -- [allowed, remaining, reset_at]
else
    -- Over limit - calculate retry time
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after_ms = window_ms
    
    if oldest and #oldest >= 2 then
        local oldest_timestamp = tonumber(oldest[2])
        retry_after_ms = oldest_timestamp + window_ms - now
    end
    
    return {0, 0, now + retry_after_ms, retry_after_ms}
end
```

### Algorithm Comparison

| Feature | Token Bucket | Sliding Window | Fixed Window |
|---------|--------------|----------------|--------------|
| **Burst Handling** | ✓ Allows bursts up to bucket size | ✗ No bursts allowed | ✗ Boundary bursts |
| **Precision** | Good | Excellent | Poor |
| **Memory** | O(1) - 2 values | O(n) - per request | O(1) - 1 counter |
| **Use Case** | APIs allowing bursts | Strict rate enforcement | Simple quota |
| **Example** | OpenAI API | Financial APIs | Daily limits |

**Defense: When to use which?**

> "Token Bucket for user-facing APIs where occasional bursts improve UX (loading a page makes 20 API calls simultaneously). Sliding Window for financial/billing APIs where strict enforcement matters. Fixed Window only for simple daily/monthly quotas where boundary issues don't matter."

---

## 3. Proxy Server Code

### Server Setup

**File: `apps/proxy/src/server.ts`**

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import { logger } from './lib/logger';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/error-handler';

export async function buildServer() {
  const server = Fastify({
    logger: logger,           // Pino logger
    trustProxy: true,         // Trust X-Forwarded-* headers (behind LB)
    bodyLimit: 10 * 1024 * 1024, // 10MB max body
  });

  // Security headers (XSS, clickjacking, etc.)
  await server.register(helmet);
  
  // CORS for dashboard requests
  await server.register(cors, {
    origin: true,
    credentials: true,
  });
  
  await server.register(cookie);

  // Custom plugins (Redis, Prisma, Kafka)
  await registerPlugins(server);

  // Routes
  await registerRoutes(server);

  // Global error handler
  server.setErrorHandler(errorHandler);

  return server;
}
```

**Why Fastify Configuration Choices:**

| Setting | Value | Reasoning |
|---------|-------|-----------|
| `trustProxy: true` | Trust `X-Forwarded-*` headers | Required behind load balancer to get real client IP |
| `bodyLimit: 10MB` | Max request body size | Large enough for AI prompts, small enough to prevent abuse |
| `helmet` | Security headers | Prevents XSS, clickjacking, MIME sniffing |
| `cors.origin: true` | Allow all origins | Proxy is called from customer backends, not browsers |

### Auth Middleware

**File: `apps/proxy/src/middleware/auth.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import type { AuthenticatedRequest } from '../types';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // 1. Get API key from header
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    reply.status(401);
    throw new Error('Missing Authorization header');
  }

  // Support both "Bearer rg_xxx" and just "rg_xxx"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  // 2. Validate format
  if (!token.startsWith('rg_')) {
    reply.status(401);
    throw new Error('Invalid API key format');
  }

  // 3. Hash the token and look up
  const keyHash = createHash('sha256').update(token).digest('hex');

  const apiKey = await request.server.prisma.apiKey.findUnique({
    where: { keyHash },
    include: { workspace: true },
  });

  // 4. Validate existence
  if (!apiKey) {
    reply.status(401);
    throw new Error('Invalid API key');
  }

  // 5. Validate active status
  if (!apiKey.isActive) {
    reply.status(403);
    throw new Error('API key is disabled');
  }

  // 6. Validate expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    reply.status(403);
    throw new Error('API key has expired');
  }

  // 7. Update last used (fire and forget - don't block response)
  request.server.prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Ignore errors - non-critical
    });

  // 8. Attach to request for downstream use
  (request as AuthenticatedRequest).apiKey = apiKey;
}
```

**Security Considerations:**

| Aspect | Implementation | Why |
|--------|---------------|-----|
| Hash lookup | `SHA256(key)` → query | Never store plaintext keys |
| Timing attack | Hash before query | Same timing for invalid vs valid keys |
| Fire-and-forget lastUsedAt | Async update, ignore errors | Don't slow down requests for analytics |

### Rate Limit Middleware

**File: `apps/proxy/src/middleware/rate-limit.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { TokenBucket, SlidingWindow } from '@rateguard/rate-limiter';
import type { AuthenticatedRequest } from '../types';

export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const req = request as AuthenticatedRequest;
  const { apiKey } = req;

  // 1. Get rate limit rules for this workspace
  const rules = await request.server.prisma.rateLimitRule.findMany({
    where: {
      workspaceId: apiKey.workspaceId,
      isActive: true,
    },
    orderBy: { priority: 'desc' },  // Highest priority first
  });

  if (rules.length === 0) {
    return;  // No rules = allow everything
  }

  // 2. Find matching rule (endpoint pattern matching)
  const path = request.url;
  const matchingRule = rules.find((rule) => {
    if (rule.endpointPattern) {
      // Convert glob to regex: "/v1/chat/*" → /\/v1\/chat\/.*/
      const pattern = new RegExp(rule.endpointPattern.replace(/\*/g, '.*'));
      return pattern.test(path);
    }
    return true;  // Global rule (no pattern)
  });

  if (!matchingRule) {
    return;
  }

  // 3. Build Redis key based on scope
  let key = apiKey.workspaceId;
  
  switch (matchingRule.scope) {
    case 'PER_KEY':
      key = `${apiKey.workspaceId}:${apiKey.id}`;
      break;
    case 'PER_IP':
      key = `${apiKey.workspaceId}:${request.ip}`;
      break;
    case 'PER_WORKSPACE':
      key = apiKey.workspaceId;
      break;
    case 'GLOBAL':
      key = 'global';
      break;
  }

  // Add API ID if rule is API-specific
  if (matchingRule.apiId) {
    key = `${key}:${matchingRule.apiId}`;
  }

  // 4. Create rate limiter based on algorithm
  const config = {
    limit: matchingRule.limit,
    windowSeconds: matchingRule.windowSeconds,
    burstSize: matchingRule.burstSize || undefined,
  };

  let limiter;
  switch (matchingRule.algorithm) {
    case 'SLIDING_WINDOW':
      limiter = new SlidingWindow(request.server.redis, config);
      break;
    case 'TOKEN_BUCKET':
    default:
      limiter = new TokenBucket(request.server.redis, config);
      break;
  }

  // 5. Check rate limit
  const result = await limiter.check(key);

  // 6. Always add rate limit headers (even if allowed)
  reply.header('X-RateLimit-Limit', String(matchingRule.limit));
  reply.header('X-RateLimit-Remaining', String(result.remaining));
  reply.header('X-RateLimit-Reset', String(Math.floor(result.resetAt.getTime() / 1000)));

  // 7. Reject if over limit
  if (!result.allowed) {
    reply.header('Retry-After', String(Math.ceil((result.retryAfterMs || 1000) / 1000)));
    reply.status(429);
    
    throw {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      retryAfterMs: result.retryAfterMs,
      resetAt: result.resetAt.toISOString(),
    };
  }
}
```

### Proxy Route

**File: `apps/proxy/src/routes/proxy.ts`**

```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { budgetMiddleware } from '../middleware/budget';
import { UpstreamService } from '../services/upstream';
import { EventProducer } from '../services/event-producer';
import { randomUUID } from 'crypto';
import type { AuthenticatedRequest } from '../types';

export async function proxyRoutes(server: FastifyInstance) {
  const upstreamService = new UpstreamService();
  const eventProducer = new EventProducer(server.kafkaProducer);

  // Register middleware chain
  server.addHook('preHandler', authMiddleware);      // 1. Validate API key
  server.addHook('preHandler', rateLimitMiddleware); // 2. Check rate limits
  server.addHook('preHandler', budgetMiddleware);    // 3. Check budget

  // Catch-all route: /proxy/:apiSlug/*
  // Example: /proxy/openai/chat/completions
  server.all('/:apiSlug/*', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const eventId = randomUUID();
    const req = request as AuthenticatedRequest;

    const { apiSlug } = request.params as { apiSlug: string };
    const path = (request.params as { '*': string })['*'] || '';

    // 1. Load API configuration
    const api = await server.prisma.api.findFirst({
      where: {
        workspaceId: req.apiKey.workspaceId,
        slug: apiSlug,
        isActive: true,
      },
    });

    if (!api) {
      reply.status(404);
      return {
        error: {
          code: 'API_NOT_FOUND',
          message: `API "${apiSlug}" not found or not active`,
        },
      };
    }

    // 2. Build upstream URL
    const upstreamUrl = `${api.baseUrl}/${path}`;

    try {
      // 3. Forward request to upstream
      const response = await upstreamService.forward({
        method: request.method,
        url: upstreamUrl,
        headers: request.headers as Record<string, string>,
        body: request.body,
        timeoutMs: api.timeoutMs,
      });

      // 4. Calculate cost from response
      const costCents = calculateCost(api.costModel as any, request, response);

      // 5. Send event to Kafka (async, non-blocking)
      await eventProducer.sendRequestEvent({
        event_id: eventId,
        timestamp: new Date().toISOString(),
        workspace_id: req.apiKey.workspaceId,
        api_key_id: req.apiKey.id,
        api_id: api.id,
        endpoint: `/${apiSlug}/${path}`,
        method: request.method,
        status_code: response.status,
        latency_ms: Date.now() - startTime,
        upstream_latency_ms: response.latencyMs,
        cost_cents: costCents,
        cache_hit: false,
        rate_limited: false,
      });

      // 6. Set response headers
      reply.status(response.status);
      reply.header('X-RateGuard-Request-Id', eventId);
      reply.header('X-RateGuard-Cost-Cents', String(costCents));
      reply.header('X-RateGuard-Latency-Ms', String(Date.now() - startTime));

      // Forward content-type from upstream
      if (response.headers['content-type']) {
        reply.header('content-type', response.headers['content-type']);
      }

      return response.body;
      
    } catch (error: any) {
      // Log error event
      await eventProducer.sendRequestEvent({
        event_id: eventId,
        timestamp: new Date().toISOString(),
        workspace_id: req.apiKey.workspaceId,
        api_key_id: req.apiKey.id,
        api_id: api.id,
        endpoint: `/${apiSlug}/${path}`,
        method: request.method,
        status_code: error.statusCode || 502,
        latency_ms: Date.now() - startTime,
        upstream_latency_ms: 0,
        cost_cents: 0,
        cache_hit: false,
        rate_limited: false,
        error_type: error.code || 'UPSTREAM_ERROR',
      });

      throw error;
    }
  });
}

function calculateCost(
  costModel: { type: string; config: Record<string, any> },
  request: FastifyRequest,
  response: { body: any }
): number {
  if (!costModel) return 0;

  switch (costModel.type) {
    case 'PER_REQUEST':
      return costModel.config.costCents || 0;

    case 'PER_TOKEN':
      // Parse OpenAI-style response
      try {
        const body = typeof response.body === 'string' 
          ? JSON.parse(response.body) 
          : response.body;
        
        if (body?.usage) {
          const promptTokens = body.usage.prompt_tokens || 0;
          const completionTokens = body.usage.completion_tokens || 0;
          const model = body.model || 'gpt-3.5-turbo';
          
          // Get rate for this model
          const rates = costModel.config[model] || { input: 0.001, output: 0.002 };
          
          // Calculate cost in cents
          return Math.ceil(
            (promptTokens * rates.input + completionTokens * rates.output) * 100
          );
        }
      } catch {
        // Not JSON or no usage info
      }
      return 0;

    default:
      return 0;
  }
}
```

---

## 4. Web Dashboard Code

### API Routes

**File: `apps/web/src/app/api/keys/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth } from '@/lib/auth-middleware';
import crypto from 'crypto';

// Generate a secure API key
function generateApiKey(): { key: string; hash: string; prefix: string } {
  // Format: rg_{24 random bytes as base64url}
  // Example: rg_K7dF9xQ2mN8bV3hJ5wR1tY6uI0oP4lA2
  const key = `rg_${crypto.randomBytes(24).toString('base64url')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 12);
  return { key, hash, prefix };
}

// GET /api/keys - List all API keys
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId: auth.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    // SECURITY: Never expose the full key hash
    const safeKeys = keys.map(key => ({
      id: key.id,
      name: key.name,
      prefix: key.keyPrefix,  // Only show prefix
      isActive: key.isActive,
      scopes: key.scopes,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));

    return NextResponse.json({ keys: safeKeys });
  } catch (error) {
    console.error('Error fetching keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes, expiresAt } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Generate the key
    const { key, hash, prefix } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId: auth.workspaceId,
        name,
        keyHash: hash,      // Only hash is stored
        keyPrefix: prefix,   // For display
        scopes: scopes || ['*'],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    // CRITICAL: Return full key ONLY on creation
    // This is the only time the user will see it
    return NextResponse.json({
      key: {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.keyPrefix,
        fullKey: key,  // ⚠️ Only returned once!
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
      warning: 'Save this key now! It will not be shown again.',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### React Components

**File: `apps/web/src/components/dashboard/stats-cards.tsx`**

```tsx
'use client';

import { Activity, DollarSign, Gauge, AlertTriangle, Server, Key } from 'lucide-react';
import { useStats } from '@/hooks/use-api-data';

export function StatsCards() {
  const { data, isLoading, error } = useStats();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card border-red-200 dark:border-red-800 bg-red-50">
        <p className="text-red-600">Failed to load stats: {error}</p>
      </div>
    );
  }

  const stats = data?.stats || {
    apis: { total: 0, active: 0 },
    keys: { total: 0, active: 0 },
    rules: { total: 0, active: 0 },
    alerts: { total: 0, active: 0 },
  };

  const cardData = [
    {
      name: 'Total APIs',
      value: stats.apis?.total || 0,
      subtext: `${stats.apis?.active || 0} active`,
      icon: Server,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      name: 'API Keys',
      value: stats.keys?.total || 0,
      subtext: `${stats.keys?.active || 0} active`,
      icon: Key,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      name: 'Rate Limit Rules',
      value: stats.rules?.total || 0,
      subtext: `${stats.rules?.active || 0} active`,
      icon: Gauge,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      name: 'Active Alerts',
      value: stats.alerts?.active || 0,
      subtext: `${stats.alerts?.total || 0} total configured`,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cardData.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className="card">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <span className="text-sm text-gray-500">{stat.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 5. Analytics Pipeline

### ClickHouse Schema

**File: `docker/clickhouse/init.sql`**

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS rateguard;
USE rateguard;

-- Main events table
CREATE TABLE IF NOT EXISTS api_events (
    event_id UUID,
    timestamp DateTime64(3),  -- Millisecond precision
    
    -- Relations
    workspace_id UUID,
    api_key_id UUID,
    api_id UUID,
    
    -- Request
    endpoint LowCardinality(String),  -- Optimized for repeated values
    method LowCardinality(String),
    
    -- Response
    status_code UInt16,
    
    -- Timing (milliseconds)
    latency_ms UInt32,
    upstream_latency_ms UInt32,
    rate_limit_check_ms UInt16,
    cache_check_ms UInt16,
    
    -- Size
    request_bytes UInt32,
    response_bytes UInt32,
    
    -- Cost (cents)
    cost_cents UInt32,
    
    -- Token usage (AI APIs)
    prompt_tokens UInt32 DEFAULT 0,
    completion_tokens UInt32 DEFAULT 0,
    
    -- Flags
    cache_hit UInt8 DEFAULT 0,
    rate_limited UInt8 DEFAULT 0,
    
    -- Error
    error_type LowCardinality(String) DEFAULT '',
    
    -- Derived (for partitioning)
    date Date DEFAULT toDate(timestamp)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)           -- Monthly partitions
ORDER BY (workspace_id, api_id, timestamp)  -- Optimized for common queries
TTL date + INTERVAL 90 DAY            -- Auto-delete after 90 days
SETTINGS index_granularity = 8192;

-- Materialized view for hourly aggregations
-- Automatically updated as events are inserted
CREATE MATERIALIZED VIEW IF NOT EXISTS api_events_hourly_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (workspace_id, api_id, endpoint, hour)
AS SELECT
    workspace_id,
    api_id,
    endpoint,
    toStartOfHour(timestamp) AS hour,
    
    count() AS request_count,
    sum(cost_cents) AS total_cost_cents,
    
    sum(latency_ms) AS sum_latency_ms,
    min(latency_ms) AS min_latency_ms,
    max(latency_ms) AS max_latency_ms,
    
    countIf(status_code >= 200 AND status_code < 300) AS success_2xx,
    countIf(status_code >= 400 AND status_code < 500) AS client_error_4xx,
    countIf(status_code >= 500) AS server_error_5xx,
    
    countIf(cache_hit = 1) AS cache_hits,
    countIf(rate_limited = 1) AS rate_limit_hits,
    
    sum(prompt_tokens) AS total_prompt_tokens,
    sum(completion_tokens) AS total_completion_tokens
FROM api_events
GROUP BY workspace_id, api_id, endpoint, hour;
```

**Why ClickHouse?**

```
┌─────────────────────────────────────────────────────────────┐
│           CLICKHOUSE vs POSTGRESQL FOR ANALYTICS            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Query: SELECT sum(cost), count(*) FROM events              │
│         WHERE workspace_id = ? AND date > '2024-01-01'      │
│                                                              │
│  PostgreSQL (row-oriented):                                 │
│  ┌─────────────────────────────────────────────┐            │
│  │ id │ ws_id │ api │ cost │ method │ status │ ...│        │
│  │ 1  │ abc   │ x   │ 5    │ POST   │ 200    │ ...│        │
│  │ 2  │ abc   │ y   │ 3    │ GET    │ 200    │ ...│        │
│  └─────────────────────────────────────────────┘            │
│  → Reads ALL columns, even unused ones                      │
│  → 1M rows × 50 columns = lots of I/O                       │
│                                                              │
│  ClickHouse (column-oriented):                              │
│  ┌──────────┐ ┌──────────┐                                  │
│  │ cost     │ │ ws_id    │                                  │
│  │ 5        │ │ abc      │                                  │
│  │ 3        │ │ abc      │                                  │
│  └──────────┘ └──────────┘                                  │
│  → Reads ONLY columns needed (cost, ws_id)                  │
│  → Highly compressed (same values grouped)                  │
│  → 10-100x faster for aggregations                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Kafka Consumer

**File: `apps/analytics/src/index.ts`**

```typescript
import { Kafka, Consumer } from 'kafkajs';
import { createClient } from '@rateguard/analytics';
import { logger } from './health';
import { processEvent } from './processor';

const config = {
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    topic: process.env.KAFKA_TOPIC || 'api-events',
    groupId: 'rateguard-analytics',
  },
  clickhouse: {
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    database: process.env.CLICKHOUSE_DATABASE || 'rateguard',
  },
  batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),
  flushInterval: parseInt(process.env.FLUSH_INTERVAL || '5000', 10),
};

async function main() {
  logger.info('Starting analytics service...');

  // Initialize ClickHouse client
  const clickhouse = createClient(config.clickhouse);
  
  // Test connection
  const healthy = await clickhouse.ping();
  if (!healthy) {
    logger.error('Failed to connect to ClickHouse');
    process.exit(1);
  }
  logger.info('Connected to ClickHouse');

  // Initialize Kafka consumer
  const kafka = new Kafka({
    clientId: 'rateguard-analytics',
    brokers: config.kafka.brokers,
  });

  const consumer = kafka.consumer({ groupId: config.kafka.groupId });
  await consumer.connect();
  logger.info('Connected to Kafka');

  await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });

  // Event buffer for batch inserts
  const buffer: any[] = [];
  let flushTimeout: NodeJS.Timeout | null = null;

  const flush = async () => {
    if (buffer.length === 0) return;

    const events = [...buffer];
    buffer.length = 0;

    try {
      await clickhouse.insert('api_events', events);
      logger.info({ count: events.length }, 'Flushed events to ClickHouse');
    } catch (error) {
      logger.error({ error, count: events.length }, 'Failed to flush events');
      // Re-add to buffer for retry (with limit to prevent memory issues)
      if (buffer.length < 10000) {
        buffer.push(...events);
      }
    }
  };

  const scheduleFlush = () => {
    if (flushTimeout) return;
    flushTimeout = setTimeout(async () => {
      flushTimeout = null;
      await flush();
    }, config.flushInterval);
  };

  // Process messages
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const event = JSON.parse(message.value.toString());
        const processed = processEvent(event);
        
        buffer.push(processed);

        // Flush if buffer is full
        if (buffer.length >= config.batchSize) {
          await flush();
        } else {
          scheduleFlush();
        }
      } catch (error) {
        logger.error({ error }, 'Failed to process message');
      }
    },
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    
    if (flushTimeout) {
      clearTimeout(flushTimeout);
    }
    
    await flush();  // Flush remaining events
    await consumer.disconnect();
    await clickhouse.close();
    
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  logger.info('Analytics service running');
}

main().catch((error) => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
```

**Why Batch Inserts?**

| Approach | Inserts/sec | Latency | Why |
|----------|-------------|---------|-----|
| Insert per event | 1,000 | High | Network overhead per insert |
| Batch (100 events) | 50,000 | Low | One network call for 100 events |
| Batch (1000 events) | 100,000+ | Medium | Even more efficient |

> "ClickHouse is optimized for batch inserts. Inserting one row at a time wastes network and disk I/O. We buffer 100 events or 5 seconds (whichever comes first), then insert as a batch. This gives us 50-100x better throughput."

---

---

## 6. Infrastructure Configuration

### Docker Compose (Development)

**File: `docker/docker-compose.yml`**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: rateguard
      POSTGRES_PASSWORD: rateguard
      POSTGRES_DB: rateguard
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rateguard"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  clickhouse:
    image: clickhouse/clickhouse-server:24.1
    ports:
      - "8123:8123"   # HTTP interface
      - "9000:9000"   # Native interface
    volumes:
      - clickhouse_data:/var/lib/clickhouse
      - ./clickhouse/init.sql:/docker-entrypoint-initdb.d/init.sql
    ulimits:
      nofile:
        soft: 262144
        hard: 262144

  redpanda:
    image: redpandadata/redpanda:v24.1.1
    command:
      - redpanda start
      - --smp 1
      - --memory 1G
      - --reserve-memory 0M
      - --overprovisioned
      - --kafka-addr 0.0.0.0:9092
      - --advertise-kafka-addr localhost:9092
    ports:
      - "9092:9092"   # Kafka API
      - "8081:8081"   # Schema Registry
      - "8082:8082"   # REST Proxy
    volumes:
      - redpanda_data:/var/lib/redpanda/data

volumes:
  postgres_data:
  redis_data:
  clickhouse_data:
  redpanda_data:
```

**Why Redpanda instead of Kafka?**

| Feature | Apache Kafka | Redpanda |
|---------|--------------|----------|
| **Java dependency** | Yes | No (C++) |
| **Zookeeper** | Required (older) | Not needed |
| **Memory** | 2-4GB minimum | 1GB works |
| **Startup time** | 30-60s | 5-10s |
| **Kafka API** | Native | 100% compatible |

> "Redpanda is a drop-in Kafka replacement that's much lighter for development. Same API, less resource usage. In production, we'd use Confluent Cloud or AWS MSK."

---

### Kubernetes Configuration (Production)

The `k8s/` directory contains production-ready Kubernetes manifests.

#### Namespace

**File: `k8s/namespace.yaml`**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: rateguard
  labels:
    app.kubernetes.io/name: rateguard
    app.kubernetes.io/managed-by: kubectl
```

#### Proxy Deployment (with HPA)

**File: `k8s/deployments/proxy.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: proxy
  namespace: rateguard
spec:
  replicas: 3  # HPA manages this
  selector:
    matchLabels:
      app: proxy
  template:
    spec:
      containers:
        - name: proxy
          image: rateguard/proxy:latest
          ports:
            - containerPort: 3001
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                topologyKey: kubernetes.io/hostname
                labelSelector:
                  matchLabels:
                    app: proxy
```

**Key Design Decisions:**

| Setting | Value | Reasoning |
|---------|-------|-----------|
| `replicas: 3` | Minimum replicas | Ensures availability during node failures |
| `requests.cpu: 250m` | 0.25 CPU | Baseline for scheduling |
| `limits.cpu: 1000m` | 1 CPU | Allow burst, prevent runaway |
| `livenessProbe` | `/health` | Restart crashed pods |
| `readinessProbe` | `/health` | Don't route traffic until ready |
| `podAntiAffinity` | Spread across nodes | High availability |

#### Horizontal Pod Autoscaler

**File: `k8s/hpa/autoscaling.yaml`**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: proxy-hpa
  namespace: rateguard
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: proxy
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 15
      policies:
        - type: Pods
          value: 2
          periodSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

**Scaling Behavior Explained:**

```
┌─────────────────────────────────────────────────────────────┐
│                    HPA SCALING BEHAVIOR                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SCALE UP (CPU > 70%):                                      │
│  • Stabilization: 15 seconds (react quickly)                │
│  • Add: 2 pods every 30 seconds                             │
│  • Max: 20 pods                                             │
│                                                              │
│  SCALE DOWN (CPU < 70%):                                    │
│  • Stabilization: 5 minutes (avoid flapping)                │
│  • Remove: 10% of pods every 60 seconds                     │
│  • Min: 3 pods                                              │
│                                                              │
│  WHY ASYMMETRIC?                                            │
│  Scale up fast (protect user experience)                    │
│  Scale down slow (avoid thrashing, save resources)          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Ingress

**File: `k8s/ingress/ingress.yaml`**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rateguard-ingress
  namespace: rateguard
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - rateguard.example.com
        - api.rateguard.example.com
      secretName: rateguard-tls
  rules:
    - host: rateguard.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 3000
    - host: api.rateguard.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: proxy
                port:
                  number: 3001
```

**Ingress Annotations Explained:**

| Annotation | Purpose |
|------------|---------|
| `ssl-redirect: true` | Force HTTPS |
| `proxy-body-size: 10m` | Allow large API payloads |
| `proxy-read-timeout: 60` | Handle slow upstream APIs |

---

This completes the code deep dive documentation. See also:
- [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) - Architecture & design decisions
- [03-INTERVIEW-DEFENSE.md](./03-INTERVIEW-DEFENSE.md) - Interview preparation
- [06-KUBERNETES-DEPLOYMENT.md](./06-KUBERNETES-DEPLOYMENT.md) - Kubernetes deployment guide

