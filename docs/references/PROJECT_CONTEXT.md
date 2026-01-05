# 📋 RateGuard Project Context

> Use this document to restore context in a new chat session or when switching accounts.

---

## 🎯 Project Overview

**RateGuard** is an **API Rate Limiting Gateway** - a service that sits between clients and external APIs (like OpenAI, Stripe, etc.) to:

- ⚡ Rate limit requests
- 💰 Track API costs & budgets
- 📊 Provide analytics & usage metrics
- 🔐 Manage API keys securely
- 🔔 Send alerts when thresholds are hit

---

## 🛠️ Tech Stack

### Backend (`apps/server`)

| Technology | Purpose |
|------------|---------|
| **NestJS 11** | Node.js framework (modular architecture) |
| **Prisma** | ORM for PostgreSQL |
| **PostgreSQL** | Main database |
| **Redis** | Rate limiting & caching (to be connected) |
| **Passport + JWT** | Authentication |
| **Swagger** | API documentation |
| **Bcrypt** | Password hashing |
| **Nodemailer** | Email sending |

### Frontend (`apps/client`)

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Radix UI** | Accessible components |
| **Zustand** | State management |
| **React Hook Form + Zod** | Form handling & validation |
| **Recharts** | Analytics charts |
| **Framer Motion** | Animations |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **pnpm** | Package manager (monorepo) |
| **Docker Compose** | PostgreSQL + Redis containers |
| **Concurrently** | Run server + client together |

---

## 📁 Project Structure

```
Rate-Guard/
├── apps/
│   ├── client/                 # Next.js Frontend
│   │   ├── app/               # Pages (App Router)
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── login/         # Auth pages
│   │   │   ├── signup/
│   │   │   ├── apis/          # Provider management
│   │   │   ├── keys/          # API key management
│   │   │   ├── limits/        # Rate limits
│   │   │   ├── costs/         # Budget & costs
│   │   │   ├── alerts/        # Notifications
│   │   │   ├── analytics/     # Usage analytics
│   │   │   └── settings/      # User settings
│   │   ├── components/        # UI components
│   │   │   ├── dashboard/     # Dashboard-specific
│   │   │   └── ui/            # Radix-based primitives
│   │   ├── store/             # Zustand stores
│   │   │   ├── auth-store.ts
│   │   │   ├── dashboard-store.ts
│   │   │   ├── api-keys-store.ts
│   │   │   ├── apis-store.ts
│   │   │   ├── rate-limits-store.ts
│   │   │   ├── alerts-store.ts
│   │   │   └── settings-store.ts
│   │   └── lib/               # Utilities & API client
│   │       ├── api.ts         # API client with token refresh
│   │       └── utils.ts
│   │
│   └── server/                 # NestJS Backend
│       ├── src/
│       │   ├── auth/          # Authentication module
│       │   │   ├── controller/auth.controller.ts
│       │   │   ├── service/auth.service.ts
│       │   │   ├── dto/       # Data Transfer Objects
│       │   │   ├── guards/jwt-auth.guard.ts
│       │   │   └── strategies/jwt.strategy.ts
│       │   ├── user/          # User module
│       │   │   ├── controller/user.controller.ts
│       │   │   ├── service/user.service.ts
│       │   │   └── dto/
│       │   ├── database/      # Prisma service
│       │   │   ├── prisma.service.ts
│       │   │   └── database.module.ts
│       │   ├── system/        # Shared utilities
│       │   │   ├── decorator/ # @Public, @CurrentUser, @Roles, @Throttle
│       │   │   ├── filter/    # HttpExceptionFilter
│       │   │   ├── guard/     # RolesGuard, PermissionsGuard
│       │   │   ├── helper/    # Crypto, Date utilities
│       │   │   ├── interceptor/ # Logging, Transform
│       │   │   ├── module/email/ # Email service
│       │   │   └── validator/ # Custom validators
│       │   ├── cron/          # Scheduled jobs (session cleanup)
│       │   ├── config/configuration.ts
│       │   ├── app.module.ts
│       │   ├── main.ts
│       │   └── swagger.ts
│       └── prisma/
│           └── schema.prisma  # Database schema (v2.0)
│
├── docker/
│   └── compose.yml            # PostgreSQL + Redis
│
├── docs/                      # Documentation
│   ├── PROJECT_CONTEXT.md     # This file
│   ├── AUTH_COMPLETE_GUIDE.md
│   └── LEARNING_GUIDE.md
│
├── package.json               # Root package (monorepo scripts)
├── pnpm-workspace.yaml        # Workspace configuration
└── pnpm-lock.yaml
```

