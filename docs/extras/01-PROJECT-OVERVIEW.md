# RateGuard - Complete Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Decisions](#architecture--design-decisions)
3. [Technology Stack Analysis](#technology-stack-analysis)
4. [Deployment Options](#deployment-options)
5. [Interview Defense Guide](#interview-defense-guide)

---

## Project Overview

### What is RateGuard?

**RateGuard** is an **Enterprise API Rate Limiting & Cost Management Platform** - a smart proxy that sits between your applications and external APIs (OpenAI, Stripe, Anthropic, etc.).

### The Business Problem

```
┌─────────────────────────────────────────────────────────────┐
│                    WITHOUT RateGuard                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Your App ──────────────────────────────► OpenAI API        │
│                                                              │
│  Problems:                                                   │
│  ✗ No control over request rates (can hit API limits)      │
│  ✗ Unexpected $10,000+ bills (no budget control)           │
│  ✗ Hard to track which team/feature uses what              │
│  ✗ No early warning before limits/budgets hit              │
│  ✗ No visibility into API performance/errors               │
│  ✗ Can't attribute costs to specific projects              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     WITH RateGuard                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Your App ──► RateGuard Proxy ──► OpenAI API                │
│                    │                                         │
│                    ├── ✓ Rate Limiting (100 req/min)        │
│                    ├── ✓ Cost Tracking ($45.23 today)       │
│                    ├── ✓ Budget Alerts (80% warning)        │
│                    ├── ✓ Analytics Dashboard                │
│                    ├── ✓ Per-team/key attribution           │
│                    └── ✓ Real-time monitoring               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature                 | Description                                               | Business Value                      |
| ----------------------- | --------------------------------------------------------- | ----------------------------------- |
| **Rate Limiting**       | Control request rates with Token Bucket or Sliding Window | Prevent API bans, ensure fair usage |
| **Cost Tracking**       | Track spending per API, per key, per endpoint             | Budget control, cost attribution    |
| **Budget Alerts**       | Email/Slack notifications when approaching limits         | Prevent bill shock                  |
| **Multi-tenant**        | Workspaces with team members and role-based access        | Enterprise-ready                    |
| **API Key Management**  | Secure key generation, rotation, and revocation           | Security compliance                 |
| **Real-time Analytics** | Charts, logs, and performance metrics                     | Operational visibility              |

### Target Users

1. **Startups** using AI APIs (OpenAI, Anthropic) who want to control costs
2. **Enterprises** needing to manage API access across teams
3. **Platform Companies** providing API access to customers
4. **DevOps Teams** wanting visibility into API dependencies

---

## Architecture & Design Decisions

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         RATEGUARD ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐                                                   │
│  │  Client App │  (Your application)                               │
│  └──────┬──────┘                                                   │
│         │ Authorization: Bearer rg_xxx                             │
│         ▼                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │         PROXY SERVER (Fastify)          │ ← Port 3001           │
│  │  ┌───────────┐  ┌──────────┐  ┌──────┐ │                       │
│  │  │   Auth    │→ │  Rate    │→ │Budget│ │                       │
│  │  │ Middleware│  │  Limit   │  │Check │ │                       │
│  │  └───────────┘  └──────────┘  └──────┘ │                       │
│  │        │              │           │     │                       │
│  │        ▼              ▼           ▼     │                       │
│  │   PostgreSQL       Redis      Redis     │                       │
│  │   (API keys)    (rate state) (budget)   │                       │
│  └─────────────────────────────────────────┘                       │
│         │                                                           │
│         ▼ If allowed                                               │
│  ┌─────────────┐                                                   │
│  │  Upstream   │  (OpenAI, Stripe, Anthropic)                      │
│  │    API      │                                                   │
│  └──────┬──────┘                                                   │
│         │ Response                                                  │
│         ▼                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │       EVENT LOGGING (async)             │                       │
│  │  Proxy → Kafka → Analytics → ClickHouse │                       │
│  └─────────────────────────────────────────┘                       │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │      WEB DASHBOARD (Next.js)            │ ← Port 3000           │
│  │  • Real-time charts                     │                       │
│  │  • API/Key management                   │                       │
│  │  • Cost tracking                        │                       │
│  │  • Alert configuration                  │                       │
│  └─────────────────────────────────────────┘                       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
rateguard/
├── 📱 apps/                    ← Running Applications
│   ├── web/                    ← Dashboard (Next.js) - User Interface
│   │   └── src/
│   │       ├── app/            ← Next.js App Router pages
│   │       ├── components/     ← React components
│   │       ├── hooks/          ← Custom React hooks
│   │       └── lib/            ← Utilities, API client
│   │
│   ├── proxy/                  ← API Proxy (Fastify) - Core Engine
│   │   └── src/
│   │       ├── middleware/     ← Auth, rate-limit, budget
│   │       ├── routes/         ← Health, proxy handlers
│   │       ├── services/       ← Business logic
│   │       └── plugins/        ← Fastify plugins (Redis, Prisma)
│   │
│   ├── analytics/              ← Event Processor - Data Pipeline
│   │   └── src/
│   │       ├── consumer.ts     ← Kafka consumer
│   │       └── processor.ts    ← Event transformation
│   │
│   └── alerts/                 ← Alert Service - Monitoring
│       └── src/
│           ├── evaluator.ts    ← Check alert conditions
│           └── notifier.ts     ← Send notifications
│
├── 📦 packages/                ← Shared Libraries (DRY principle)
│   ├── db/                     ← Database (Prisma ORM)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   ← Database schema
│   │   │   └── seed.ts         ← Seed data
│   │   └── src/
│   │       └── index.ts        ← Prisma client export
│   │
│   ├── rate-limiter/           ← Rate Limit Algorithms
│   │   └── src/
│   │       ├── algorithms/     ← Token bucket, sliding window
│   │       └── lua/            ← Redis Lua scripts
│   │
│   ├── analytics/              ← ClickHouse Client
│   │   └── src/
│   │       ├── client.ts       ← ClickHouse connection
│   │       └── queries.ts      ← Analytics queries
│   │
│   └── shared/                 ← Types, Utils, Constants
│       └── src/
│           ├── types/          ← TypeScript interfaces
│           ├── schemas/        ← Zod validation schemas
│           └── utils/          ← Crypto, validation helpers
│
├── 🐳 docker/                  ← Infrastructure (Development)
│   ├── docker-compose.yml      ← Development services
│   └── clickhouse/
│       └── init.sql            ← ClickHouse schema
│
├── ☸️ k8s/                      ← Infrastructure (Production)
│   ├── namespace.yaml          ← Kubernetes namespace
│   ├── configmaps/             ← Environment configuration
│   ├── secrets/                ← Credentials (use External Secrets in prod)
│   ├── databases/              ← StatefulSets (PostgreSQL, Redis, etc.)
│   ├── deployments/            ← Application deployments
│   ├── services/               ← Kubernetes services
│   ├── ingress/                ← External access (NGINX Ingress)
│   └── hpa/                    ← Horizontal Pod Autoscaler
│
├── 📜 scripts/                 ← Automation
│   ├── dev.sh                  ← Start development
│   └── setup.sh                ← Initial setup
│
└── pnpm-workspace.yaml         ← Monorepo configuration
```

### Why Monorepo?

**Decision: Monorepo with pnpm workspaces**

| Alternative                   | Pros                                             | Cons                                     | Why Not                                      |
| ----------------------------- | ------------------------------------------------ | ---------------------------------------- | -------------------------------------------- |
| **Polyrepo** (separate repos) | Independent deployments, clear ownership         | Code duplication, version sync nightmare | Too much overhead for small team             |
| **Monolith** (single app)     | Simple, easy to deploy                           | Can't scale components independently     | Proxy needs different scaling than dashboard |
| **Monorepo** ✓                | Shared code, atomic commits, coordinated changes | Needs tooling                            | Best balance for our use case                |

**Defense Argument:**

> "We chose a monorepo because RateGuard has tightly coupled components that share types, utilities, and database access. A polyrepo would force us to publish internal packages to npm and manage version compatibility. With a monorepo, when we change the database schema, we can update all consumers in a single commit, run tests, and deploy atomically. Companies like Google, Meta, and Microsoft use monorepos for exactly this reason."

### Request Flow (Critical Path)

```
1. Client Request
   POST /proxy/openai/chat/completions
   Headers: Authorization: Bearer rg_live_xxxxx

2. Auth Middleware
   ├── Extract API key from header
   ├── Hash key with SHA-256
   ├── Lookup in PostgreSQL: SELECT * FROM api_keys WHERE key_hash = ?
   ├── Validate: isActive, expiresAt
   └── Attach apiKey + workspace to request

3. Rate Limit Middleware
   ├── Load rules: SELECT * FROM rate_limit_rules WHERE workspace_id = ?
   ├── Find matching rules (by API, endpoint pattern)
   ├── For each rule:
   │   ├── Build Redis key: rl:tb:{workspace}:{api}:{key}
   │   ├── Execute Lua script (atomic check + decrement)
   │   └── If denied: throw 429 with Retry-After
   └── Add rate limit headers to response

4. Budget Middleware
   ├── Get current spend: REDIS GET budget:{workspace}:{YYYYMM}
   ├── Estimate request cost
   ├── If spend + estimate > budget && autoShutoff:
   │   └── throw 402 Payment Required
   └── Add budget headers to response

5. Upstream Forward
   ├── Load API config (cached in Redis)
   ├── Build upstream URL: baseUrl + path
   ├── Add authentication (Bearer, API-Key, Basic)
   ├── Forward with undici (connection pooling)
   └── Measure latency

6. Response Processing
   ├── Extract token usage from response body
   ├── Calculate cost: (prompt_tokens * input_rate) + (completion_tokens * output_rate)
   ├── Update budget: REDIS INCRBY budget:{workspace}:{YYYYMM} {cost}
   └── Add cost header: X-RateGuard-Cost-Cents

7. Event Logging (async, non-blocking)
   ├── Build RequestEvent object
   ├── Buffer in memory (batch of 100 or 100ms timeout)
   └── Send to Kafka topic: api-events

8. Return Response
   └── Proxy upstream response with added headers:
       X-RateGuard-Request-Id
       X-RateLimit-Limit, Remaining, Reset
       X-RateGuard-Cost-Cents
       X-RateGuard-Latency-Ms
```

---

## Technology Stack Analysis

### Database Layer

| Database             | Purpose                                   | Why This Choice                                  | Alternatives Considered                         |
| -------------------- | ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| **PostgreSQL**       | Primary data (users, APIs, keys, configs) | ACID, JSON support, mature, excellent tooling    | MySQL (fewer features), MongoDB (no ACID)       |
| **Redis**            | Rate limiting, caching, budget counters   | In-memory speed, Lua scripting, TTL              | Memcached (no Lua), DynamoDB (expensive)        |
| **ClickHouse**       | Analytics (billions of events)            | Column-oriented, 10-100x faster for aggregations | TimescaleDB (slower), BigQuery (vendor lock-in) |
| **Kafka (Redpanda)** | Event streaming                           | Decoupling, durability, replay capability        | RabbitMQ (no replay), SQS (vendor lock-in)      |

**Defense: Why 4 databases?**

> "Each database is optimized for its specific workload. PostgreSQL handles transactional data where consistency matters (user accounts, API keys). Redis provides sub-millisecond rate limit checks - using PostgreSQL would add 10-50ms latency per request. ClickHouse handles analytics queries over billions of events that would crash PostgreSQL. Kafka provides durability and decoupling - if analytics goes down, events are safely queued. This is exactly the pattern used by Uber, Airbnb, and Stripe."

**Counter-argument: "Isn't that operationally complex?"**

> "Yes, more databases = more operational overhead. But the alternative is worse: using PostgreSQL for rate limiting would limit us to ~1000 req/sec instead of 100,000+. In production, we'd use managed services (RDS, ElastiCache, Confluent) which handle ops for us. The complexity is justified by the 100x performance improvement."

### Backend Framework

| Choice               | Why                                                        | Alternatives                                                         |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| **Fastify** (Proxy)  | 2x faster than Express, built-in validation, plugin system | Express (slower), Koa (fewer features), Hono (newer, less ecosystem) |
| **Next.js 14** (Web) | Full-stack React, API routes, SSR, excellent DX            | Remix (similar), SvelteKit (smaller ecosystem)                       |
| **TypeScript**       | Type safety, refactoring, documentation                    | JavaScript (no types), Go (different ecosystem)                      |

**Defense: Why Fastify over Express?**

> "Express is request/response middleware with no opinions. Fastify is built for performance and developer experience. Key differences:
>
> 1. **Performance**: Fastify handles 30k req/s vs Express's 15k req/s in benchmarks
> 2. **Validation**: Built-in JSON Schema validation, generates types automatically
> 3. **Plugins**: Encapsulated plugins with proper dependency injection
> 4. **Async**: Native async/await without callback hell
>
> For a high-throughput proxy handling thousands of requests per second, that 2x performance matters."

### ORM Choice

| Choice     | Why                                     | Alternatives                                            |
| ---------- | --------------------------------------- | ------------------------------------------------------- |
| **Prisma** | Type-safe queries, migrations, great DX | TypeORM (more complex), Drizzle (newer), Knex (raw SQL) |

**Defense: Why Prisma over raw SQL?**

```typescript
// Raw SQL - No type safety
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
user.email; // No autocomplete, no type checking, runtime error if column doesn't exist

// Prisma - Full type safety
const user = await prisma.user.findUnique({ where: { id: userId } });
user.email; // ✓ Autocomplete, ✓ Type checking, ✓ Compile-time error if wrong
```

> "Prisma provides compile-time safety for database queries. When we change the schema, TypeScript immediately shows us everywhere that needs updating. This catches bugs before they reach production. The performance overhead is negligible (~1ms per query) compared to the safety benefits."

---

## Deployment Options

### Docker Compose (Development)

**Location:** `docker/docker-compose.yml`

```bash
# Start all infrastructure
pnpm docker:up

# View logs
pnpm docker:logs

# Stop
pnpm docker:down
```

**Services included:**
- PostgreSQL (port 5432)
- Redis (port 6379)
- ClickHouse (port 8123)
- Redpanda/Kafka (port 9092)

**Best for:** Local development, testing, single-server deployments

### Kubernetes (Production)

**Location:** `k8s/`

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/databases/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/hpa/
```

**Features:**
- Horizontal Pod Autoscaler (scales proxy from 3→20 pods)
- Pod anti-affinity (spreads pods across nodes)
- Rolling updates with zero downtime
- Liveness/readiness probes
- Resource limits and requests
- Ingress with TLS termination

**Best for:** Production, high availability, auto-scaling

### Comparison

| Aspect | Docker Compose | Kubernetes |
|--------|---------------|------------|
| **Use Case** | Development, single host | Production, multi-host |
| **Scaling** | Manual | Automatic (HPA) |
| **High Availability** | None | Built-in |
| **Load Balancing** | Basic | Advanced (Ingress) |
| **Complexity** | Low | High |
| **Secret Management** | .env files | Kubernetes Secrets / External Secrets |

### Production Recommendations

1. **Use managed databases:**
   - AWS RDS / Google Cloud SQL for PostgreSQL
   - AWS ElastiCache / Google Memorystore for Redis
   - Confluent Cloud for Kafka
   - ClickHouse Cloud for analytics

2. **Use External Secrets Operator** with AWS Secrets Manager or HashiCorp Vault

3. **Enable monitoring** with Prometheus + Grafana

4. **Configure resource limits** based on load testing

---

## Interview Defense Guide

### Question: "Why not use a managed solution like AWS API Gateway?"

**Your Answer:**

> "AWS API Gateway is excellent for simple use cases, but RateGuard addresses gaps:
>
> 1. **Cost tracking with token-level granularity** - API Gateway doesn't know OpenAI's pricing model
> 2. **Custom rate limiting algorithms** - Token Bucket with burst handling, not just fixed quotas
> 3. **Multi-tenant budget management** - Per-workspace budgets with auto-shutoff
> 4. **Unified analytics** - Cross-API visibility in one dashboard
> 5. **No vendor lock-in** - Works with any cloud or on-premise
>
> That said, for simpler use cases, API Gateway is absolutely the right choice. RateGuard targets enterprises needing fine-grained AI API cost control."

### Question: "How does this scale to 100,000 requests per second?"

**Your Answer:**

```
┌─────────────────────────────────────────────────────────────┐
│                    SCALING STRATEGY                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Load Balancer (HAProxy/ALB)                                │
│         │                                                    │
│         ├── Proxy Instance 1 ─┐                             │
│         ├── Proxy Instance 2 ─┼── Redis Cluster (sharded)   │
│         ├── Proxy Instance N ─┘   (rate limit state)        │
│         │                                                    │
│         └── All connect to:                                 │
│             ├── PostgreSQL (read replicas for config)       │
│             ├── Kafka (partitioned by workspace_id)         │
│             └── ClickHouse Cluster (sharded)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

> "The proxy is stateless - all state lives in Redis and PostgreSQL. We can add instances behind a load balancer. For Redis, we'd use Redis Cluster with sharding by workspace_id. PostgreSQL configs are cacheable (5-minute TTL). Kafka partitioning by workspace_id ensures ordering. ClickHouse natively supports distributed queries across shards."

### Question: "What happens if Redis goes down?"

**Your Answer:**

> "We implement **fail-open with degraded mode**:
>
> 1. If Redis is unreachable, we allow the request but log a warning
> 2. Rate limiting is temporarily disabled (fail-open)
> 3. Budget tracking falls back to async mode
> 4. Alerts trigger for operations team
>
> The alternative (fail-closed) would block all requests on Redis failure, which is worse for business. We prefer slight over-usage over complete outage. This matches how Stripe, Cloudflare, and other proxies handle Redis failures."

### Question: "How do you prevent race conditions in rate limiting?"

**Your Answer:**

```lua
-- This entire script runs ATOMICALLY in Redis
-- No other command can interleave

local tokens = redis.call('HGET', key, 'tokens')
if tokens >= requested then
    redis.call('HSET', key, 'tokens', tokens - requested)
    return {1, tokens - requested}  -- allowed
else
    return {0, tokens}  -- denied
end
```

> "Redis Lua scripts are atomic. The script is loaded once with `SCRIPT LOAD`, then executed with `EVALSHA`. During execution, Redis processes no other commands. This eliminates the race condition where two requests read the same token count and both decrement it. It's the same technique used by GitHub, Stripe, and Discord for their rate limiters."

### Question: "Why store API key hashes instead of encrypted keys?"

**Your Answer:**

```
┌─────────────────────────────────────────────────────────────┐
│                 API KEY SECURITY MODEL                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User receives: rg_live_K7dF9xQ2mN8bV3hJ5wR1tY6uI0oP4lA2   │
│                                                              │
│  We store:                                                   │
│  - keyHash:  SHA256(key) = 7f83b1657ff1fc53b92dc18148...    │
│  - keyPrefix: rg_live_K7dF (for display only)               │
│                                                              │
│  On authentication:                                          │
│  1. User sends: Authorization: Bearer rg_live_K7dF...       │
│  2. We compute: SHA256(key)                                 │
│  3. We query: SELECT * FROM api_keys WHERE key_hash = ?     │
│  4. If match: authenticated!                                │
│                                                              │
│  If database is breached:                                   │
│  - Attacker has hashes, not keys                           │
│  - SHA256 is one-way (cannot reverse)                       │
│  - Keys remain secure                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

> "Hashing is one-way; encryption is two-way. If we encrypted API keys, we'd need to store the decryption key somewhere. If attackers get the database AND the decryption key, they have all API keys. With hashing, even if they get everything, they can't reverse the hashes. This is the same pattern used for password storage and by Stripe, AWS, and GitHub for API keys."

### Question: "Why TypeScript instead of Go for the proxy?"

**Your Answer:**

> "Valid question - Go would be faster. Our reasons:
>
> 1. **Shared types** - Same TypeScript interfaces in proxy, dashboard, and shared packages
> 2. **Team expertise** - Faster development with familiar language
> 3. **npm ecosystem** - Undici, ioredis, kafkajs are battle-tested
> 4. **Good enough performance** - Fastify handles 30k req/s, sufficient for most use cases
>
> If we hit performance limits, we could rewrite the hot path (rate limiting) in Rust as a Node.js native addon, or extract it to a Go microservice. But premature optimization is the root of all evil - TypeScript is fast enough and significantly more productive."

### Question: "How do you ensure data consistency across databases?"

**Your Answer:**

```
┌─────────────────────────────────────────────────────────────┐
│                 CONSISTENCY MODEL                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STRONG CONSISTENCY (PostgreSQL):                           │
│  - User accounts, API configs, API keys                     │
│  - ACID transactions                                        │
│  - Source of truth                                          │
│                                                              │
│  EVENTUAL CONSISTENCY (ClickHouse):                         │
│  - Analytics events                                         │
│  - 1-5 second delay acceptable                              │
│  - Kafka provides durability                                │
│                                                              │
│  BEST-EFFORT (Redis):                                       │
│  - Rate limit state                                         │
│  - Budget counters                                          │
│  - If lost, temporarily over-serve (acceptable)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

> "We use different consistency models for different data:
>
> - **Config data** (PostgreSQL): Strong consistency - a deleted API key must immediately stop working
> - **Analytics** (ClickHouse): Eventual consistency - 5-second delay in dashboards is fine
> - **Rate limits** (Redis): Best-effort - if Redis restarts, we temporarily over-serve while state rebuilds
>
> This is the CAP theorem in practice. We can't have consistency, availability, and partition tolerance for everything. We choose the right tradeoff for each data type."
