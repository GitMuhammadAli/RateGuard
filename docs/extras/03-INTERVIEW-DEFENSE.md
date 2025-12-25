# RateGuard - Interview Defense Guide

## Anticipating Follow-up Questions

This guide prepares you for deep technical discussions where interviewers ask probing follow-up questions.

---

## 1. Architecture Defense

### Q: "Why a monorepo instead of microservices with separate repos?"

**Level 1 Answer:**
> "We use a monorepo with pnpm workspaces. All apps share code through internal packages like `@rateguard/db` and `@rateguard/rate-limiter`. This enables atomic commits when changing shared code."

**Follow-up: "But doesn't that mean you can't deploy independently?"**
> "No, each app has its own Dockerfile and can be deployed independently. The monorepo is about source code organization, not deployment. We can deploy the proxy without deploying the dashboard. What we gain is the ability to change shared types and see all compile errors across apps immediately."

**Follow-up: "What about build times as the repo grows?"**
> "pnpm has a built-in cache and only rebuilds changed packages. We also use Turborepo-style caching in CI. In practice, most builds only compile the changed app and its dependencies, not the entire monorepo."

**Follow-up: "When would you switch to separate repos?"**
> "If we had 50+ engineers with separate teams owning different services, the coordination cost of a monorepo might exceed its benefits. At that scale, we'd use a platform team model with published internal packages. But for a team under 20 engineers, monorepo is optimal."

---

### Q: "Why 4 different databases? Isn't that over-engineering?"

**Level 1 Answer:**
> "Each database is optimized for its specific workload: PostgreSQL for ACID transactions, Redis for sub-millisecond rate limiting, ClickHouse for analytics, Kafka for event streaming."

**Follow-up: "Couldn't you just use PostgreSQL for everything?"**
> "Let's calculate: Our proxy handles 10,000 requests/second. Each request needs a rate limit check. PostgreSQL averages 10ms per query. That's 100 seconds of query time for 1 second of requests - impossible. Redis handles the same in 0.1ms per operation, so 10,000 requests use only 1 second of Redis time. For rate limiting, Redis isn't optional - it's required."

**Follow-up: "What about ClickHouse? Can't PostgreSQL handle analytics?"**
> "At 10k req/s, we generate 864 million events per day. A query like 'sum cost by API for last 30 days' touches 25 billion rows. PostgreSQL would take minutes; ClickHouse takes seconds. The difference is column-oriented storage - ClickHouse only reads the columns needed (cost, api_id), while PostgreSQL reads entire rows."

**Follow-up: "What about operational complexity?"**
> "Valid concern. In production, we'd use managed services: AWS RDS, ElastiCache, Confluent Cloud, ClickHouse Cloud. These handle operations for us. The alternative - slower performance with fewer databases - would require more proxy instances to compensate, which also adds operational complexity."

---

### Q: "What happens if a component fails?"

**Failure Scenarios:**

| Component | Failure Mode | Impact | Mitigation |
|-----------|--------------|--------|------------|
| **PostgreSQL** | Connection pool exhausted | Can't validate new API keys | Cache validated keys in Redis (5-min TTL) |
| **PostgreSQL** | Complete outage | No auth, total outage | Multi-AZ RDS with automatic failover |
| **Redis** | Partial outage | Rate limits fail-open | Allow requests, log warnings, alert ops |
| **Redis** | Complete outage | Rate limits + budget disabled | Circuit breaker, degraded mode |
| **Kafka** | Producer failure | Events lost | Buffer in memory, retry with backoff |
| **Kafka** | Broker outage | Analytics delayed | Events queue on proxy, replay later |
| **ClickHouse** | Query timeout | Dashboard slow | Cached aggregations, show stale data |

**Follow-up: "Explain fail-open for rate limiting."**
> "If Redis is unreachable, we have two choices: reject all requests (fail-closed) or allow all requests (fail-open). Fail-closed means a Redis issue becomes a total outage. Fail-open means we temporarily over-serve during the Redis outage. For most use cases, slight over-serving is better than complete outage. We log these events and alert operations."

**Follow-up: "When would you use fail-closed instead?"**
> "For financial APIs or APIs with hard quotas (where over-serving costs real money or violates contracts). In that case, we'd also invest in Redis Cluster with 3+ replicas and automatic failover to minimize fail-closed events."