---

## 🗄️ Database Schema (v2.0) - 22 Models

### Enums

```prisma
enum Role { OWNER, ADMIN, DEVELOPER, VIEWER }
enum AuthMethod { HEADER, QUERY, BASIC, OAUTH2 }
enum BudgetPeriod { DAILY, WEEKLY, MONTHLY, YEARLY }
enum AlertConditionType { BUDGET_THRESHOLD, RATE_LIMIT_PROXIMITY, ERROR_RATE, SPEND_RATE, LATENCY_THRESHOLD, PROVIDER_DOWN }
enum ChannelType { EMAIL, SLACK, WEBHOOK, DISCORD, PAGERDUTY, TEAMS }
enum WebhookEvent { REQUEST_COMPLETED, REQUEST_FAILED, RATE_LIMIT_HIT, BUDGET_THRESHOLD, BUDGET_EXCEEDED, ALERT_TRIGGERED, PROVIDER_DOWN, PROVIDER_UP }
enum RateLimitStrategy { SLIDING_WINDOW, FIXED_WINDOW, TOKEN_BUCKET, LEAKY_BUCKET }
```

### Models Overview

| Category | Models | Purpose |
|----------|--------|---------|
| **User Management** | `User`, `Session` | Auth, MFA, OAuth, JWT tokens |
| **Workspaces** | `Workspace`, `WorkspaceMember`, `WorkspaceInvitation` | Multi-tenancy, team collaboration |
| **Providers** | `Provider`, `ProviderEndpoint`, `RateLimit` | External APIs (OpenAI, etc.), rate limiting rules |
| **Projects & Keys** | `Project`, `ApiKey` | Organize usage, API key management |
| **Request Logging** | `RequestLog` | Every proxied request with full details |
| **Analytics** | `UsageHourly`, `UsageDaily` | Pre-aggregated metrics for dashboards |
| **Budgets** | `Budget`, `BudgetHistory` | Spending limits & tracking |
| **Alerts** | `NotificationChannel`, `AlertRule`, `AlertEvent` | Multi-channel notifications |
| **Webhooks** | `Webhook`, `WebhookDelivery` | Event-driven integrations |
| **Audit** | `AuditLog` | Track all important actions |

### Key Model Features

**User:**
- Email/password auth with bcrypt hashing
- Email verification with tokens
- Password reset flow
- OAuth support (Google, GitHub)
- MFA with backup codes
- Account lockout after failed attempts

**Session:**
- Token family for refresh token rotation
- Device tracking (userAgent, IP, location)
- Revocation with reason

**Provider:**
- Configure external APIs (OpenAI, Stripe, etc.)
- Store encrypted API keys
- Health checking
- Caching configuration
- Custom headers

**ApiKey:**
- SHA-256 hashed keys
- Scopes & permissions
- IP/Origin restrictions
- Per-key rate limits
- Usage tracking

**RequestLog:**
- Full request/response details
- Latency tracking
- Token usage (for LLMs)
- Cost calculation
- Rate limit status
- Cache hit/miss

---

## ✅ What's Implemented

### Backend (NestJS)

