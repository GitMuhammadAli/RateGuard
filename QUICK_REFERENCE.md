# 🚀 RateGuard - Quick Reference

## 📡 API Endpoints (47 Total)

### Auth (11)
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/profile
POST   /auth/verify-email
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/change-password
GET    /auth/sessions
DELETE /auth/sessions/:id
```

### Workspaces (11) ✨ NEW
```
POST   /workspaces
GET    /workspaces
GET    /workspaces/:id
GET    /workspaces/slug/:slug
PUT    /workspaces/:id
DELETE /workspaces/:id
GET    /workspaces/:id/members
POST   /workspaces/:id/members/invite
PUT    /workspaces/:id/members/:memberId/role
DELETE /workspaces/:id/members/:memberId
POST   /workspaces/:id/leave
POST   /workspaces/:id/transfer-ownership
GET    /workspaces/:id/invitations
DELETE /workspaces/:id/invitations/:invId
```

### Invitations (3) ✨ NEW
```
POST   /invitations/accept?token=xxx
POST   /invitations/decline?token=xxx
```

### Notifications (4) ✨ NEW
```
GET    /notifications/vapid-public-key
POST   /notifications/subscribe
DELETE /notifications/unsubscribe
POST   /notifications/test
```

### Users (3)
```
GET    /users/profile
PUT    /users/profile
DELETE /users/profile
```

---

## 🔑 Environment Variables

```env
# Database
DATABASE_URL="postgresql://rateguard:rateguard123@localhost:5432/rateguard"

# JWT
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Email (Mailtrap)
MAILTRAP_HOST="sandbox.smtp.mailtrap.io"
MAILTRAP_PORT="2525"
MAILTRAP_USER="your-user"
MAILTRAP_PASS="your-pass"
EMAIL_FROM="noreply@rateguard.io"

# Push (generate: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
VAPID_EMAIL="mailto:admin@rateguard.io"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# App
PORT=8080
FRONTEND_URL="http://localhost:3001"
```

---

## 🎬 Commands

```bash
# Start everything
pnpm dev

# Docker
pnpm docker:up        # Start PostgreSQL + Redis
pnpm docker:down      # Stop containers
pnpm docker:reset     # Reset all data

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Apply schema changes
pnpm db:studio        # Open Prisma Studio

# Push Notifications Setup
cd apps/server
npx web-push generate-vapid-keys
# Copy output to .env

# Build
pnpm build            # Build all
pnpm build:server     # Build server only
pnpm build:client     # Build client only
```

---

## 🔐 RBAC Roles

| Role | Create | Invite | Update | Remove | Delete | Transfer |
|------|--------|--------|--------|--------|--------|----------|
| **VIEWER** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **DEVELOPER** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **ADMIN** | ✅ | ✅ | ✅ | ✅* | ❌ | ❌ |
| **OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*ADMIN can't remove other ADMINs

---

## 📊 Free Services

| Service | Free Tier | Use Case |
|---------|-----------|----------|
| Mailtrap | 1K/month | Email testing |
| Web Push | Unlimited | Browser notifications |
| Resend | 3K/month | Production emails |
| Sentry | 5K events | Error tracking |
| PostHog | 1M events | Analytics |
| Cloudflare R2 | 10GB | File storage |
| Google OAuth | Unlimited | Social login |
| GitHub OAuth | Unlimited | Social login |

---

## 🐛 Troubleshooting

### "VAPID keys not configured"
```bash
cd apps/server
npx web-push generate-vapid-keys
# Add to .env
```

### "Prisma Client not found"
```bash
pnpm db:generate
```

### "Port already in use"
```bash
# Change PORT in .env or kill process:
npx kill-port 8080
```

### "Docker not running"
```
# Start Docker Desktop, then:
pnpm docker:up
```

---

## 📖 Documentation

- **PHASE_4_SUMMARY.md** - Complete feature list
- **FREE_SERVICES_GUIDE.md** - All free services
- **PUSH_NOTIFICATIONS_GUIDE.md** - Push setup guide
- **PROJECT_CONTEXT.md** - Full project overview
- **AUTH_COMPLETE_GUIDE.md** - Auth system details

---

## 🎯 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:8080 |
| Swagger API Docs | http://localhost:8080/api/docs |
| Prisma Studio | Run `pnpm db:studio` |

---

**Phase 4 Complete - 40% Done! 🚀**