---

## 2. Rate Limiting Defense

### Q: "Why Redis Lua scripts instead of transactions?"

**Level 1 Answer:**
> "Lua scripts in Redis are atomic. The entire script runs without interruption, preventing race conditions in rate limiting."

**Follow-up: "Couldn't you use Redis MULTI/EXEC transactions?"**
> "MULTI/EXEC batches commands but doesn't make reads and writes atomic. Consider:
> ```
> MULTI
> GET tokens        # Thread 2 could GET here too
> SET tokens 0      # Both threads SET to 0
> EXEC
> ```
> Lua scripts are truly atomic - no other command can run mid-script."

**Follow-up: "What about performance? Aren't Lua scripts slow?"**
> "Lua scripts are fast because they run server-side. Without Lua:
> - Network round-trip 1: GET tokens (0.5ms)
> - Network round-trip 2: SET tokens (0.5ms)
> - Total: 1ms + race condition risk
>
> With Lua:
> - Single EVALSHA call (0.5ms)
> - Atomic, no races
>
> Lua is actually faster AND safer."

**Follow-up: "What if the Lua script has a bug and runs forever?"**
> "Redis has a 5-second default script timeout. Long-running scripts are killed. In practice, our token bucket script runs in microseconds - it's just math and a few Redis commands. We also test scripts thoroughly before deployment."

---

### Q: "Why Token Bucket over other algorithms?"

**Comparison:**

