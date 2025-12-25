# RateGuard Documentation

## 📚 Complete Documentation Index

This documentation prepares you to explain RateGuard in technical interviews, code reviews, and team discussions.

---

## Documentation Files

| File | Content | Use For |
|------|---------|---------|
| [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) | Architecture, tech stack analysis, design decisions | Understanding the big picture |
| [02-CODE-DEEP-DIVE.md](./02-CODE-DEEP-DIVE.md) | Database schema, rate limiting algorithms, code walkthroughs | Technical deep dives |
| [03-INTERVIEW-DEFENSE.md](./03-INTERVIEW-DEFENSE.md) | Q&A with follow-up questions, counter-arguments | Interview preparation |
| [04-PHASE1-BUILD-PROMPTS.md](./04-PHASE1-BUILD-PROMPTS.md) | Step-by-step build prompts for implementation | Building the project |
| [05-FILE-STRUCTURE-REFERENCE.md](./05-FILE-STRUCTURE-REFERENCE.md) | Complete file tree, import paths, commands | Quick reference |
| [06-KUBERNETES-DEPLOYMENT.md](./06-KUBERNETES-DEPLOYMENT.md) | Kubernetes manifests, scaling, production deployment | DevOps & Infrastructure |

---

## 🎯 Quick Start Guide

### 1. Understand the Project
- Read [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) first
- Focus on the architecture diagram and data flow

### 2. Master the Core Concepts
- Read [02-CODE-DEEP-DIVE.md](./02-CODE-DEEP-DIVE.md)
- Pay special attention to:
  - Token Bucket algorithm (Lua script)
  - API key security (hash storage)
  - Middleware chain (auth → rate limit → budget)

### 3. Prepare for Questions
- Study [03-INTERVIEW-DEFENSE.md](./03-INTERVIEW-DEFENSE.md)
- Practice explaining trade-offs
- Prepare for "why not X?" questions

---

## 🔑 Key Talking Points

### The Elevator Pitch
> "RateGuard is an API gateway that sits between applications and external APIs like OpenAI. It provides rate limiting with Redis Lua scripts for atomicity, cost tracking with real-time budget enforcement, and analytics via Kafka + ClickHouse. It's built as a TypeScript monorepo with Fastify for the proxy and Next.js for the dashboard."

### Technical Highlights

| Feature | Implementation | Why It's Interesting |
|---------|---------------|---------------------|
| **Rate Limiting** | Redis Lua scripts | Atomic operations prevent race conditions |
| **API Key Security** | SHA256 hash storage | One-way hash, even DB leak is safe |
| **Cost Tracking** | Redis counters + ClickHouse | Real-time + historical analytics |
| **Multi-tenancy** | Workspace-scoped queries | Row-level isolation without schema complexity |
| **Event Pipeline** | Kafka → ClickHouse | Decoupled, durable, scalable |

### Unique Selling Points
1. **Token-level cost tracking** for AI APIs (OpenAI, Anthropic)
2. **Budget enforcement** with auto-shutoff before bill shock
3. **Real-time analytics** with sub-second dashboards
4. **Enterprise-ready** multi-tenant architecture

---

## 🎤 Interview Scenarios

### "Tell me about a project you've built"
> "I built RateGuard, an API rate limiting and cost management platform. The interesting technical challenge was implementing distributed rate limiting. I used Redis Lua scripts to make the check-and-decrement operation atomic, preventing race conditions where two requests could both see 1 token remaining and both succeed."

### "Design a rate limiter"
> "I'd use the Token Bucket algorithm with Redis. Here's why: Token Bucket allows bursts, which improves user experience when loading pages that make multiple API calls. I'd implement it as a Lua script in Redis for atomicity. The script reads current tokens, calculates refill based on elapsed time, decrements if allowed, and returns the result - all in a single atomic operation."

### "How do you handle high traffic?"
> "The proxy is stateless, so we scale horizontally behind a load balancer. All state lives in Redis (rate limits) and PostgreSQL (configs). For 100k+ requests per second, we'd use Redis Cluster with sharding by workspace ID. Kafka partitioning handles event ingestion scaling. The key is that no proxy instance has local state."

---

## 🏗️ Building RateGuard

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Quick Setup
```bash
# Clone and install
git clone <repo>
cd rateguard
pnpm install

# Start infrastructure
pnpm docker:up

# Setup database
pnpm db:push
pnpm db:seed

# Start development
pnpm dev

# Open dashboard
open http://localhost:3000

# Login credentials (from seed)
Email: demo@rateguard.dev
Password: Demo123!
```

### Test the Proxy
```bash
# Get API key from seed output, then:
curl -X POST http://localhost:3001/proxy/openai/chat/completions \
  -H "Authorization: Bearer rg_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Production Deployment (Kubernetes)
```bash
# Deploy to Kubernetes cluster
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets/rateguard-secrets.local.yaml  # Edit with real values first!
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/databases/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/hpa/

# Check deployment status
kubectl -n rateguard get all
```

See [06-KUBERNETES-DEPLOYMENT.md](./06-KUBERNETES-DEPLOYMENT.md) for the complete guide.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR APPLICATION                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Authorization: Bearer rg_xxx
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    RATEGUARD PROXY                           │
│  ┌─────────┐    ┌───────────┐    ┌──────────┐             │
│  │  Auth   │ →  │ Rate Limit│ →  │  Budget  │             │
│  │   ↓     │    │     ↓     │    │    ↓     │             │
│  │ Postgres│    │   Redis   │    │  Redis   │             │
│  └─────────┘    └───────────┘    └──────────┘             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ If all checks pass
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    UPSTREAM API                              │
│                 (OpenAI, Stripe, etc.)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Response + Usage
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EVENT PIPELINE                            │
│         Proxy → Kafka → Analytics → ClickHouse              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WEB DASHBOARD                             │
│              Charts, Costs, Alerts, Settings                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Common Questions Quick Answers

| Question | Quick Answer |
|----------|--------------|
| Why 4 databases? | Each optimized for its workload (OLTP, cache, analytics, streaming) |
| Why TypeScript? | Shared types between frontend/backend, faster development |
| Why Fastify? | 2x faster than Express, better TypeScript support |
| Why Lua in Redis? | Atomic operations, no race conditions |
| Why hash API keys? | One-way hash protects even if DB is leaked |
| Why ClickHouse? | Column-oriented = 100x faster aggregations |
| What if Redis fails? | Fail-open: allow requests, log warnings |
| Why Kubernetes? | Auto-scaling (HPA), self-healing, rolling updates |
| Why not serverless? | Cold starts add latency, need persistent Redis connections |

---

## 📈 Success Metrics

After completing this project, you can demonstrate:

- ✅ System design skills (distributed rate limiting)
- ✅ Database design (multi-tenant, proper indexing)
- ✅ Security awareness (hashing, encryption, JWT)
- ✅ Performance optimization (caching, connection pooling)
- ✅ Modern stack proficiency (TypeScript, Next.js, Fastify)
- ✅ DevOps knowledge (Docker, Kubernetes, HPA, Ingress)
- ✅ Infrastructure as Code (declarative manifests, GitOps-ready)

---

Good luck with your interviews! 🚀