- [x] **Authentication Module**
  - Register, Login, Logout
  - JWT access + refresh tokens
  - Token rotation
  - Password hashing (bcrypt)
  - Email verification
  - Password reset
  
- [x] **Session Management**
  - Device tracking
  - Multiple sessions per user
  - Session revocation
  
- [x] **Workspaces Module** ✨ NEW
  - Create/list/view/update/delete workspaces
  - Role-based access control (OWNER/ADMIN/DEVELOPER/VIEWER)
  - Member management (invite, remove, update roles)
  - Email invitations with secure tokens
  - Ownership transfer
  - Permission guards for fine-grained access
  
- [x] **Push Notifications** ✨ NEW
  - Web Push API integration (FREE!)
  - Browser notifications (Chrome, Firefox, Edge, Safari)
  - Workspace-level alerts
  - User-specific notifications
  - Works offline
  
- [x] **Email Service**
  - Mailtrap integration for testing
  - Email verification
  - Password reset emails
  - Workspace invitation emails
  
- [x] **Security**
  - Global JWT guard
  - @Public decorator for open routes
  - Roles & Permissions guards
  - Workspace role guard (custom RBAC)
  - Global exception filter (user-friendly errors)
  
- [x] **Infrastructure**
  - Prisma setup with PostgreSQL
  - Docker Compose (PostgreSQL + Redis)
  - Swagger API docs (47 endpoints)
  - Logging interceptor
  - Session cleanup cron job
  
- [x] **Schema v2.0**
  - 22 models for full rate limiting features

### Frontend (Next.js)

- [x] Login & Signup pages
- [x] Dashboard layout with sidebar
- [x] Zustand stores for all features
- [x] API client with automatic token refresh
- [x] Radix UI components
- [x] Page structure for all features
- [x] Push notification utilities ✨ NEW
- [x] Service Worker for push ✨ NEW

---

## ⏳ What's Pending

### Backend

- [ ] **Redis Connection** - For rate limiting & caching
- [ ] **Rate Limiting Logic** - Implement algorithms (sliding window, token bucket)
- [ ] **Proxy/Gateway Module** - Forward requests to providers
- [ ] **Provider Management** - CRUD for external APIs
- [ ] **Project Management** - Organize APIs by project
- [ ] **API Key Generation** - Create, validate, revoke keys
- [ ] **Budget Tracking** - Enforce spending limits
- [ ] **Alert System** - Check conditions, send notifications
- [ ] **Webhooks** - Deliver events to external URLs
- [ ] **Usage Aggregation** - Hourly/daily stats rollup
- [ ] **OAuth Providers** - Google, GitHub login
- [ ] **MFA/2FA** - TOTP implementation

### Frontend

- [ ] **Workspace Management UI** - Create, switch, manage workspaces
- [ ] **Member Management UI** - Invite, remove, change roles
- [ ] **Provider Management UI** - Add/edit/delete providers
- [ ] **Project Management UI** - Create and organize projects
- [ ] **API Key Management** - Generate, view, revoke keys
- [ ] **Rate Limits Configuration** - Create/edit rules
- [ ] **Budget Management** - Set limits, view spend
- [ ] **Alerts Configuration** - Create rules, manage channels
- [ ] **Analytics Charts** - Usage, costs, errors
- [ ] **Push Notification Toggle** - Enable/disable in settings
- [ ] **OTP Verification** - Email verify, MFA setup
- [ ] **Confirm Dialogs** - Dangerous action confirmation

---

## 🚀 How to Run

```bash
# 1. Clone and install
git clone <repo-url>
cd Rate-Guard
pnpm install

# 2. Start Docker (PostgreSQL + Redis)
pnpm docker:up

# 3. Setup environment
cp apps/server/.env.example apps/server/.env
# Edit .env with your values

# 4. Generate Prisma client
pnpm db:generate

# 5. Run migrations
pnpm db:push

# 6. Start development servers
pnpm dev
```