```
┌─────────────────────────────────────────────────────────────┐
│                 ALGORITHM COMPARISON                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TOKEN BUCKET (our choice):                                 │
│  ✓ Allows bursts (user loads page → 20 API calls at once)  │
│  ✓ Smooth refill (10 tokens/second)                        │
│  ✓ Memory efficient (2 values per key)                     │
│  ✓ Industry standard (AWS, Stripe, GitHub)                 │
│                                                              │
│  SLIDING WINDOW:                                            │
│  ✓ Precise counting (no boundary issues)                   │
│  ✗ No burst allowance                                       │
│  ✗ Memory grows with requests (sorted set)                 │
│  Use for: strict enforcement                                │
│                                                              │
│  FIXED WINDOW:                                              │
│  ✗ Boundary problem (2x burst at window edge)              │
│  ✓ Simple implementation                                   │
│  Use for: simple daily limits only                         │
│                                                              │
│  LEAKY BUCKET:                                              │
│  ✓ Smooth output rate                                      │
│  ✗ Complex queue management                                │
│  Use for: smoothing traffic to fragile backends            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Follow-up: "When would Token Bucket be the wrong choice?"**
> "For financial APIs where we need exact counting (100 transactions per day, no exceptions). Sliding Window is better because it counts precisely. Token Bucket with burst=100 could allow 100 transactions in second 1, then 10 more in second 2 as tokens refill. For daily limits, that's probably unacceptable."

**Follow-up: "How do you handle different costs per request?"**
> "The `cost` parameter in our check function. A GPT-4 request might cost 10 tokens (because it's expensive), while a GPT-3.5 request costs 1 token. This allows weighting requests by resource consumption."

---

### Q: "How do you handle distributed rate limiting across multiple proxy instances?"

**Level 1 Answer:**
> "All proxy instances share the same Redis. Rate limit state is centralized, so adding more proxies doesn't break rate limiting."

**Follow-up: "What about Redis network latency?"**
> "Redis in the same datacenter adds ~0.5ms latency. This is acceptable for API proxying where upstream calls take 100-500ms. If we needed lower latency, we could:
> 1. Use Redis Cluster with read replicas
> 2. Local token bucket with periodic sync (eventually consistent)
> 3. Layer two rate limiters: local + global"

**Follow-up: "Explain the local + global approach."**
> "Each proxy has an in-memory rate limiter for immediate enforcement (local). Periodically (every 100ms), we sync with Redis (global). Local prevents bursts from overwhelming Redis; global ensures cross-instance consistency. This is how Cloudflare handles billions of requests."

---

## 3. Security Defense

### Q: "Why SHA256 for API keys instead of bcrypt?"

**Level 1 Answer:**
> "API keys are high-entropy random strings (192 bits). They can't be brute-forced. bcrypt's slowness provides no security benefit, but adds latency to every API call."

**Follow-up: "But what if someone gets the hash database?"**
> "Let's calculate brute-force time:
> - Key: 32 random characters (base64url)
> - Entropy: ~192 bits
> - SHA256: 1 billion hashes/second per GPU
> - Time to crack one key: 2^192 / 10^9 = 10^48 seconds
> - That's longer than the age of the universe
>
> bcrypt at 100 hashes/second would take 10^55 seconds. Both are effectively infinite. The extra security of bcrypt doesn't matter for high-entropy secrets."

**Follow-up: "Then why use bcrypt for passwords?"**
> "Passwords are low-entropy. A typical 8-character password has ~50 bits of entropy (dictionary words, patterns). At 1 billion hashes/second, that's 2^50 / 10^9 = 11 days to crack. bcrypt at 100 hashes/second takes 2^50 / 100 = 357 years. For low-entropy secrets, bcrypt's slowness matters."

---

### Q: "How do you prevent API key theft?"**

**Defense Layers:**

| Layer | Protection | Implementation |
|-------|------------|----------------|
| **Transport** | TLS 1.3 everywhere | HTTPS only, HSTS headers |
| **Storage** | Hash, don't encrypt | SHA256, never store plaintext |
| **Display** | Show once, never again | Only on creation |
| **Rotation** | Easy key rotation | Create new → update client → delete old |
| **Scoping** | Principle of least privilege | Scopes: `read:apis`, `write:keys` |
| **Expiration** | Time-limited keys | Optional `expiresAt` |
| **Monitoring** | Detect misuse | Alert on unusual patterns |

**Follow-up: "What if a key is stolen?"**
> "1. User revokes key immediately (isActive = false)
> 2. Revoked keys are rejected within seconds (no cache)
> 3. All activity is logged with key ID for audit
> 4. Alerts can trigger on unusual usage patterns (new IP, high volume)"

**Follow-up: "How do you detect unusual patterns?"**
> "Compare current usage against historical baseline:
> - Sudden spike in requests (10x normal)
> - Requests from new geographic region
> - Requests to unusual endpoints
> - Requests at unusual times
>
> We store these patterns in ClickHouse and run anomaly detection queries."

---

## 4. Performance Defense

### Q: "What's the latency overhead of RateGuard?"

**Latency Breakdown:**

```
┌─────────────────────────────────────────────────────────────┐
│                    LATENCY BREAKDOWN                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client Request                                              │
│       ↓                                                      │
│  TLS Handshake          ~50ms (first request, cached after) │
│       ↓                                                      │
│  Auth Middleware         ~2ms (Redis cache hit)             │
│       ↓                      │                               │
│                              └─ ~10ms (DB lookup on miss)   │
│  Rate Limit Check        ~0.5ms (Redis Lua script)          │
│       ↓                                                      │
│  Budget Check            ~0.5ms (Redis GET)                 │
│       ↓                                                      │
│  Upstream Forward        ~100-500ms (OpenAI response time)  │
│       ↓                                                      │
│  Event Logging           ~0ms (async, non-blocking)         │
│       ↓                                                      │
│  Response                                                    │
│                                                              │
│  TOTAL OVERHEAD: ~3-13ms                                    │
│  UPSTREAM TIME: ~100-500ms                                  │
│  OVERHEAD %: 1-3%                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Follow-up: "How do you minimize that overhead?"**
> "1. **Caching**: API configs cached in Redis (60s TTL)
> 2. **Connection pooling**: Undici pools connections to upstream
> 3. **Async logging**: Events sent to Kafka without blocking response
> 4. **Script caching**: Lua scripts loaded once, called by SHA
> 5. **Parallel checks**: Rate limit + budget check could run in parallel"

**Follow-up: "What's the theoretical maximum throughput?"**
> "Single proxy instance: ~30,000 req/s (Fastify benchmark)
> Limiting factor: Redis at ~100,000 ops/s per instance
> With 3 proxies sharing Redis: ~90,000 req/s
> With Redis Cluster (6 shards): ~500,000 req/s
> 
> For comparison, Stripe handles ~1 million API calls per second across their infrastructure."

