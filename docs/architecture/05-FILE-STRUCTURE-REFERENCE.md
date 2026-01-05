# RateGuard - Complete File Structure Reference

## Quick Navigation

| File | Purpose | Key Functions |
|------|---------|---------------|
| `packages/db/prisma/schema.prisma` | Database schema | All models |
| `packages/rate-limiter/src/algorithms/token-bucket.ts` | Token bucket rate limiter | `check()` |
| `packages/rate-limiter/src/lua/token-bucket.lua` | Atomic rate limit script | Lua |
| `apps/proxy/src/server.ts` | Fastify server setup | `buildServer()` |
| `apps/proxy/src/middleware/auth.ts` | API key validation | `authMiddleware()` |
| `apps/proxy/src/middleware/rate-limit.ts` | Rate limit check | `rateLimitMiddleware()` |
| `apps/proxy/src/routes/proxy.ts` | Main proxy logic | `/proxy/:apiSlug/*` |
| `apps/web/src/app/api/keys/route.ts` | API key management | `GET`, `POST` |
| `apps/analytics/src/index.ts` | Kafka consumer | Event processing |
| `docker/docker-compose.yml` | Development infrastructure | PostgreSQL, Redis, Kafka, ClickHouse |
| `docker/clickhouse/init.sql` | ClickHouse schema | Analytics tables |
| `k8s/deployments/proxy.yaml` | Kubernetes proxy deployment | HPA, probes, affinity |
| `k8s/hpa/autoscaling.yaml` | Horizontal Pod Autoscaler | Auto-scaling config |

---

## Complete File Tree with Descriptions