### Ports

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:8080 |
| Swagger Docs | http://localhost:8080/api/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Useful Commands

```bash
# Start everything
pnpm dev

# Docker
pnpm docker:up      # Start containers
pnpm docker:down    # Stop containers
pnpm docker:reset   # Stop & remove volumes
pnpm docker:logs    # View logs

# Database
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Run migrations
pnpm db:studio      # Open Prisma Studio (GUI)

# Web Push
cd apps/server
npx web-push generate-vapid-keys  # Generate VAPID keys

# Build
pnpm build          # Build all
pnpm build:server   # Build server only
pnpm build:client   # Build client only
```

---

## 🔑 Environment Variables

Create `apps/server/.env`:

```env
# Database
DATABASE_URL="postgresql://rateguard:rateguard123@localhost:5432/rateguard"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis (for later)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Email (Mailtrap for testing)
MAILTRAP_HOST="sandbox.smtp.mailtrap.io"
MAILTRAP_PORT="2525"
MAILTRAP_USER="your-mailtrap-user"
MAILTRAP_PASS="your-mailtrap-pass"
EMAIL_FROM="noreply@rateguard.io"
EMAIL_FROM_NAME="RateGuard"

# Push Notifications (Web Push - FREE!)
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="mailto:admin@rateguard.io"

# App
PORT=8080
NODE_ENV="development"
CORS_ORIGINS="http://localhost:3001"
FRONTEND_URL="http://localhost:3001"

# Encryption (for API keys)
ENCRYPTION_KEY="32-character-encryption-key-here"
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `apps/server/src/workspace/workspace.module.ts` | Workspace module with RBAC |
| `apps/server/src/workspace/service/workspace.service.ts` | Workspace business logic |
| `apps/server/src/workspace/guards/workspace-role.guard.ts` | Permission checking guard |
| `apps/server/src/system/module/notification/notification.service.ts` | Push notification service |
| `apps/client/public/sw.js` | Service Worker for push notifications |
| `apps/client/lib/push-notifications.ts` | Push notification client utilities |
| `apps/server/src/auth/service/auth.service.ts` | Core authentication logic |
| `apps/server/src/auth/controller/auth.controller.ts` | Auth API endpoints |
| `apps/server/prisma/schema.prisma` | Database schema (22 models) |
| `apps/server/src/config/configuration.ts` | Environment configuration |
| `apps/server/src/main.ts` | Server entry point |
| `apps/client/lib/api.ts` | Frontend API client with token refresh |
| `apps/client/store/auth-store.ts` | Auth state management |
| `docker/compose.yml` | Docker services (PostgreSQL, Redis) |

---

## 🎓 Learning Topics Covered

During development, we explored:

1. **Monorepo Architecture** - pnpm workspaces, shared dependencies
2. **Docker & Docker Compose** - Containers, volumes, networking
3. **NestJS Architecture** - Modules, Controllers, Services, DTOs, Guards, Interceptors
4. **JWT Authentication** - Access tokens, refresh tokens, rotation
5. **Prisma ORM** - Schema design, migrations, relations
6. **Rate Limiting Algorithms** - Sliding window, token bucket, leaky bucket
7. **Redis** - Caching, rate limiting (pending implementation)
8. **PostgreSQL** - Relational database design

---

## 🔄 Git Info

- **Main Branch:** `main` (auth feature merged)
- **GitHub:** [Your Repo URL]

---

## 📝 Notes

- Redis connection is prepared but not yet implemented
- Frontend pages exist but need real API integration
- Schema v2.0 supports full rate limiting features
- Auth is complete with JWT + refresh tokens
- Workspaces module with RBAC is fully functional
- Push notifications use FREE Web Push API
- See `docs/FREE_SERVICES_GUIDE.md` for all free services

---

**Last Updated:** January 6, 2026  
**Version:** 0.2.0 (Phase 4 Complete)



