# 🆓 Free Services Guide for RateGuard

> All the free tools and services you can use for your resume project!

---

## 📧 Email Services

### Mailtrap (Currently Using) ✅
**Free Tier:** 1,000 emails/month

```env
# .env
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-user
MAILTRAP_PASS=your-pass
EMAIL_FROM=noreply@rateguard.io
EMAIL_FROM_NAME=RateGuard
```

**Perfect for:** Development & testing emails

### Resend (Production Alternative)
**Free Tier:** 3,000 emails/month
**Website:** https://resend.com

```env
RESEND_API_KEY=re_xxxxx
```

### SendGrid (Backup)
**Free Tier:** 100 emails/day forever
**Website:** https://sendgrid.com

---

## 🔔 Push Notifications (Web Push API)

### Setup (One-Time)

```bash
# Generate VAPID keys
cd apps/server
npx web-push generate-vapid-keys
```

Add to `.env`:
```env
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yVi...
VAPID_PRIVATE_KEY=UUxI4O8-FbRouAF7-LH_...
VAPID_EMAIL=mailto:admin@rateguard.io
```

### How It Works
1. **FREE** - No third-party service needed!
2. Works in Chrome, Firefox, Edge, Safari
3. Notifications work even when browser is closed
4. Perfect for alerts (budget exceeded, rate limits, etc.)

### Frontend Usage
```typescript
import { subscribeToPush, sendTestNotification } from '@/lib/push-notifications';

// Subscribe user
await subscribeToPush(accessToken);

// Test it
await sendTestNotification(accessToken);
```

---

## ⚡ Real-Time Updates (Socket.io)

### Already Supported!
Self-hosted, completely free.

```bash
pnpm --filter @rateguard/server add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

**Use cases:**
- Live dashboard updates
- Real-time request logs
- Instant alert notifications

---

## 📊 Analytics & Monitoring

### Sentry (Error Tracking)
**Free Tier:** 5,000 events/month
**Website:** https://sentry.io

```bash
pnpm add @sentry/nestjs @sentry/node
```

```typescript
// main.ts
import * as Sentry from '@sentry/nestjs';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### PostHog (Product Analytics)
**Free Tier:** 1M events/month
**Website:** https://posthog.com

```bash
pnpm add posthog-node  # Backend
pnpm add posthog-js    # Frontend
```

### Uptime Robot (Health Monitoring)
**Free Tier:** 50 monitors, 5-min intervals
**Website:** https://uptimerobot.com

Monitor your API endpoints for free!

---

## 🗄️ File Storage

### Cloudflare R2
**Free Tier:** 10GB storage, 1M requests/month
**Website:** https://developers.cloudflare.com/r2

```env
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=rateguard
```

### UploadThing
**Free Tier:** 2GB storage
**Website:** https://uploadthing.com

Great for user avatar uploads!

---

## 🔐 OAuth Providers (Social Login)

### Google OAuth
**Free:** Unlimited
**Setup:** https://console.cloud.google.com

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback
```

### GitHub OAuth
**Free:** Unlimited
**Setup:** https://github.com/settings/developers

```env
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
GITHUB_CALLBACK_URL=http://localhost:8080/auth/github/callback
```

---

## 🔗 Webhook Testing

### Webhook.site
**Free:** Public URL for testing webhooks
**Website:** https://webhook.site

Perfect for testing your webhook delivery system!

### ngrok (Local Testing)
**Free Tier:** 1 agent, 20 connections/min
**Website:** https://ngrok.com

```bash
ngrok http 8080
```

---

## 📱 SMS Notifications (Optional)

### Twilio
**Free Trial:** $15 credit
**Website:** https://twilio.com

### Vonage (Nexmo)
**Free Trial:** €2 credit
**Website:** https://vonage.com

---

## 🧪 Testing Tools

### k6 (Load Testing)
**Free:** Open source
**Website:** https://k6.io

```bash
# Install
choco install k6  # Windows
brew install k6   # Mac

# Run load test
k6 run load-test.js
```

### Postman
**Free Tier:** Unlimited API testing
**Website:** https://postman.com

---

## 🐳 Infrastructure (Already Using)

### Docker + Docker Compose ✅
- PostgreSQL container
- Redis container
- All FREE and self-hosted!

---

## 📋 Complete .env Template

```env
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="postgresql://rateguard:rateguard123@localhost:5432/rateguard"

# ===========================================
# JWT
# ===========================================
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# ===========================================
# REDIS (for rate limiting)
# ===========================================
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# ===========================================
# EMAIL (Mailtrap - Free)
# ===========================================
MAILTRAP_HOST="sandbox.smtp.mailtrap.io"
MAILTRAP_PORT="2525"
MAILTRAP_USER="your-user"
MAILTRAP_PASS="your-pass"
EMAIL_FROM="noreply@rateguard.io"
EMAIL_FROM_NAME="RateGuard"

# ===========================================
# PUSH NOTIFICATIONS (Web Push - Free)
# ===========================================
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_EMAIL="mailto:admin@rateguard.io"

# ===========================================
# OAUTH (Optional - Free)
# ===========================================
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# ===========================================
# ERROR TRACKING (Sentry - Free tier)
# ===========================================
SENTRY_DSN=""

# ===========================================
# FILE STORAGE (Cloudflare R2 - Free tier)
# ===========================================
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="rateguard"

# ===========================================
# APP CONFIG
# ===========================================
PORT=8080
NODE_ENV="development"
CORS_ORIGINS="http://localhost:3001"
FRONTEND_URL="http://localhost:3001"
```

---

## 💡 Cost Summary

| Service | Monthly Cost | What You Get |
|---------|--------------|--------------|
| Mailtrap | $0 | 1,000 test emails |
| Web Push | $0 | Unlimited notifications |
| Sentry | $0 | 5K error events |
| PostHog | $0 | 1M analytics events |
| Uptime Robot | $0 | 50 monitors |
| Cloudflare R2 | $0 | 10GB storage |
| Google OAuth | $0 | Unlimited |
| GitHub OAuth | $0 | Unlimited |
| Docker | $0 | Self-hosted |
| **Total** | **$0** | 🎉 |

---

## 🚀 Quick Setup Checklist

- [x] PostgreSQL (Docker)
- [x] Redis (Docker)
- [x] Mailtrap (Email testing)
- [x] Web Push (Notifications)
- [ ] VAPID keys generated
- [ ] Sentry account (optional)
- [ ] Google OAuth (optional)
- [ ] GitHub OAuth (optional)

---

**Perfect for a resume project - all these services have generous free tiers!** 🎓