```
rateguard/
├── 📁 apps/
│   │
│   ├── 📁 web/                              # Next.js Dashboard (Port 3000)
│   │   ├── Dockerfile                       # Container build
│   │   ├── next.config.js                   # Next.js config
│   │   ├── package.json
│   │   ├── postcss.config.js                # CSS processing
│   │   ├── tailwind.config.ts               # Tailwind CSS config
│   │   ├── tsconfig.json
│   │   └── 📁 src/
│   │       ├── 📁 app/                      # Next.js App Router
│   │       │   ├── globals.css              # Global styles
│   │       │   ├── layout.tsx               # Root layout
│   │       │   ├── page.tsx                 # Landing page (/)
│   │       │   │
│   │       │   ├── 📁 (auth)/               # Auth route group
│   │       │   │   ├── layout.tsx           # Auth layout (centered)
│   │       │   │   ├── 📁 login/
│   │       │   │   │   └── page.tsx         # Login form
│   │       │   │   └── 📁 register/
│   │       │   │       └── page.tsx         # Registration form
│   │       │   │
│   │       │   ├── 📁 api/                  # API Routes (Backend)
│   │       │   │   ├── 📁 auth/
│   │       │   │   │   ├── 📁 login/
│   │       │   │   │   │   └── route.ts     # POST: Authenticate user
│   │       │   │   │   ├── 📁 logout/
│   │       │   │   │   │   └── route.ts     # POST: Clear session
│   │       │   │   │   ├── 📁 me/
│   │       │   │   │   │   └── route.ts     # GET: Current user
│   │       │   │   │   └── 📁 register/
│   │       │   │   │       └── route.ts     # POST: Create account
│   │       │   │   │
│   │       │   │   ├── 📁 apis/
│   │       │   │   │   ├── route.ts         # GET: List, POST: Create
│   │       │   │   │   └── 📁 [id]/
│   │       │   │   │       └── route.ts     # GET/PATCH/DELETE by ID
│   │       │   │   │
│   │       │   │   ├── 📁 keys/
│   │       │   │   │   ├── route.ts         # GET: List, POST: Create
│   │       │   │   │   └── 📁 [id]/
│   │       │   │   │       └── route.ts     # DELETE: Revoke
│   │       │   │   │
│   │       │   │   ├── 📁 rules/
│   │       │   │   │   ├── route.ts         # Rate limit rules
│   │       │   │   │   └── 📁 [id]/
│   │       │   │   │       └── route.ts
│   │       │   │   │
│   │       │   │   ├── 📁 alerts/
│   │       │   │   │   ├── route.ts
│   │       │   │   │   └── 📁 [id]/
│   │       │   │   │       └── route.ts
│   │       │   │   │
│   │       │   │   ├── 📁 stats/
│   │       │   │   │   └── route.ts         # GET: Dashboard stats
│   │       │   │   │
│   │       │   │   └── 📁 health/
│   │       │   │       └── route.ts         # GET: Health check
│   │       │   │
│   │       │   └── 📁 dashboard/            # Dashboard Pages
│   │       │       ├── layout.tsx           # Dashboard layout with sidebar
│   │       │       ├── page.tsx             # Overview page
│   │       │       │
│   │       │       ├── 📁 apis/
│   │       │       │   ├── page.tsx         # API list
│   │       │       │   ├── 📁 new/
│   │       │       │   │   └── page.tsx     # Create API form
│   │       │       │   └── 📁 [id]/
│   │       │       │       └── page.tsx     # Edit API form
│   │       │       │
│   │       │       ├── 📁 keys/
│   │       │       │   └── page.tsx         # API keys management
│   │       │       │
│   │       │       ├── 📁 limits/
│   │       │       │   └── page.tsx         # Rate limit rules
│   │       │       │
│   │       │       ├── 📁 analytics/
│   │       │       │   └── page.tsx         # Analytics charts
│   │       │       │
│   │       │       ├── 📁 costs/
│   │       │       │   └── page.tsx         # Cost tracking
│   │       │       │
│   │       │       ├── 📁 alerts/
│   │       │       │   └── page.tsx         # Alert configuration
│   │       │       │
│   │       │       └── 📁 settings/
│   │       │           └── page.tsx         # Workspace settings
│   │       │
│   │       ├── 📁 components/
│   │       │   ├── 📁 dashboard/
│   │       │   │   ├── alerts-panel.tsx     # Recent alerts display
│   │       │   │   ├── cost-chart.tsx       # Cost bar chart
│   │       │   │   ├── header.tsx           # Top header bar
│   │       │   │   ├── rate-limit-gauge.tsx # Usage gauge
│   │       │   │   ├── request-chart.tsx    # Request line chart
│   │       │   │   ├── request-log.tsx      # Recent requests table
│   │       │   │   ├── sidebar.tsx          # Navigation sidebar
│   │       │   │   └── stats-cards.tsx      # KPI cards
│   │       │   │
│   │       │   ├── 📁 forms/
│   │       │   │   ├── alert-form.tsx       # Alert creation form
│   │       │   │   ├── api-form.tsx         # API configuration form
│   │       │   │   ├── api-key-form.tsx     # API key creation
│   │       │   │   └── rate-limit-form.tsx  # Rate limit rule form
│   │       │   │
│   │       │   ├── 📁 providers/
│   │       │   │   ├── auth-provider.tsx    # Auth context provider
│   │       │   │   ├── query-provider.tsx   # React Query provider
│   │       │   │   └── websocket-provider.tsx
│   │       │   │
│   │       │   └── 📁 ui/
│   │       │       ├── badge.tsx            # Status badges
│   │       │       ├── button.tsx           # Button variants
│   │       │       ├── card.tsx             # Card container
│   │       │       ├── dialog.tsx           # Modal dialogs
│   │       │       ├── dropdown.tsx         # Dropdown menus
│   │       │       ├── input.tsx            # Form inputs
│   │       │       ├── skeleton.tsx         # Loading skeletons
│   │       │       ├── table.tsx            # Data tables
│   │       │       └── toast.tsx            # Notifications
│   │       │
│   │       ├── 📁 context/
│   │       │   └── auth-context.tsx         # Auth context definition
│   │       │
│   │       ├── 📁 hooks/
│   │       │   ├── use-alerts.ts            # Alerts data hook
│   │       │   ├── use-analytics.ts         # Analytics data hook
│   │       │   ├── use-api-data.ts          # Generic API hook
│   │       │   ├── use-apis.ts              # APIs data hook
│   │       │   ├── use-auth.ts              # Auth hook
│   │       │   └── use-websocket.ts         # WebSocket hook
│   │       │
│   │       ├── 📁 lib/
│   │       │   ├── api-client.ts            # API call wrapper
│   │       │   ├── api.ts                   # API utilities
│   │       │   ├── auth-middleware.ts       # JWT verification
│   │       │   ├── auth.ts                  # Auth helpers
│   │       │   ├── config.ts                # App config
│   │       │   ├── constants.ts             # Constants
│   │       │   ├── db.ts                    # Prisma instance
│   │       │   └── utils.ts                 # Utility functions
│   │       │
│   │       └── 📁 types/
│   │           └── index.ts                 # TypeScript types
│   │
│   ├── 📁 proxy/                            # Fastify Proxy (Port 3001)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── 📁 src/
│   │       ├── index.ts                     # Entry point
│   │       ├── server.ts                    # Fastify server setup
│   │       │
│   │       ├── 📁 lib/
│   │       │   ├── config.ts                # Environment config
│   │       │   ├── crypto.ts                # Encryption utilities
│   │       │   └── logger.ts                # Pino logger setup
│   │       │
│   │       ├── 📁 middleware/
│   │       │   ├── auth.ts                  # API key validation
│   │       │   ├── budget.ts                # Budget enforcement
│   │       │   ├── error-handler.ts         # Global error handler
│   │       │   ├── index.ts                 # Middleware exports
│   │       │   └── rate-limit.ts            # Rate limit check
│   │       │
│   │       ├── 📁 plugins/
│   │       │   ├── index.ts                 # Plugin registration
│   │       │   ├── kafka.ts                 # Kafka producer plugin
│   │       │   ├── prisma.ts                # Database plugin
│   │       │   └── redis.ts                 # Redis plugin
│   │       │
│   │       ├── 📁 routes/
│   │       │   ├── health.ts                # Health check routes
│   │       │   ├── index.ts                 # Route registration
│   │       │   └── proxy.ts                 # Main proxy route
│   │       │
│   │       ├── 📁 services/
│   │       │   ├── budget-tracker.ts        # Budget management
│   │       │   ├── cache.ts                 # Response caching
│   │       │   ├── event-producer.ts        # Kafka event sending
│   │       │   ├── index.ts                 # Service exports
│   │       │   ├── rate-limiter.ts          # Rate limit logic
│   │       │   └── upstream.ts              # Upstream forwarding
│   │       │
│   │       ├── 📁 types/
│   │       │   └── index.ts                 # Type definitions
│   │       │
│   │       └── 📁 websocket/
│   │           ├── handlers.ts              # WebSocket handlers
│   │           ├── index.ts                 # WebSocket exports
│   │           └── server.ts                # WebSocket server
│   │
│   ├── 📁 analytics/                        # Event Processor
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── 📁 src/
│   │       ├── consumer.ts                  # Kafka consumer
│   │       ├── health.ts                    # Health check
│   │       ├── index.ts                     # Entry point
│   │       └── processor.ts                 # Event transformation
│   │
│   └── 📁 alerts/                           # Alert Service
│       ├── package.json
│       ├── tsconfig.json
│       └── 📁 src/
│           ├── actions.ts                   # Alert actions
│           ├── evaluator.ts                 # Condition evaluation
│           ├── index.ts                     # Entry point
│           └── notifier.ts                  # Notification sending
│
├── 📁 packages/
│   │
│   ├── 📁 db/                               # Database Package
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── 📁 prisma/
│   │   │   ├── schema.prisma                # ⭐ DATABASE SCHEMA
│   │   │   └── seed.ts                      # Seed data script
│   │   └── 📁 src/
│   │       └── index.ts                     # Prisma client export
│   │
│   ├── 📁 rate-limiter/                     # Rate Limiting Package
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts                 # Test config
│   │   ├── 📁 src/
│   │   │   ├── index.ts                     # Package exports
│   │   │   ├── 📁 algorithms/
│   │   │   │   ├── index.ts                 # Algorithm exports
│   │   │   │   ├── sliding-window.ts        # ⭐ SLIDING WINDOW
│   │   │   │   └── token-bucket.ts          # ⭐ TOKEN BUCKET
│   │   │   └── 📁 lua/
│   │   │       ├── sliding-window.lua       # ⭐ ATOMIC SCRIPT
│   │   │       └── token-bucket.lua         # ⭐ ATOMIC SCRIPT
│   │   └── 📁 tests/
│   │       ├── sliding-window.test.ts       # Algorithm tests
│   │       └── token-bucket.test.ts
│   │
│   ├── 📁 analytics/                        # ClickHouse Client
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── 📁 src/
│   │       ├── client.ts                    # ClickHouse connection
│   │       ├── index.ts                     # Package exports
│   │       └── queries.ts                   # Analytics queries
│   │
│   └── 📁 shared/                           # Shared Utilities
│       ├── package.json
│       ├── tsconfig.json
│       └── 📁 src/
│           ├── index.ts                     # Package exports
│           ├── 📁 constants/
│           │   └── index.ts                 # App constants
│           ├── 📁 schemas/
│           │   ├── api.ts                   # API validation
│           │   ├── auth.ts                  # Auth validation
│           │   ├── index.ts                 # Schema exports
│           │   └── rate-limit.ts            # Rate limit validation
│           ├── 📁 types/
│           │   ├── api.ts                   # API types
│           │   ├── auth.ts                  # Auth types
│           │   ├── events.ts                # Event types
│           │   ├── index.ts                 # Type exports
│           │   └── rate-limit.ts            # Rate limit types
│           └── 📁 utils/
│               ├── crypto.ts                # Crypto utilities
│               ├── errors.ts                # Error classes
│               ├── index.ts                 # Util exports
│               └── validation.ts            # Validation helpers
│
├── 📁 docker/                               # Infrastructure (Development)
│   ├── docker-compose.yml                   # ⭐ DEV SERVICES
│   ├── docker-compose.prod.yml              # Production config
│   └── 📁 clickhouse/
│       └── init.sql                         # ⭐ ANALYTICS SCHEMA
│
├── 📁 k8s/                                  # Infrastructure (Production/Kubernetes)
│   ├── namespace.yaml                       # rateguard namespace
│   ├── README.md                            # Deployment guide
│   │
│   ├── 📁 configmaps/                       # Non-sensitive config
│   │   └── rateguard-config.yaml            # Environment variables
│   │
│   ├── 📁 secrets/                          # Sensitive credentials
│   │   └── rateguard-secrets.yaml           # ⚠️ Template only (use External Secrets in prod)
│   │
│   ├── 📁 databases/                        # StatefulSets for databases
│   │   ├── postgres.yaml                    # PostgreSQL + PVC
│   │   ├── redis.yaml                       # Redis + PVC
│   │   ├── clickhouse.yaml                  # ClickHouse + init.sql
│   │   └── redpanda.yaml                    # Kafka-compatible streaming
│   │
│   ├── 📁 deployments/                      # Application workloads
│   │   ├── web.yaml                         # ⭐ Next.js Dashboard
│   │   ├── proxy.yaml                       # ⭐ Fastify Proxy (auto-scaled)
│   │   ├── analytics.yaml                   # Kafka consumer
│   │   └── alerts.yaml                      # Alert evaluation
│   │
│   ├── 📁 services/                         # Kubernetes Services
│   │   ├── web.yaml                         # ClusterIP for dashboard
│   │   └── proxy.yaml                       # ClusterIP for proxy
│   │
│   ├── 📁 ingress/                          # External Access
│   │   └── ingress.yaml                     # NGINX Ingress (TLS, routing)
│   │
│   └── 📁 hpa/                              # Auto-scaling
│       └── autoscaling.yaml                 # ⭐ Proxy HPA (3-20 replicas)
│
├── 📁 scripts/                              # Automation
│   ├── dev.sh                               # Start development
│   ├── seed.ts                              # Seed database
│   └── setup.sh                             # Initial setup
│
├── 📁 docs/                                 # Documentation
│   ├── README.md                            # Documentation index
│   ├── 01-PROJECT-OVERVIEW.md               # Architecture & design
│   ├── 02-CODE-DEEP-DIVE.md                 # Code explanations
│   ├── 03-INTERVIEW-DEFENSE.md              # Interview preparation
│   ├── 04-PHASE1-BUILD-PROMPTS.md           # Build prompts
│   ├── 05-FILE-STRUCTURE-REFERENCE.md       # This document
│   └── 06-KUBERNETES-DEPLOYMENT.md          # Kubernetes guide
│
├── .github/
│   └── 📁 workflows/                        # CI/CD
│
├── package.json                             # Root package.json
├── pnpm-workspace.yaml                      # Monorepo config
├── pnpm-lock.yaml                           # Lock file
├── tsconfig.json                            # Root TS config
├── env.example.txt                          # Environment template
└── README.md                                # Project readme
```