---

## 5. Scalability Defense

### Q: "How would you scale to 10x traffic?"

**Current State:** 10,000 req/s

**10x State (100,000 req/s):**

```
┌─────────────────────────────────────────────────────────────┐
│                    SCALING PLAN                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PROXY LAYER (Horizontal Scaling):                          │
│  Current: 2 instances                                       │
│  10x: 10-20 instances behind ALB                            │
│  Why: Proxy is stateless, easy to add                       │
│                                                              │
│  REDIS (Vertical + Horizontal):                             │
│  Current: 1 instance (r6g.large)                            │
│  10x: Redis Cluster with 3 primary + 3 replica              │
│  Sharding: By workspace_id (even distribution)              │
│                                                              │
│  POSTGRESQL (Read Replicas):                                │
│  Current: 1 primary                                         │
│  10x: 1 primary + 2 read replicas                           │
│  Write: Config updates (rare)                               │
│  Read: API key validation (cached anyway)                   │
│                                                              │
│  KAFKA (Partitions):                                        │
│  Current: 3 partitions                                      │
│  10x: 30 partitions (10x parallelism)                       │
│  Key: workspace_id (ordering within workspace)              │
│                                                              │
│  CLICKHOUSE (Sharded Cluster):                              │
│  Current: 1 node                                            │
│  10x: 3 shards × 2 replicas = 6 nodes                       │
│  Sharding: By workspace_id                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Follow-up: "What's the bottleneck?"**
> "At 10x scale, Redis becomes the bottleneck. Each request needs at least one Redis operation (rate limit check). Redis Cluster distributes load across shards. We'd shard by workspace_id so all requests for a workspace hit the same shard, maintaining rate limit accuracy."

**Follow-up: "What about multi-region?"**
> "Multi-region adds complexity:
> 1. **Option A**: Region-local rate limits (each region has its own Redis)
>    - Pro: Low latency
>    - Con: User in US + Europe gets 2x the limit
> 2. **Option B**: Global rate limits (cross-region Redis)
>    - Pro: Accurate limits
>    - Con: Added latency (50-100ms cross-region)
> 3. **Option C**: Hybrid (local + periodic global sync)
>    - Pro: Low latency, eventually accurate
>    - Con: Complexity
>
> Most customers start with Option A. Accuracy only matters for billing-sensitive limits."

---

## 6. Technical Trade-off Defense

### Q: "Why TypeScript instead of Go?"

**Trade-off Analysis:**

| Factor | TypeScript | Go |
|--------|------------|-----|
| **Performance** | 30k req/s (Fastify) | 100k req/s |
| **Type Safety** | Excellent | Good |
| **Shared Types** | Same types in frontend/backend | Separate |
| **Ecosystem** | npm (millions of packages) | Smaller |
| **Developer Velocity** | Faster | Slower |
| **Team Expertise** | Higher | Lower |

**Answer:**
> "TypeScript for three reasons:
> 1. **Shared types**: Same interfaces in proxy, dashboard, and packages. Changing a type shows errors everywhere instantly.
> 2. **Team velocity**: We ship features faster in TypeScript. Go would require learning a new language and ecosystem.
> 3. **Good enough performance**: 30k req/s is sufficient for most use cases. If we needed more, we'd scale horizontally first.
>
> That said, if we were building a CDN or database (millions of req/s), Go or Rust would be the right choice. For an API proxy, TypeScript is optimal."

**Follow-up: "When would you rewrite in Go?"**
> "If we reached 100k req/s on a single instance and horizontal scaling became cost-prohibitive. At that point, we'd:
> 1. Profile to find hot paths
> 2. Consider rewriting just the rate limiter as a native addon
> 3. Or extract rate limiting to a Go microservice
>
> Premature optimization is the root of all evil. TypeScript is fast enough today."

---

### Q: "Why Fastify instead of Express?"

**Level 1 Answer:**
> "Fastify is 2x faster than Express and has better TypeScript support."

**Follow-up: "Is 2x really meaningful? It's still Node.js."**
> "At 10k req/s, the difference between 15k (Express) and 30k (Fastify) is 1 server vs 2 servers. That's halving our infrastructure cost. Also:
> 1. Built-in validation with JSON Schema (Express needs middleware)
> 2. Plugin system with proper encapsulation (Express has global middleware)
> 3. Automatic error serialization (Express requires manual handling)
>
> Fastify is what Express should have been."

---

## 7. Design Pattern Defense

### Q: "Why middleware chain instead of single handler?"

**Middleware Chain:**
```typescript
server.addHook('preHandler', authMiddleware);      // 1
server.addHook('preHandler', rateLimitMiddleware); // 2
server.addHook('preHandler', budgetMiddleware);    // 3
// Route handler                                   // 4
```

**Benefits:**
| Benefit | Explanation |
|---------|-------------|
| **Single Responsibility** | Each middleware does one thing |
| **Reusable** | Same auth middleware for all routes |
| **Testable** | Test each middleware in isolation |
| **Composable** | Easy to add/remove middleware |
| **Early Exit** | Auth failure stops before rate limit check |

**Follow-up: "What about performance? Multiple function calls?"**
> "Function call overhead is nanoseconds. Database and Redis calls are milliseconds. The overhead is negligible. The benefit of clean, maintainable code far outweighs the performance cost."

---

### Q: "Why cache API configs instead of querying PostgreSQL?"

**Level 1 Answer:**
> "Database queries add 5-20ms latency. Redis cache adds 0.5ms."

**Follow-up: "What about cache invalidation?"**
> "Two strategies:
> 1. **TTL-based**: Cache for 60 seconds, accept 60s staleness
> 2. **Event-based**: On config change, publish to Redis pub/sub, all proxies invalidate
>
> We use TTL-based for simplicity. 60 seconds of stale config is acceptable for API settings that change rarely."

**Follow-up: "What if someone changes a config during the TTL?"**
> "Worst case: 60 seconds of old config. For critical changes (revoke API key), we don't cache - we query PostgreSQL directly. API configs (timeouts, base URLs) can be stale briefly without impact."

---

## 8. DevOps & Kubernetes Defense

### Q: "Why Kubernetes instead of simpler deployment options?"

**Level 1 Answer:**
> "Kubernetes provides automated scaling, self-healing, and declarative infrastructure that's essential for a high-availability API proxy."

**Follow-up: "But isn't Kubernetes overkill for this project?"**
> "It depends on scale and requirements:
> - **Docker Compose**: Great for development and single-server deployments
> - **Kubernetes**: Required when you need auto-scaling, rolling updates, and high availability
>
> For an API proxy handling thousands of requests per second, automatic scaling (HPA) and self-healing are crucial. When a pod crashes, Kubernetes restarts it. When traffic spikes, HPA adds pods automatically. With Docker Compose, I'd need to manually scale and handle failures."

**Follow-up: "What about serverless (AWS Lambda)?"**
> "Lambda has cold start latency (100-500ms), which is unacceptable for a low-latency proxy. Also:
> 1. Rate limiting needs persistent Redis connections (Lambda recreates per invocation)
> 2. Predictable costs vs. Lambda's pay-per-invocation at high volume
> 3. No vendor lock-in
>
> That said, Lambda works well for the alerts service with periodic triggers."

---

### Q: "How do you handle secrets in Kubernetes?"

**Level 1 Answer:**
> "We use Kubernetes Secrets for credentials. In production, we'd use External Secrets Operator with AWS Secrets Manager or HashiCorp Vault."

**Follow-up: "Aren't Kubernetes secrets just base64 encoded?"**
> "Yes, base64 is encoding, not encryption. For production security:
> 1. **External Secrets Operator**: Fetches secrets from AWS Secrets Manager, Vault, etc.
> 2. **RBAC**: Restrict who can read secrets
> 3. **Encryption at rest**: Enable etcd encryption in the cluster
> 4. **Secret rotation**: External Secrets supports automatic rotation
>
> The secrets in our repo are templates with placeholder values. Real credentials never touch version control."

---

### Q: "Explain your scaling strategy for the proxy."

**Level 1 Answer:**
> "We use Horizontal Pod Autoscaler (HPA) that scales from 3 to 20 pods based on CPU utilization."

**Follow-up: "Why CPU and not custom metrics like requests per second?"**
> "CPU is the simplest starting point and correlates well with load. For more precision:
> 1. **Requests per second**: Using Prometheus adapter with custom metrics
> 2. **Latency**: Scale up when p99 latency exceeds threshold
> 3. **Queue depth**: For the analytics consumer
>
> CPU-based scaling works well for compute-bound workloads. We'd add custom metrics if CPU proves to be a poor predictor."

**Follow-up: "What happens during scale-up? Don't requests fail?"**
> "Kubernetes has several mechanisms:
> 1. **Readiness probes**: New pods only receive traffic when healthy
> 2. **Pod anti-affinity**: Pods spread across nodes for availability
> 3. **Scale-up stabilization**: 15-second window prevents flapping
> 4. **Scale-down stabilization**: 5-minute window prevents premature scale-down
>
> Existing pods continue handling traffic while new pods start. The Service load balances across all ready pods."

---

### Q: "How do you handle database failures in Kubernetes?"

**Level 1 Answer:**
> "In production, we'd use managed databases (RDS, ElastiCache) which handle failures automatically."

**Follow-up: "What about the databases defined in your k8s manifests?"**
> "Those are for development and testing, not production. In production:
>
> | Component | Production Solution |
> |-----------|-------------------|
> | PostgreSQL | AWS RDS with Multi-AZ |
> | Redis | AWS ElastiCache with cluster mode |
> | Kafka | Confluent Cloud or AWS MSK |
> | ClickHouse | ClickHouse Cloud |
>
> Managed services provide:
> 1. Automatic failover
> 2. Automated backups
> 3. Monitoring and alerts
> 4. Security patches
>
> Self-managing StatefulSets for databases is only worth it at massive scale."

---

### Q: "How do you handle rolling updates without downtime?"

**Level 1 Answer:**
> "Kubernetes rolling updates replace pods gradually while maintaining availability."

**Follow-up: "Walk me through the process."**
> "When we deploy a new version:
> 1. Kubernetes creates new pods with the updated image
> 2. Each new pod goes through:
>    - Init containers (if any)
>    - Startup probe (initial health check)
>    - Readiness probe (ready for traffic)
> 3. Old pods continue serving traffic
> 4. Once new pod is ready, it receives traffic
> 5. Old pod receives SIGTERM
> 6. `terminationGracePeriodSeconds` allows existing connections to drain
> 7. Old pod is terminated
>
> Our configuration:
> ```yaml
> strategy:
>   type: RollingUpdate
>   rollingUpdate:
>     maxUnavailable: 0      # Never reduce capacity
>     maxSurge: 1            # Add one pod at a time
> ```"

---

## 9. Real-World Scenarios

### Scenario: "A customer reports they're getting rate limited unfairly."

**Investigation Steps:**
1. **Check the limits**: Query `rate_limit_rules` for their workspace
2. **Check their usage**: Query ClickHouse for request counts in window
3. **Verify scope**: Are they hitting PER_KEY or PER_WORKSPACE limit?
4. **Check for clock drift**: Ensure all proxies have synced clocks
5. **Replay the incident**: ClickHouse has full request logs

**Answer:**
> "First, I'd pull their request logs from ClickHouse to count actual requests in the window. Then compare to their configured limits. Common issues:
> 1. Customer configured stricter limit than they realized
> 2. Multiple API keys sharing a PER_WORKSPACE limit
> 3. Burst consumption (used all tokens in first second)"

---

### Scenario: "Costs are higher than expected for a customer."

**Investigation:**
1. **Check cost model**: Is it per-request or per-token?
2. **Check token usage**: Are they using GPT-4 (expensive) vs GPT-3.5 (cheap)?
3. **Check for loops**: Are there runaway processes making repeated calls?
4. **Check caching**: Are they calling the same thing repeatedly?

**Answer:**
> "I'd query ClickHouse for their cost breakdown by endpoint and model. Usually it's:
> 1. Using more expensive models than expected
> 2. Larger prompts than expected (token-based billing)
> 3. Retry loops hitting the API multiple times
> 
> Our dashboard shows cost by API and endpoint, making this easy to diagnose."

---

This guide prepares you for multi-level interview discussions. The key is to have depth beyond your initial answer - always be ready for "why?" and "what if?"