---

## Key Files Deep Dive

### 1. Database Schema
**File:** `packages/db/prisma/schema.prisma`

```prisma
// Core models:
model User          // Authentication
model Workspace     // Multi-tenancy
model WorkspaceMember // Roles
model Api           // Upstream API configs
model ApiKey        // Client authentication
model RateLimitRule // Rate limiting
model Alert         // Notifications
```

### 2. Token Bucket Algorithm
**File:** `packages/rate-limiter/src/algorithms/token-bucket.ts`

```typescript
class TokenBucket {
  async check(key: string, cost = 1): Promise<RateLimitResult>
  // Executes Lua script atomically in Redis
}
```

### 3. Proxy Route
**File:** `apps/proxy/src/routes/proxy.ts`

```typescript
// Route: ALL /proxy/:apiSlug/*
// Middleware chain: auth → rateLimit → budget
// Forward to upstream, extract cost, log event
```

### 4. API Key Creation
**File:** `apps/web/src/app/api/keys/route.ts`

```typescript
// POST /api/keys
// Generate key, hash with SHA256
// Store hash (not plaintext)
// Return full key ONCE
```

### 5. ClickHouse Schema
**File:** `docker/clickhouse/init.sql`

```sql
-- Main events table with TTL
-- Materialized views for aggregations:
-- - api_events_hourly_mv
-- - daily_costs_mv
-- - error_breakdown_mv
```

---

## Import Paths

```typescript
// From any app, import shared packages:
import { prisma } from '@rateguard/db';
import { TokenBucket, SlidingWindow } from '@rateguard/rate-limiter';
import { createClient } from '@rateguard/analytics';
import { hashPassword, generateApiKey } from '@rateguard/shared';
```

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/rateguard"

# Redis
REDIS_URL="redis://localhost:6379"

# Kafka
KAFKA_BROKERS="localhost:9092"
KAFKA_TOPIC="api-events"

# ClickHouse
CLICKHOUSE_URL="http://localhost:8123"
CLICKHOUSE_DATABASE="rateguard"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Encryption (for API credentials)
ENCRYPTION_KEY="32-byte-hex-key"

# Ports
WEB_PORT=3000
PROXY_PORT=3001
```

---

## Quick Commands

```bash
# Development
pnpm install              # Install all dependencies
pnpm docker:up            # Start PostgreSQL, Redis, Kafka, ClickHouse
pnpm db:push              # Push schema to database
pnpm db:seed              # Seed with test data
pnpm dev                  # Start all services

# Individual services
pnpm dev:web              # Dashboard only
pnpm dev:proxy            # Proxy only
pnpm dev:analytics        # Analytics consumer only

# Database
pnpm db:studio            # Prisma Studio (GUI)
pnpm db:generate          # Generate Prisma client

# Testing
pnpm test                 # Run all tests
cd packages/rate-limiter && pnpm test  # Rate limiter tests only

# Docker
pnpm docker:down          # Stop containers
pnpm docker:logs          # View logs
```

---

## Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Web Dashboard | 3000 | HTTP |
| Proxy Server | 3001 | HTTP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Kafka (Redpanda) | 9092 | TCP |
| Kafka Console | 8080 | HTTP |
| ClickHouse HTTP | 8123 | HTTP |
| ClickHouse Native | 9000 | TCP |

---

## API Endpoints Summary

### Web Dashboard API (`/api/*`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Authenticate |
| POST | /api/auth/logout | Clear session |
| GET | /api/auth/me | Current user |
| GET | /api/apis | List APIs |
| POST | /api/apis | Create API |
| GET | /api/apis/:id | Get API |
| PATCH | /api/apis/:id | Update API |
| DELETE | /api/apis/:id | Delete API |
| GET | /api/keys | List keys |
| POST | /api/keys | Create key |
| DELETE | /api/keys/:id | Revoke key |
| GET | /api/rules | List rate limits |
| POST | /api/rules | Create rule |
| PATCH | /api/rules/:id | Update rule |
| DELETE | /api/rules/:id | Delete rule |
| GET | /api/stats | Dashboard stats |

### Proxy API (`/proxy/*`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /health | Health check |
| GET | /ready | Dependency check |
| ANY | /proxy/:apiSlug/* | Forward to upstream |

**Example:**
```bash
curl -X POST http://localhost:3001/proxy/openai/chat/completions \
  -H "Authorization: Bearer rg_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hi"}]}'
```

---

This reference provides quick access to any file in the project. Use it alongside the other documentation files for a complete understanding of RateGuard.

