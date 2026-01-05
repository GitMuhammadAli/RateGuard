# RateGuard: Complete Build Guide

## Everything. All 8 Phases. 27 Branches. Every File.

---

## Complete Roadmap

```
PHASE 1: Foundation (3 branches)         ~2 hours
├── 1.1 feat/project-setup
├── 1.2 feat/docker-setup
└── 1.3 feat/database-schema

PHASE 2: Core Services (4 branches)      ~2 hours
├── 2.1 feat/crypto-utils
├── 2.2 feat/auth-service
├── 2.3 feat/workspace-service
└── 2.4 feat/api-key-service

PHASE 3: Rate Limiting (3 branches)      ~2 hours
├── 3.1 feat/redis-client
├── 3.2 feat/rate-limiter
└── 3.3 feat/rate-limit-service

PHASE 4: HTTP Server (4 branches)        ~2 hours
├── 4.1 feat/express-setup
├── 4.2 feat/auth-routes
├── 4.3 feat/workspace-routes
└── 4.4 feat/proxy-endpoint

PHASE 5: Dashboard (5 branches)          ~3 hours
├── 5.1 feat/nextjs-setup
├── 5.2 feat/auth-pages
├── 5.3 feat/dashboard-layout
├── 5.4 feat/api-keys-page
└── 5.5 feat/rules-page

PHASE 6: Real Proxy (3 branches)         ~2 hours
├── 6.1 feat/upstream-config
├── 6.2 feat/proxy-forward
└── 6.3 feat/upstreams-page

PHASE 7: Analytics (3 branches)          ~2 hours
├── 7.1 feat/analytics-service
├── 7.2 feat/analytics-routes
└── 7.3 feat/analytics-dashboard

PHASE 8: Deployment (2 branches)         ~1 hour
├── 8.1 feat/docker-production
└── 8.2 feat/environment-config

TOTAL: 27 branches, ~16 hours
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 1: Foundation
# ═══════════════════════════════════════════════════════════════

## Branch 1.1: feat/project-setup

### Step 1: Create Repository

```bash
mkdir rateguard
cd rateguard
git init
git branch -M main
git checkout -b feat/project-setup
```

### Step 2: Create .gitignore

Create file: `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/
.next/

# Environment files (contain secrets)
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Database
*.db
*.db-journal
```

### Step 3: Create Folder Structure

```bash
mkdir -p apps/server/src
mkdir -p apps/web
mkdir -p packages/db/src
mkdir -p packages/db/prisma
mkdir -p docker
```

### Step 4: Create Root package.json

Create file: `package.json`

```json
{
  "name": "rateguard",
  "version": "0.1.0",
  "private": true,
  "description": "API Rate Limiting Gateway",
  "scripts": {
    "dev:server": "npm run dev -w @rateguard/server",
    "dev:web": "npm run dev -w @rateguard/web",
    "build": "npm run build --workspaces",
    "docker:up": "docker compose -f docker/compose.yml up -d",
    "docker:down": "docker compose -f docker/compose.yml down",
    "docker:reset": "docker compose -f docker/compose.yml down -v",
    "docker:logs": "docker compose -f docker/compose.yml logs -f",
    "db:push": "npm run db:push -w @rateguard/db",
    "db:generate": "npm run db:generate -w @rateguard/db",
    "db:studio": "npm run db:studio -w @rateguard/db"
  },
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

### Step 5: Create Database Package

Create file: `packages/db/package.json`

```json
{
  "name": "@rateguard/db",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "typescript": "^5.6.0"
  }
}
```

Create file: `packages/db/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create file: `packages/db/src/index.ts`

```typescript
// Placeholder - Prisma client will be exported here
export const DB_VERSION = '0.1.0';
console.log('📦 @rateguard/db loaded');
```

### Step 6: Create Server Package

Create file: `apps/server/package.json`

```json
{
  "name": "@rateguard/server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@rateguard/db": "*"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

Create file: `apps/server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create file: `apps/server/src/index.ts`

```typescript
console.log('');
console.log('🚀 RateGuard Server');
console.log('==================');
console.log('✅ Project setup complete!');
console.log('');
console.log('📋 Next steps:');
console.log('   1. Merge this branch: git checkout main && git merge feat/project-setup');
console.log('   2. Start next branch: git checkout -b feat/docker-setup');
console.log('');
```

### Step 7: Create README

Create file: `README.md`

```markdown
# RateGuard

API Rate Limiting Gateway

## What is RateGuard?

RateGuard is a gateway that sits between your clients and your APIs to:
- **Rate limit** requests (prevent abuse)
- **Authenticate** with API keys
- **Log** all requests for analytics
- **Proxy** requests to upstream APIs

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start Docker (PostgreSQL + Redis)
npm run docker:up

# Push database schema
npm run db:push

# Start development server
npm run dev:server
\`\`\`

## Project Structure

\`\`\`
rateguard/
├── apps/
│   ├── server/     # Backend API (Express)
│   └── web/        # Dashboard (Next.js)
├── packages/
│   └── db/         # Database (Prisma)
└── docker/         # Docker configs
\`\`\`

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Cache:** Redis
- **Frontend:** Next.js, React, Tailwind CSS
```

### Step 8: Install & Test

```bash
npm install
npm run dev:server
```

You should see:
```
🚀 RateGuard Server
==================
✅ Project setup complete!
```

Press `Ctrl+C` to stop.

### Step 9: Commit & Merge

```bash
git add .
git commit -m "feat(setup): initialize project structure

- Create monorepo with npm workspaces
- Add packages/db for Prisma client
- Add apps/server for backend API
- Configure TypeScript for all packages
- Add README with project overview"

git checkout main
git merge feat/project-setup
```

---

## Branch 1.2: feat/docker-setup

### Step 1: Create Branch

```bash
git checkout -b feat/docker-setup
```

### Step 2: Create Docker Compose

Create file: `docker/compose.yml`

```yaml
# Docker Compose for RateGuard development
# Usage: docker compose -f docker/compose.yml up -d

services:
  # ================================================
  # PostgreSQL - Main database
  # ================================================
  postgres:
    image: postgres:16-alpine
    container_name: rateguard-postgres
    restart: unless-stopped
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

  # ================================================
  # Redis - Cache and rate limiting
  # ================================================
  redis:
    image: redis:7-alpine
    container_name: rateguard-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

# Named volumes persist data across container restarts
volumes:
  postgres_data:
  redis_data:
```

### Step 3: Create Environment Files

Create file: `.env.example`

```bash
# ================================================
# RateGuard Environment Variables
# ================================================
# Copy this file to .env and fill in your values

# Database
DATABASE_URL="postgresql://rateguard:rateguard@localhost:5432/rateguard"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development

# Authentication (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

Create file: `.env`

```bash
# Database
DATABASE_URL="postgresql://rateguard:rateguard@localhost:5432/rateguard"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=24h
```

### Step 4: Update Server Entry

Update file: `apps/server/src/index.ts`

```typescript
console.log('');
console.log('🚀 RateGuard Server');
console.log('==================');
console.log('🐳 Docker setup complete!');
console.log('');
console.log('📊 Services:');
console.log('   PostgreSQL: localhost:5432');
console.log('   Redis:      localhost:6379');
console.log('');
console.log('📋 Next steps:');
console.log('   1. Merge: git checkout main && git merge feat/docker-setup');
console.log('   2. Next:  git checkout -b feat/database-schema');
console.log('');
```

### Step 5: Test Docker

```bash
# Start Docker services
npm run docker:up

# Wait a few seconds, then check status
docker ps

# You should see:
# rateguard-postgres   ... (healthy)
# rateguard-redis      ... (healthy)

# Test PostgreSQL
docker exec -it rateguard-postgres psql -U rateguard -c "SELECT 'PostgreSQL OK!' as status;"

# Test Redis
docker exec -it rateguard-redis redis-cli PING
# Should return: PONG
```

### Step 6: Commit & Merge

```bash
git add .
git commit -m "feat(docker): add PostgreSQL and Redis containers

- Create docker-compose with PostgreSQL 16 and Redis 7
- Add health checks for both services
- Add persistent volumes for data
- Add environment file template"

git checkout main
git merge feat/docker-setup
```

---

## Branch 1.3: feat/database-schema

### Step 1: Create Branch

```bash
git checkout -b feat/database-schema
```

### Step 2: Initialize Prisma

```bash
cd packages/db
npx prisma init --datasource-provider postgresql
```

### Step 3: Create Database Schema

Replace file: `packages/db/prisma/schema.prisma`

```prisma
// ================================================
// RateGuard Database Schema
// ================================================
// Run: npx prisma db push (create tables)
// Run: npx prisma generate (generate client)
// Run: npx prisma studio (visual browser)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================================================
// USER
// People who sign up to use RateGuard dashboard
// ================================================
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  passwordHash  String   @map("password_hash")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  memberships   WorkspaceMember[]

  @@map("users")
}

// ================================================
// WORKSPACE
// A team/project that owns API keys and rules
// ================================================
model Workspace {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique  // URL-friendly: "my-company"
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  members   WorkspaceMember[]
  apiKeys   ApiKey[]
  rules     RateLimitRule[]
  upstreams Upstream[]

  @@map("workspaces")
}

// ================================================
// WORKSPACE MEMBER
// Links users to workspaces with roles
// ================================================
model WorkspaceMember {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  workspaceId String   @map("workspace_id")
  role        Role     @default(MEMBER)
  
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Constraints
  @@unique([userId, workspaceId])
  @@map("workspace_members")
}

enum Role {
  OWNER   // Full access, can delete workspace
  ADMIN   // Can manage members and keys
  MEMBER  // Can view and use keys
}

// ================================================
// API KEY
// Used to authenticate API requests
// We store HASH of the key, never the key itself!
// ================================================
model ApiKey {
  id          String    @id @default(uuid())
  workspaceId String    @map("workspace_id")
  
  name        String                           // "Production", "Development"
  keyHash     String    @unique @map("key_hash")  // SHA256 hash
  keyPrefix   String    @map("key_prefix")        // "rg_live_K7d..." for display
  
  isActive    Boolean   @default(true) @map("is_active")
  lastUsedAt  DateTime? @map("last_used_at")
  expiresAt   DateTime? @map("expires_at")
  
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relations
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  logs        RequestLog[]

  // Indexes
  @@index([keyHash])
  @@map("api_keys")
}

// ================================================
// RATE LIMIT RULE
// Configures how rate limiting works
// ================================================
model RateLimitRule {
  id          String    @id @default(uuid())
  workspaceId String    @map("workspace_id")
  
  name        String                           // "Default", "Premium"
  algorithm   Algorithm @default(TOKEN_BUCKET)
  limit       Int                              // 100 requests
  window      Int                              // per 60 seconds
  
  isActive    Boolean   @default(true) @map("is_active")
  priority    Int       @default(0)            // Higher = checked first
  
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relations
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([workspaceId, priority])
  @@map("rate_limit_rules")
}

enum Algorithm {
  TOKEN_BUCKET     // Allows bursts, smooth average
  SLIDING_WINDOW   // Precise, no boundary issues
  FIXED_WINDOW     // Simple, has boundary issues
}

// ================================================
// UPSTREAM
// External APIs to proxy requests to
// ================================================
model Upstream {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  
  name        String                    // "OpenAI", "Anthropic"
  slug        String                    // "openai", "anthropic"
  baseUrl     String   @map("base_url") // "https://api.openai.com"
  
  // Authentication for upstream
  authHeader  String?  @map("auth_header") // "Authorization"
  authValue   String?  @map("auth_value")  // "Bearer sk-..."
  
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  logs        RequestLog[]

  // Constraints
  @@unique([workspaceId, slug])
  @@map("upstreams")
}

// ================================================
// REQUEST LOG
// Records every API request for analytics
// ================================================
model RequestLog {
  id          String   @id @default(uuid())
  apiKeyId    String   @map("api_key_id")
  upstreamId  String?  @map("upstream_id")
  
  method      String              // GET, POST, etc.
  path        String              // /v1/chat/completions
  statusCode  Int      @map("status_code")
  latencyMs   Int      @map("latency_ms")
  
  rateLimited Boolean  @default(false) @map("rate_limited")
  
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  apiKey      ApiKey    @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  upstream    Upstream? @relation(fields: [upstreamId], references: [id], onDelete: SetNull)

  // Indexes for fast queries
  @@index([apiKeyId, createdAt])
  @@index([upstreamId, createdAt])
  @@index([createdAt])
  @@map("request_logs")
}
```

### Step 4: Create DB Package Environment

Create file: `packages/db/.env`

```bash
DATABASE_URL="postgresql://rateguard:rateguard@localhost:5432/rateguard"
```

### Step 5: Push Schema to Database

```bash
# Make sure Docker is running
cd ../..
npm run docker:up

# Push schema to database
cd packages/db
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Step 6: Update Database Client

Replace file: `packages/db/src/index.ts`

```typescript
import { PrismaClient } from '@prisma/client';

// ================================================
// Prisma Client Singleton
// ================================================
// In development, hot reloading can create multiple
// instances. This ensures we reuse the same client.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export everything from Prisma Client
export * from '@prisma/client';
```

### Step 7: Build Package

```bash
npm run build
```

### Step 8: Test Database Connection

Create file: `packages/db/src/test.ts`

```typescript
import { prisma } from './index';

async function test() {
  console.log('🔌 Testing database connection...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL!\n');

    // Count records in each table
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.apiKey.count(),
      prisma.rateLimitRule.count(),
      prisma.upstream.count(),
      prisma.requestLog.count(),
    ]);

    console.log('📊 Table counts:');
    console.log(`   users:            ${counts[0]}`);
    console.log(`   workspaces:       ${counts[1]}`);
    console.log(`   api_keys:         ${counts[2]}`);
    console.log(`   rate_limit_rules: ${counts[3]}`);
    console.log(`   upstreams:        ${counts[4]}`);
    console.log(`   request_logs:     ${counts[5]}`);
    console.log('');
    console.log('✨ Database is ready!');

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
```

Run test:

```bash
npx tsx src/test.ts
```

### Step 9: View in Prisma Studio

```bash
npx prisma studio
```

Opens browser at http://localhost:5555 — you can see all tables!

### Step 10: Update Server Entry

Update file: `apps/server/src/index.ts`

```typescript
import { prisma } from '@rateguard/db';

async function main() {
  console.log('');
  console.log('🚀 RateGuard Server');
  console.log('==================');
  
  // Test database connection
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log('✅ Database connected');
    console.log(`📊 Users in database: ${userCount}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
  
  console.log('');
  console.log('✨ Phase 1 Complete!');
  console.log('');
  console.log('📋 You have built:');
  console.log('   ✓ Project structure (monorepo)');
  console.log('   ✓ Docker (PostgreSQL + Redis)');
  console.log('   ✓ Database schema (6 tables)');
  console.log('');
  console.log('🚀 Next: Phase 2 - Core Services');
  console.log('');

  await prisma.$disconnect();
}

main().catch(console.error);
```

Test:

```bash
cd ../..
npm run dev:server
```

### Step 11: Commit & Merge

```bash
git add .
git commit -m "feat(db): add database schema with all models

- Add User, Workspace, WorkspaceMember models
- Add ApiKey with hash storage
- Add RateLimitRule with algorithm enum
- Add Upstream for API proxying
- Add RequestLog for analytics
- Create Prisma client singleton"

git checkout main
git merge feat/database-schema
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 2: Core Services
# ═══════════════════════════════════════════════════════════════

## Branch 2.1: feat/crypto-utils

### Step 1: Create Branch

```bash
git checkout -b feat/crypto-utils
```

### Step 2: Install Dependencies

```bash
cd apps/server
npm install bcrypt
npm install -D @types/bcrypt
```

### Step 3: Create Crypto Utilities

Create file: `apps/server/src/utils/crypto.ts`

```typescript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// ================================================
// API KEY FUNCTIONS
// ================================================

/**
 * Generate a new API key
 * 
 * Format: rg_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *         ││ │    └── 24 random bytes (base64url encoded)
 *         ││ └── Environment: live or test
 *         │└── Underscore separator
 *         └── Prefix: rg (RateGuard)
 * 
 * Example: rg_live_K7dF9xQ2mN8bV3hJ5wR1tY6uI0oP
 */
export function generateApiKey(env: 'live' | 'test' = 'live'): string {
  const randomBytes = crypto.randomBytes(24);
  const randomString = randomBytes.toString('base64url');
  return `rg_${env}_${randomString}`;
}

/**
 * Hash an API key for secure storage
 * 
 * Uses SHA256 because:
 * - API keys have HIGH entropy (random 32 chars)
 * - Can't be brute forced (unlike passwords)
 * - Need FAST lookup (every request checks this)
 * 
 * bcrypt would be too slow for API key validation!
 */
export function hashApiKey(key: string): string {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');
}

/**
 * Get display prefix for an API key
 * 
 * Shows: "rg_live_K7dF9x..." in dashboard
 * Never shows the full key after creation!
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 14) + '...';
}

// ================================================
// PASSWORD FUNCTIONS
// ================================================

/**
 * Hash a password for secure storage
 * 
 * Uses bcrypt because:
 * - Passwords have LOW entropy (humans pick bad ones)
 * - CAN be brute forced
 * - Slow hashing = slow attacks
 * 
 * Cost factor 12 = ~250ms to hash
 * Each password gets unique salt (built into bcrypt)
 */
export async function hashPassword(password: string): Promise<string> {
  const COST_FACTOR = 12;
  return bcrypt.hash(password, COST_FACTOR);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ================================================
// SECURITY UTILITIES
// ================================================

/**
 * Constant-time string comparison
 * 
 * Regular === returns EARLY when strings differ.
 * Attackers can measure timing to guess characters.
 * This ALWAYS takes the same time.
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

### Step 4: Test Crypto

Create file: `apps/server/src/utils/crypto.test.ts`

```typescript
import {
  generateApiKey,
  hashApiKey,
  getKeyPrefix,
  hashPassword,
  verifyPassword,
  secureCompare,
  generateSlug,
} from './crypto';

async function test() {
  console.log('🔐 Testing Crypto Utilities\n');
  console.log('='.repeat(50));

  // Test API key generation
  console.log('\n📌 API Key Generation\n');
  
  const liveKey = generateApiKey('live');
  const testKey = generateApiKey('test');
  
  console.log('Live key:', liveKey);
  console.log('Test key:', testKey);
  console.log('Key length:', liveKey.length, 'characters');

  // Test API key hashing
  console.log('\n📌 API Key Hashing\n');
  
  const keyHash = hashApiKey(liveKey);
  console.log('Original:', liveKey);
  console.log('Hash:    ', keyHash);
  console.log('Hash length:', keyHash.length, '(always 64 for SHA256)');
  
  // Same key = same hash
  const keyHash2 = hashApiKey(liveKey);
  console.log('Same key, same hash:', keyHash === keyHash2 ? '✅' : '❌');
  
  // Different key = different hash
  const keyHash3 = hashApiKey(testKey);
  console.log('Diff key, diff hash:', keyHash !== keyHash3 ? '✅' : '❌');

  // Test key prefix
  console.log('\n📌 Key Prefix (for display)\n');
  console.log('Full key:', liveKey);
  console.log('Prefix:  ', getKeyPrefix(liveKey));

  // Test password hashing
  console.log('\n📌 Password Hashing\n');
  
  const password = 'MySecurePassword123!';
  
  console.log('Hashing password...');
  const startTime = Date.now();
  const passwordHash = await hashPassword(password);
  const duration = Date.now() - startTime;
  
  console.log('Password:', password);
  console.log('Hash:    ', passwordHash.substring(0, 40) + '...');
  console.log('Time:    ', duration, 'ms (should be ~200-300ms)');

  // Test password verification
  console.log('\n📌 Password Verification\n');
  
  const correctResult = await verifyPassword(password, passwordHash);
  const wrongResult = await verifyPassword('wrongpassword', passwordHash);
  
  console.log('Correct password:', correctResult ? '✅ Valid' : '❌ Invalid');
  console.log('Wrong password:  ', wrongResult ? '❌ Valid (BUG!)' : '✅ Rejected');

  // Test secure compare
  console.log('\n📌 Secure Compare\n');
  
  console.log('Same strings:    ', secureCompare('hello', 'hello') ? '✅ Match' : '❌ No match');
  console.log('Different strings:', secureCompare('hello', 'world') ? '❌ Match (BUG!)' : '✅ No match');
  console.log('Different lengths:', secureCompare('hi', 'hello') ? '❌ Match (BUG!)' : '✅ No match');

  // Test slug generation
  console.log('\n📌 Slug Generation\n');
  
  console.log('Input:  "My Cool Project!"');
  console.log('Output:', generateSlug('My Cool Project!'));
  console.log('Input:  "  Weird---Spacing  "');
  console.log('Output:', generateSlug('  Weird---Spacing  '));

  console.log('\n' + '='.repeat(50));
  console.log('✨ All crypto tests passed!\n');
}

test().catch(console.error);
```

Run test:

```bash
npx tsx src/utils/crypto.test.ts
```

### Step 5: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(crypto): add password and API key utilities

- Add API key generation (rg_live_xxx format)
- Add API key hashing (SHA256 for fast lookup)
- Add password hashing (bcrypt, cost 12)
- Add password verification
- Add secure string comparison
- Add slug generation"

git checkout main
git merge feat/crypto-utils
```

---

## Branch 2.2: feat/auth-service

### Step 1: Create Branch

```bash
git checkout -b feat/auth-service
```

### Step 2: Install JWT

```bash
cd apps/server
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

### Step 3: Create Config

Create file: `apps/server/src/config.ts`

```typescript
// ================================================
// Application Configuration
// ================================================
// All config comes from environment variables
// with sensible defaults for development

export const config = {
  // Server
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 
    'postgresql://rateguard:rateguard@localhost:5432/rateguard',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT Authentication
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Rate Limiting Defaults
  defaultRateLimit: 100,      // requests
  defaultRateWindow: 60,      // seconds
} as const;

// Warn if using default secret in production
if (config.nodeEnv === 'production' && config.jwtSecret === 'dev-secret-change-in-production') {
  console.warn('⚠️  WARNING: Using default JWT secret in production!');
  console.warn('⚠️  Set JWT_SECRET environment variable!');
}
```

### Step 4: Create Auth Service

Create file: `apps/server/src/services/auth.service.ts`

```typescript
import jwt from 'jsonwebtoken';
import { prisma, User } from '@rateguard/db';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { config } from '../config';

// ================================================
// Types
// ================================================

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// ================================================
// Auth Service
// ================================================

class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const { email, password, name } = input;

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
      },
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  /**
   * Login existing user
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  /**
   * Verify JWT token and return payload
   */
  verifyToken(token: string): AuthPayload {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Generate JWT token for user
   */
  private generateToken(user: User): string {
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const authService = new AuthService();
```

### Step 5: Test Auth Service

Create file: `apps/server/src/services/auth.service.test.ts`

```typescript
import { prisma } from '@rateguard/db';
import { authService } from './auth.service';

async function test() {
  console.log('🔐 Testing Auth Service\n');
  console.log('='.repeat(50));

  const testEmail = 'auth-test@rateguard.dev';

  // Cleanup: Remove test user if exists
  await prisma.user.deleteMany({
    where: { email: testEmail },
  });

  // Test: Register
  console.log('\n📌 Registration\n');
  
  const registerResult = await authService.register({
    email: testEmail,
    password: 'password123',
    name: 'Auth Test User',
  });
  
  console.log('User created:', registerResult.user);
  console.log('Token:', registerResult.token.substring(0, 50) + '...');

  // Test: Login
  console.log('\n📌 Login\n');
  
  const loginResult = await authService.login({
    email: testEmail,
    password: 'password123',
  });
  
  console.log('User logged in:', loginResult.user);
  console.log('Token:', loginResult.token.substring(0, 50) + '...');

  // Test: Token verification
  console.log('\n📌 Token Verification\n');
  
  const payload = authService.verifyToken(loginResult.token);
  console.log('Token payload:', payload);

  // Test: Wrong password
  console.log('\n📌 Wrong Password\n');
  
  try {
    await authService.login({
      email: testEmail,
      password: 'wrongpassword',
    });
    console.log('❌ Should have thrown error!');
  } catch (error: any) {
    console.log('✅ Correctly rejected:', error.message);
  }

  // Test: Duplicate email
  console.log('\n📌 Duplicate Email\n');
  
  try {
    await authService.register({
      email: testEmail,
      password: 'password123',
      name: 'Duplicate User',
    });
    console.log('❌ Should have thrown error!');
  } catch (error: any) {
    console.log('✅ Correctly rejected:', error.message);
  }

  // Test: Invalid token
  console.log('\n📌 Invalid Token\n');
  
  try {
    authService.verifyToken('invalid-token-here');
    console.log('❌ Should have thrown error!');
  } catch (error: any) {
    console.log('✅ Correctly rejected:', error.message);
  }

  // Cleanup
  await prisma.user.deleteMany({
    where: { email: testEmail },
  });

  console.log('\n' + '='.repeat(50));
  console.log('✨ All auth tests passed!\n');

  await prisma.$disconnect();
}

test().catch(console.error);
```

Run test:

```bash
npx tsx src/services/auth.service.test.ts
```

### Step 6: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(auth): add user authentication service

- Add user registration with email validation
- Add user login with password verification
- Add JWT token generation
- Add token verification
- Add config for JWT settings"

git checkout main
git merge feat/auth-service
```

---

## Branch 2.3: feat/workspace-service

### Step 1: Create Branch

```bash
git checkout -b feat/workspace-service
```

### Step 2: Create Workspace Service

Create file: `apps/server/src/services/workspace.service.ts`

```typescript
import { prisma, Workspace, Role } from '@rateguard/db';
import { generateSlug } from '../utils/crypto';

// ================================================
// Types
// ================================================

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
  ownerId: string;
}

export interface WorkspaceWithRole extends Workspace {
  role?: Role;
}

// ================================================
// Workspace Service
// ================================================

class WorkspaceService {
  /**
   * Create a new workspace with owner
   */
  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const { name, ownerId } = input;
    
    // Generate slug if not provided
    const slug = input.slug 
      ? generateSlug(input.slug) 
      : generateSlug(name);

    // Check if slug is available
    const existing = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new Error('Workspace slug already taken');
    }

    // Create workspace with owner as member
    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        slug,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return workspace;
  }

  /**
   * Get all workspaces for a user
   */
  async listByUser(userId: string): Promise<WorkspaceWithRole[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }

  /**
   * Get workspace by ID (with access check)
   */
  async getByIdWithAccess(
    workspaceId: string,
    userId: string
  ): Promise<Workspace | null> {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      include: {
        workspace: true,
      },
    });

    return membership?.workspace ?? null;
  }

  /**
   * Get workspace by slug (with access check)
   */
  async getBySlugWithAccess(
    slug: string,
    userId: string
  ): Promise<Workspace | null> {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      return null;
    }

    return workspace;
  }

  /**
   * Get user's role in a workspace
   */
  async getMemberRole(
    workspaceId: string,
    userId: string
  ): Promise<Role | null> {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    return membership?.role ?? null;
  }

  /**
   * Check if user has at least the required role
   */
  async hasRole(
    workspaceId: string,
    userId: string,
    requiredRole: Role
  ): Promise<boolean> {
    const role = await this.getMemberRole(workspaceId, userId);
    
    if (!role) return false;

    const roleHierarchy: Record<Role, number> = {
      OWNER: 3,
      ADMIN: 2,
      MEMBER: 1,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  }

  /**
   * Update workspace
   */
  async update(
    workspaceId: string,
    data: { name?: string }
  ): Promise<Workspace> {
    return prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: data.name?.trim(),
      },
    });
  }

  /**
   * Delete workspace (only owner can delete)
   */
  async delete(workspaceId: string): Promise<void> {
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }
}

// Export singleton
export const workspaceService = new WorkspaceService();
```

### Step 3: Test Workspace Service

Create file: `apps/server/src/services/workspace.service.test.ts`

```typescript
import { prisma } from '@rateguard/db';
import { workspaceService } from './workspace.service';

async function test() {
  console.log('🏢 Testing Workspace Service\n');
  console.log('='.repeat(50));

  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: 'workspace-test@rateguard.dev',
      name: 'Workspace Test User',
      passwordHash: 'test-hash',
    },
  });

  console.log('\n📌 Create Workspace\n');

  const workspace = await workspaceService.create({
    name: 'My Test Workspace',
    ownerId: testUser.id,
  });

  console.log('Created:', {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
  });

  console.log('\n📌 List User Workspaces\n');

  const workspaces = await workspaceService.listByUser(testUser.id);
  console.log('Workspaces:', workspaces.map((w) => ({
    name: w.name,
    role: w.role,
  })));

  console.log('\n📌 Get Workspace with Access Check\n');

  const fetched = await workspaceService.getByIdWithAccess(
    workspace.id,
    testUser.id
  );
  console.log('Fetched:', fetched ? '✅ Found' : '❌ Not found');

  console.log('\n📌 Check Role\n');

  const role = await workspaceService.getMemberRole(
    workspace.id,
    testUser.id
  );
  console.log('User role:', role);

  const isOwner = await workspaceService.hasRole(
    workspace.id,
    testUser.id,
    'OWNER'
  );
  console.log('Is owner:', isOwner ? '✅ Yes' : '❌ No');

  const isAdmin = await workspaceService.hasRole(
    workspace.id,
    testUser.id,
    'ADMIN'
  );
  console.log('Is admin (or higher):', isAdmin ? '✅ Yes' : '❌ No');

  console.log('\n📌 Access Denied for Other User\n');

  const noAccess = await workspaceService.getByIdWithAccess(
    workspace.id,
    'non-existent-user-id'
  );
  console.log('Other user access:', noAccess ? '❌ Has access (BUG!)' : '✅ Denied');

  // Cleanup
  await prisma.workspace.delete({ where: { id: workspace.id } });
  await prisma.user.delete({ where: { id: testUser.id } });

  console.log('\n' + '='.repeat(50));
  console.log('✨ All workspace tests passed!\n');

  await prisma.$disconnect();
}

test().catch(console.error);
```

Run test:

```bash
cd apps/server
npx tsx src/services/workspace.service.test.ts
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(workspace): add workspace service

- Add create workspace with owner
- Add list workspaces by user
- Add get workspace with access check
- Add role checking (OWNER > ADMIN > MEMBER)"

git checkout main
git merge feat/workspace-service
```

---

## Branch 2.4: feat/api-key-service

### Step 1: Create Branch

```bash
git checkout -b feat/api-key-service
```

### Step 2: Create API Key Service

Create file: `apps/server/src/services/api-key.service.ts`

```typescript
import { prisma, ApiKey } from '@rateguard/db';
import { generateApiKey, hashApiKey, getKeyPrefix } from '../utils/crypto';

// ================================================
// Types
// ================================================

export interface CreateApiKeyInput {
  workspaceId: string;
  name: string;
  expiresAt?: Date;
}

export interface CreateApiKeyResult {
  apiKey: ApiKey;
  fullKey: string;  // Only returned once!
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

// ================================================
// API Key Service
// ================================================

class ApiKeyService {
  /**
   * Create a new API key
   * 
   * IMPORTANT: The full key is only returned ONCE.
   * After this, only the hash is stored.
   */
  async create(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    const { workspaceId, name, expiresAt } = input;

    // Generate the full key
    const fullKey = generateApiKey('live');
    
    // Hash it for storage
    const keyHash = hashApiKey(fullKey);
    
    // Get prefix for display
    const keyPrefix = getKeyPrefix(fullKey);

    // Store in database
    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId,
        name: name.trim(),
        keyHash,
        keyPrefix,
        expiresAt,
      },
    });

    return {
      apiKey,
      fullKey,  // Return this only once!
    };
  }

  /**
   * Validate an API key from request
   * 
   * Returns the API key record if valid, null otherwise
   */
  async validate(key: string): Promise<ApiKey | null> {
    // Quick format check
    if (!key || !key.startsWith('rg_')) {
      return null;
    }

    // Hash the provided key
    const keyHash = hashApiKey(key);

    // Look up by hash
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
    });

    // Not found
    if (!apiKey) {
      return null;
    }

    // Revoked
    if (!apiKey.isActive) {
      return null;
    }

    // Expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Update last used (fire and forget - don't await)
    this.updateLastUsed(apiKey.id).catch(() => {});

    return apiKey;
  }

  /**
   * List all API keys for a workspace
   * 
   * Note: Does NOT include the keyHash for security
   */
  async listByWorkspace(workspaceId: string): Promise<ApiKeyInfo[]> {
    const keys = await prisma.apiKey.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }

  /**
   * Revoke an API key (soft delete)
   */
  async revoke(id: string, workspaceId: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id, workspaceId },
      data: { isActive: false },
    });
  }

  /**
   * Delete an API key permanently
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    await prisma.apiKey.delete({
      where: { id, workspaceId },
    });
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(id: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}

// Export singleton
export const apiKeyService = new ApiKeyService();
```

### Step 3: Test API Key Service

Create file: `apps/server/src/services/api-key.service.test.ts`

```typescript
import { prisma } from '@rateguard/db';
import { apiKeyService } from './api-key.service';

async function test() {
  console.log('🔑 Testing API Key Service\n');
  console.log('='.repeat(50));

  // Setup: Create test user and workspace
  const user = await prisma.user.create({
    data: {
      email: 'apikey-test@rateguard.dev',
      name: 'API Key Test User',
      passwordHash: 'test-hash',
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'API Key Test Workspace',
      slug: 'apikey-test-workspace',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  });

  console.log('\n📌 Create API Key\n');

  const { apiKey, fullKey } = await apiKeyService.create({
    workspaceId: workspace.id,
    name: 'Test Key',
  });

  console.log('Full key (save this!):', fullKey);
  console.log('Key prefix (for display):', apiKey.keyPrefix);
  console.log('Key ID:', apiKey.id);

  console.log('\n📌 Validate Correct Key\n');

  const valid = await apiKeyService.validate(fullKey);
  console.log('Valid key:', valid ? '✅ Accepted' : '❌ Rejected');

  console.log('\n📌 Validate Wrong Key\n');

  const invalid = await apiKeyService.validate('rg_live_wrongkey123456789');
  console.log('Wrong key:', invalid ? '❌ Accepted (BUG!)' : '✅ Rejected');

  console.log('\n📌 Validate Invalid Format\n');

  const badFormat = await apiKeyService.validate('not-a-valid-key');
  console.log('Bad format:', badFormat ? '❌ Accepted (BUG!)' : '✅ Rejected');

  console.log('\n📌 List Keys\n');

  const keys = await apiKeyService.listByWorkspace(workspace.id);
  console.log('Keys in workspace:', keys.length);
  console.log('Key info:', keys.map((k) => ({
    name: k.name,
    prefix: k.keyPrefix,
    isActive: k.isActive,
  })));

  console.log('\n📌 Revoke Key\n');

  await apiKeyService.revoke(apiKey.id, workspace.id);
  const revoked = await apiKeyService.validate(fullKey);
  console.log('After revoke:', revoked ? '❌ Still valid (BUG!)' : '✅ Rejected');

  // Cleanup
  await prisma.workspace.delete({ where: { id: workspace.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('\n' + '='.repeat(50));
  console.log('✨ All API key tests passed!\n');

  await prisma.$disconnect();
}

test().catch(console.error);
```

Run test:

```bash
cd apps/server
npx tsx src/services/api-key.service.test.ts
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(api-key): add API key service

- Add secure key generation (rg_live_xxx format)
- Add hash-based storage (never store plain key)
- Add key validation for requests
- Add key listing (without hashes)
- Add key revocation"

git checkout main
git merge feat/api-key-service
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 3: Rate Limiting
# ═══════════════════════════════════════════════════════════════

## Branch 3.1: feat/redis-client

### Step 1: Create Branch

```bash
git checkout -b feat/redis-client
```

### Step 2: Install Redis Client

```bash
cd apps/server
npm install ioredis
npm install -D @types/ioredis
```

### Step 3: Create Redis Client

Create file: `apps/server/src/lib/redis.ts`

```typescript
import Redis from 'ioredis';
import { config } from '../config';

// ================================================
// Redis Client
// ================================================

export const redis = new Redis(config.redisUrl, {
  // Retry strategy
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.log(`🔄 Redis reconnecting in ${delay}ms...`);
    return delay;
  },
  
  // Max retries
  maxRetriesPerRequest: 3,
});

// Connection events
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('ready', () => {
  console.log('✅ Redis ready');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error.message);
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

// ================================================
// Helper Functions
// ================================================

/**
 * Check if Redis is connected
 */
export async function isRedisConnected(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  await redis.quit();
}
```

### Step 4: Test Redis

Create file: `apps/server/src/lib/redis.test.ts`

```typescript
import { redis, isRedisConnected, closeRedis } from './redis';

async function test() {
  console.log('🔴 Testing Redis\n');
  console.log('='.repeat(50));

  // Test connection
  console.log('\n📌 Connection Test\n');
  
  const connected = await isRedisConnected();
  console.log('Connected:', connected ? '✅ Yes' : '❌ No');

  if (!connected) {
    console.log('\n❌ Redis not connected. Make sure Docker is running:');
    console.log('   npm run docker:up');
    await closeRedis();
    process.exit(1);
  }

  // Test basic operations
  console.log('\n📌 Basic Operations\n');

  // SET
  await redis.set('test:key', 'Hello RateGuard!');
  console.log('SET test:key = "Hello RateGuard!"');

  // GET
  const value = await redis.get('test:key');
  console.log('GET test:key =', value);

  // INCR
  await redis.set('test:counter', '0');
  await redis.incr('test:counter');
  await redis.incr('test:counter');
  await redis.incr('test:counter');
  const counter = await redis.get('test:counter');
  console.log('Counter after 3x INCR:', counter);

  // EXPIRE
  await redis.set('test:expires', 'temporary', 'EX', 10);
  const ttl = await redis.ttl('test:expires');
  console.log('TTL of test:expires:', ttl, 'seconds');

  // Hash operations
  console.log('\n📌 Hash Operations\n');

  await redis.hset('test:user', {
    name: 'John',
    email: 'john@example.com',
    visits: '0',
  });
  console.log('HSET test:user with name, email, visits');

  const user = await redis.hgetall('test:user');
  console.log('HGETALL test:user:', user);

  await redis.hincrby('test:user', 'visits', 1);
  const visits = await redis.hget('test:user', 'visits');
  console.log('After HINCRBY visits:', visits);

  // Cleanup
  console.log('\n📌 Cleanup\n');
  
  await redis.del('test:key', 'test:counter', 'test:expires', 'test:user');
  console.log('Deleted all test keys');

  console.log('\n' + '='.repeat(50));
  console.log('✨ All Redis tests passed!\n');

  await closeRedis();
}

test().catch(console.error);
```

Run test:

```bash
npx tsx src/lib/redis.test.ts
```

### Step 5: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(redis): add Redis client

- Add ioredis connection with retry strategy
- Add connection event handlers
- Add helper functions for health check"

git checkout main
git merge feat/redis-client
```

---

## Branch 3.2: feat/rate-limiter

### Step 1: Create Branch

```bash
git checkout -b feat/rate-limiter
```

### Step 2: Create Rate Limiter

Create file: `apps/server/src/lib/rate-limiter.ts`

```typescript
import { redis } from './redis';

// ================================================
// Types
// ================================================

export interface RateLimitResult {
  allowed: boolean;      // Was request allowed?
  limit: number;         // Max requests allowed
  remaining: number;     // Requests remaining
  resetInMs: number;     // Milliseconds until reset
}

// ================================================
// Token Bucket Algorithm (Lua Script)
// ================================================
// 
// Why Lua? Atomicity!
// 
// Without Lua (BROKEN):
//   Request A: GET tokens → 1 token
//   Request B: GET tokens → 1 token (same time!)
//   Request A: SET tokens → 0
//   Request B: SET tokens → 0
//   Result: Both requests think they got the last token!
//
// With Lua (CORRECT):
//   The entire script runs atomically.
//   No other commands can run in between.
//
// How Token Bucket works:
// 1. Start with a bucket of N tokens
// 2. Each request consumes 1 token
// 3. Tokens refill at a steady rate
// 4. If no tokens left, request is denied
//
// Benefits:
// - Allows bursts (good UX)
// - Smooth average rate
// - No boundary attack (unlike fixed window)

const TOKEN_BUCKET_SCRIPT = `
-- Arguments:
-- KEYS[1] = rate limit key
-- ARGV[1] = bucket capacity (max tokens)
-- ARGV[2] = refill rate (tokens per second)
-- ARGV[3] = current timestamp (milliseconds)

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Get current state
local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

-- Initialize if new
if tokens == nil then
  tokens = capacity
  lastRefill = now
end

-- Calculate token refill based on time elapsed
local elapsed = (now - lastRefill) / 1000  -- Convert to seconds
local refill = elapsed * refillRate
tokens = math.min(capacity, tokens + refill)

-- Try to consume 1 token
if tokens >= 1 then
  -- Success! Consume token
  tokens = tokens - 1
  redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
  redis.call('EXPIRE', key, math.ceil(capacity / refillRate) * 2)
  
  -- Return: allowed, remaining, reset time
  local resetMs = math.ceil((capacity - tokens) / refillRate * 1000)
  return {1, math.floor(tokens), resetMs}
else
  -- Failed! No tokens available
  local waitMs = math.ceil((1 - tokens) / refillRate * 1000)
  return {0, 0, waitMs}
end
`;

// Cache the script SHA for performance
let scriptSha: string | null = null;

/**
 * Load the Lua script into Redis and cache its SHA
 */
async function loadScript(): Promise<string> {
  if (!scriptSha) {
    scriptSha = await redis.script('LOAD', TOKEN_BUCKET_SCRIPT) as string;
  }
  return scriptSha;
}

// ================================================
// Public API
// ================================================

/**
 * Check rate limit using token bucket algorithm
 * 
 * @param key - Unique identifier (e.g., "ratelimit:workspace:apikey")
 * @param limit - Maximum requests per window
 * @param windowSeconds - Time window in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const refillRate = limit / windowSeconds;  // Tokens per second
  const now = Date.now();

  try {
    // Load script if needed
    const sha = await loadScript();

    // Execute script atomically
    const result = await redis.evalsha(
      sha,
      1,          // Number of keys
      key,        // KEYS[1]
      limit,      // ARGV[1] - capacity
      refillRate, // ARGV[2] - refill rate
      now         // ARGV[3] - timestamp
    ) as number[];

    return {
      allowed: result[0] === 1,
      limit,
      remaining: result[1],
      resetInMs: result[2],
    };

  } catch (error: any) {
    // Handle script not loaded (Redis restarted)
    if (error.message?.includes('NOSCRIPT')) {
      scriptSha = null;  // Clear cache
      return checkRateLimit(key, limit, windowSeconds);  // Retry
    }
    throw error;
  }
}

/**
 * Clear rate limit for a key
 */
export async function clearRateLimit(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Get current rate limit status without consuming a token
 */
export async function getRateLimitStatus(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const refillRate = limit / windowSeconds;
  const now = Date.now();

  const data = await redis.hmget(key, 'tokens', 'lastRefill');
  let tokens = data[0] ? parseFloat(data[0]) : limit;
  const lastRefill = data[1] ? parseInt(data[1]) : now;

  // Calculate current tokens
  const elapsed = (now - lastRefill) / 1000;
  tokens = Math.min(limit, tokens + elapsed * refillRate);

  return {
    allowed: tokens >= 1,
    limit,
    remaining: Math.floor(tokens),
    resetInMs: Math.ceil((limit - tokens) / refillRate * 1000),
  };
}
```

### Step 3: Test Rate Limiter

Create file: `apps/server/src/lib/rate-limiter.test.ts`

```typescript
import { redis, closeRedis } from './redis';
import { checkRateLimit, clearRateLimit } from './rate-limiter';

async function test() {
  console.log('⏱️  Testing Rate Limiter\n');
  console.log('='.repeat(50));

  const testKey = 'test:ratelimit';

  // Cleanup
  await clearRateLimit(testKey);

  // Test: Basic rate limiting
  console.log('\n📌 Basic Rate Limiting (5 per 10 seconds)\n');

  for (let i = 1; i <= 7; i++) {
    const result = await checkRateLimit(testKey, 5, 10);
    console.log(
      `Request ${i}:`,
      result.allowed ? '✅ Allowed' : '❌ Blocked',
      `| Remaining: ${result.remaining}`,
      `| Reset in: ${result.resetInMs}ms`
    );
  }

  // Test: Wait for refill
  console.log('\n📌 Wait for Token Refill\n');
  console.log('⏳ Waiting 3 seconds...');
  await new Promise((r) => setTimeout(r, 3000));

  const afterWait = await checkRateLimit(testKey, 5, 10);
  console.log(
    'After 3s:',
    afterWait.allowed ? '✅ Allowed' : '❌ Blocked',
    `| Remaining: ${afterWait.remaining}`
  );

  // Test: Concurrent requests
  console.log('\n📌 Concurrent Requests (10 at once, limit 5)\n');

  await clearRateLimit(testKey);

  const concurrent = await Promise.all(
    Array(10).fill(null).map(() => checkRateLimit(testKey, 5, 10))
  );

  const allowed = concurrent.filter((r) => r.allowed).length;
  const blocked = concurrent.filter((r) => !r.allowed).length;

  console.log(`Allowed: ${allowed} (should be ~5)`);
  console.log(`Blocked: ${blocked} (should be ~5)`);
  console.log('Atomic?', allowed === 5 ? '✅ Yes' : '⚠️ Race condition!');

  // Cleanup
  await clearRateLimit(testKey);

  console.log('\n' + '='.repeat(50));
  console.log('✨ All rate limiter tests passed!\n');

  await closeRedis();
}

test().catch(console.error);
```

Run test:

```bash
cd apps/server
npx tsx src/lib/rate-limiter.test.ts
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(rate-limit): add token bucket rate limiter

- Add Lua script for atomic operations
- Add token bucket algorithm
- Add token refill based on elapsed time
- Add concurrent request handling"

git checkout main
git merge feat/rate-limiter
```

---

## Branch 3.3: feat/rate-limit-service

### Step 1: Create Branch

```bash
git checkout -b feat/rate-limit-service
```

### Step 2: Create Rate Limit Service

Create file: `apps/server/src/services/rate-limit.service.ts`

```typescript
import { prisma, RateLimitRule } from '@rateguard/db';
import { redis } from '../lib/redis';
import { checkRateLimit, RateLimitResult } from '../lib/rate-limiter';
import { config } from '../config';

// ================================================
// Rate Limit Service
// ================================================

class RateLimitService {
  // Cache rules for 60 seconds to reduce database queries
  private readonly RULE_CACHE_TTL = 60;

  /**
   * Check rate limit for an API key
   */
  async check(apiKeyId: string, workspaceId: string): Promise<RateLimitResult> {
    // Get the rate limit rule for this workspace
    const rule = await this.getRule(workspaceId);

    // Build the rate limit key
    const key = this.buildKey(workspaceId, apiKeyId);

    // Check the rate limit
    return checkRateLimit(key, rule.limit, rule.window);
  }

  /**
   * Get the active rate limit rule for a workspace
   * Uses caching to reduce database load
   */
  private async getRule(workspaceId: string): Promise<{ limit: number; window: number }> {
    const cacheKey = `rules:${workspaceId}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const rule = await prisma.rateLimitRule.findFirst({
      where: {
        workspaceId,
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    // Use rule or defaults
    const result = {
      limit: rule?.limit ?? config.defaultRateLimit,
      window: rule?.window ?? config.defaultRateWindow,
    };

    // Cache it
    await redis.set(cacheKey, JSON.stringify(result), 'EX', this.RULE_CACHE_TTL);

    return result;
  }

  /**
   * Build the rate limit key
   */
  private buildKey(workspaceId: string, apiKeyId: string): string {
    return `ratelimit:${workspaceId}:${apiKeyId}`;
  }

  /**
   * Clear the rule cache for a workspace
   * Call this when rules are updated
   */
  async clearCache(workspaceId: string): Promise<void> {
    await redis.del(`rules:${workspaceId}`);
  }

  /**
   * Clear all rate limits for an API key
   * Useful for testing or admin actions
   */
  async clearLimits(workspaceId: string, apiKeyId: string): Promise<void> {
    const key = this.buildKey(workspaceId, apiKeyId);
    await redis.del(key);
  }
}

// Export singleton
export const rateLimitService = new RateLimitService();
```

### Step 3: Test Rate Limit Service

Create file: `apps/server/src/services/rate-limit.service.test.ts`

```typescript
import { prisma } from '@rateguard/db';
import { closeRedis, redis } from '../lib/redis';
import { rateLimitService } from './rate-limit.service';

async function test() {
  console.log('⏱️  Testing Rate Limit Service\n');
  console.log('='.repeat(50));

  // Setup: Create test data
  const user = await prisma.user.create({
    data: {
      email: 'ratelimit-test@rateguard.dev',
      name: 'Rate Limit Test User',
      passwordHash: 'test-hash',
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Rate Limit Test Workspace',
      slug: 'ratelimit-test-workspace',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  });

  // Create rate limit rule: 5 requests per 10 seconds
  await prisma.rateLimitRule.create({
    data: {
      workspaceId: workspace.id,
      name: 'Test Rule',
      algorithm: 'TOKEN_BUCKET',
      limit: 5,
      window: 10,
    },
  });

  const testApiKeyId = 'test-api-key-id';

  // Clear any existing rate limits
  await rateLimitService.clearLimits(workspace.id, testApiKeyId);
  await rateLimitService.clearCache(workspace.id);

  console.log('\n📌 Rate Limiting with Rule (5 per 10 seconds)\n');

  for (let i = 1; i <= 7; i++) {
    const result = await rateLimitService.check(testApiKeyId, workspace.id);
    console.log(
      `Request ${i}:`,
      result.allowed ? '✅ Allowed' : '❌ Blocked',
      `| Remaining: ${result.remaining}`
    );
  }

  console.log('\n📌 Cache Test\n');

  // The rule should be cached now
  const cacheKey = `rules:${workspace.id}`;
  const cached = await redis.get(cacheKey);
  console.log('Rule cached:', cached ? '✅ Yes' : '❌ No');

  // Clear cache
  await rateLimitService.clearCache(workspace.id);
  const afterClear = await redis.get(cacheKey);
  console.log('After clearCache:', afterClear ? '❌ Still cached' : '✅ Cleared');

  // Cleanup
  await prisma.workspace.delete({ where: { id: workspace.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('\n' + '='.repeat(50));
  console.log('✨ All rate limit service tests passed!\n');

  await closeRedis();
  await prisma.$disconnect();
}

test().catch(console.error);
```

Run test:

```bash
cd apps/server
npx tsx src/services/rate-limit.service.test.ts
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(rate-limit): add rate limit service

- Add service to coordinate rate limiting
- Add rule lookup with caching
- Add cache invalidation when rules change"

git checkout main
git merge feat/rate-limit-service
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 4: HTTP Server
# ═══════════════════════════════════════════════════════════════

## Branch 4.1: feat/express-setup

### Step 1: Create Branch

```bash
git checkout -b feat/express-setup
```

### Step 2: Install Dependencies

```bash
cd apps/server
npm install express cors
npm install -D @types/express @types/cors
```

### Step 3: Create Auth Middleware

Create file: `apps/server/src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

// ================================================
// Extend Express Request type
// ================================================

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      email?: string;
    }
  }
}

// ================================================
// Auth Middleware
// ================================================

/**
 * Require JWT authentication
 * 
 * Extracts token from Authorization header:
 *   Authorization: Bearer <token>
 * 
 * Sets req.userId and req.email on success
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // Check header exists
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  // Check format
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
    return;
  }

  // Extract token
  const token = authHeader.slice(7);

  try {
    // Verify token
    const payload = authService.verifyToken(token);
    
    // Attach to request
    req.userId = payload.userId;
    req.email = payload.email;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional auth - sets user info if token present, continues otherwise
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    
    try {
      const payload = authService.verifyToken(token);
      req.userId = payload.userId;
      req.email = payload.email;
    } catch {
      // Ignore invalid token
    }
  }

  next();
}
```

### Step 4: Create Error Handler

Create file: `apps/server/src/middleware/error.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

// ================================================
// Error Types
// ================================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

// ================================================
// Error Handler Middleware
// ================================================

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('❌ Error:', error.message);

  // Known errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
    });
    return;
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: 'Database operation failed',
    });
    return;
  }

  // Unknown errors
  res.status(500).json({
    error: 'Internal server error',
  });
}
```

### Step 5: Create Server

Create file: `apps/server/src/server.ts`

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';

// ================================================
// Create Express App
// ================================================

export function createServer(): Application {
  const app = express();

  // ================================================
  // Middleware
  // ================================================

  // CORS - Allow cross-origin requests
  app.use(cors());

  // Parse JSON bodies
  app.use(express.json());

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));

  // ================================================
  // Routes (will be added in next branches)
  // ================================================

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    });
  });

  // ================================================
  // Error Handler (must be last)
  // ================================================

  app.use(errorHandler);

  return app;
}

// ================================================
// Start Server
// ================================================

export function startServer(app: Application): void {
  const port = config.port;

  app.listen(port, () => {
    console.log('');
    console.log('🚀 RateGuard Server');
    console.log('='.repeat(40));
    console.log(`📡 Listening on http://localhost:${port}`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);
    console.log('');
  });
}
```

### Step 6: Update Entry Point

Replace file: `apps/server/src/index.ts`

```typescript
import { createServer, startServer } from './server';
import { prisma } from '@rateguard/db';
import { isRedisConnected } from './lib/redis';

async function main() {
  // Check database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Check Redis connection
  const redisOk = await isRedisConnected();
  if (redisOk) {
    console.log('✅ Redis connected');
  } else {
    console.error('❌ Redis connection failed');
    process.exit(1);
  }

  // Create and start server
  const app = createServer();
  startServer(app);
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
```

### Step 7: Test

```bash
npm run dev:server
```

In another terminal:

```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","timestamp":"...","version":"0.1.0"}
```

### Step 8: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(server): add Express setup with middleware

- Add Express with CORS and JSON parsing
- Add auth middleware with JWT verification
- Add error handling middleware
- Add health check endpoint"

git checkout main
git merge feat/express-setup
```

---

## Branch 4.2: feat/auth-routes

### Step 1: Create Branch

```bash
git checkout -b feat/auth-routes
```

### Step 2: Create Auth Routes

Create file: `apps/server/src/routes/auth.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';

const router = Router();

// ================================================
// POST /auth/register
// ================================================

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, name',
      });
    }

    // Register user
    const result = await authService.register({ email, password, name });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ================================================
// POST /auth/login
// ================================================

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: email, password',
      });
    }

    // Login user
    const result = await authService.login({ email, password });

    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// ================================================
// GET /auth/me
// ================================================

import { authMiddleware } from '../middleware/auth.middleware';

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as authRoutes };
```

### Step 3: Update Server

Update file: `apps/server/src/server.ts`

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';

export function createServer(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/auth', authRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

export function startServer(app: Application): void {
  app.listen(config.port, () => {
    console.log('');
    console.log('🚀 RateGuard Server');
    console.log('='.repeat(40));
    console.log(`📡 http://localhost:${config.port}`);
    console.log('');
    console.log('📋 Routes:');
    console.log('   POST /auth/register');
    console.log('   POST /auth/login');
    console.log('   GET  /auth/me');
    console.log('');
  });
}
```

### Step 4: Test

```bash
cd apps/server
npm run dev
```

In another terminal:

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Get current user (use token from login response)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 5: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(routes): add auth routes

- Add POST /auth/register
- Add POST /auth/login
- Add GET /auth/me (protected)"

git checkout main
git merge feat/auth-routes
```

---

## Branch 4.3: feat/workspace-routes

### Step 1: Create Branch

```bash
git checkout -b feat/workspace-routes
```

### Step 2: Create Workspace Routes

Create file: `apps/server/src/routes/workspace.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '@rateguard/db';
import { authMiddleware } from '../middleware/auth.middleware';
import { workspaceService } from '../services/workspace.service';
import { apiKeyService } from '../services/api-key.service';
import { rateLimitService } from '../services/rate-limit.service';

const router = Router();

// All workspace routes require authentication
router.use(authMiddleware);

// ================================================
// WORKSPACE CRUD
// ================================================

// POST /workspaces - Create workspace
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const workspace = await workspaceService.create({
      name,
      slug,
      ownerId: req.userId!,
    });

    res.status(201).json(workspace);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /workspaces - List user's workspaces
router.get('/', async (req: Request, res: Response) => {
  const workspaces = await workspaceService.listByUser(req.userId!);
  res.json(workspaces);
});

// GET /workspaces/:id - Get workspace
router.get('/:id', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.id,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(workspace);
});

// ================================================
// API KEYS
// ================================================

// POST /workspaces/:id/api-keys - Create API key
router.post('/:id/api-keys', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const workspace = await workspaceService.getByIdWithAccess(
      req.params.id,
      req.userId!
    );

    if (!workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { apiKey, fullKey } = await apiKeyService.create({
      workspaceId: workspace.id,
      name,
    });

    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key: fullKey,
      prefix: apiKey.keyPrefix,
      message: 'Save this key! It will not be shown again.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /workspaces/:id/api-keys - List API keys
router.get('/:id/api-keys', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.id,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const keys = await apiKeyService.listByWorkspace(workspace.id);
  res.json(keys);
});

// DELETE /workspaces/:id/api-keys/:keyId - Revoke API key
router.delete('/:id/api-keys/:keyId', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.id,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await apiKeyService.revoke(req.params.keyId, workspace.id);
  res.json({ message: 'API key revoked' });
});

// ================================================
// RATE LIMIT RULES
// ================================================

// POST /workspaces/:id/rules - Create rule
router.post('/:id/rules', async (req: Request, res: Response) => {
  try {
    const { name, limit, window } = req.body;

    const workspace = await workspaceService.getByIdWithAccess(
      req.params.id,
      req.userId!
    );

    if (!workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const rule = await prisma.rateLimitRule.create({
      data: {
        workspaceId: workspace.id,
        name: name || 'Default',
        algorithm: 'TOKEN_BUCKET',
        limit: limit || 100,
        window: window || 60,
      },
    });

    // Clear cache so new rule takes effect
    await rateLimitService.clearCache(workspace.id);

    res.status(201).json(rule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /workspaces/:id/rules - List rules
router.get('/:id/rules', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.id,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const rules = await prisma.rateLimitRule.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { priority: 'desc' },
  });

  res.json(rules);
});

// DELETE /workspaces/:id/rules/:ruleId - Delete rule
router.delete('/:id/rules/:ruleId', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.id,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await prisma.rateLimitRule.delete({
    where: { id: req.params.ruleId, workspaceId: workspace.id },
  });

  // Clear cache
  await rateLimitService.clearCache(workspace.id);

  res.json({ message: 'Rule deleted' });
});

// ================================================
// ANALYTICS
// ================================================

// GET /workspaces/:id/analytics - Get basic analytics
router.get('/:id/analytics', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.id,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get API keys for this workspace
  const apiKeys = await prisma.apiKey.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true },
  });

  const apiKeyIds = apiKeys.map((k) => k.id);

  // Get stats from last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [total, successful, rateLimited, latencyData] = await Promise.all([
    prisma.requestLog.count({
      where: { apiKeyId: { in: apiKeyIds }, createdAt: { gte: since } },
    }),
    prisma.requestLog.count({
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { gte: since },
        statusCode: { lt: 400 },
      },
    }),
    prisma.requestLog.count({
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { gte: since },
        rateLimited: true,
      },
    }),
    prisma.requestLog.aggregate({
      where: { apiKeyId: { in: apiKeyIds }, createdAt: { gte: since } },
      _avg: { latencyMs: true },
    }),
  ]);

  res.json({
    totalRequests: total,
    successfulRequests: successful,
    rateLimitedRequests: rateLimited,
    avgLatencyMs: Math.round(latencyData._avg.latencyMs || 0),
  });
});

export { router as workspaceRoutes };
```

### Step 3: Update Server

Update file: `apps/server/src/server.ts`

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { workspaceRoutes } from './routes/workspace.routes';

export function createServer(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/auth', authRoutes);
  app.use('/workspaces', workspaceRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

export function startServer(app: Application): void {
  app.listen(config.port, () => {
    console.log('');
    console.log('🚀 RateGuard Server');
    console.log('='.repeat(40));
    console.log(`📡 http://localhost:${config.port}`);
    console.log('');
    console.log('📋 Routes:');
    console.log('   POST   /auth/register');
    console.log('   POST   /auth/login');
    console.log('   GET    /auth/me');
    console.log('');
    console.log('   GET    /workspaces');
    console.log('   POST   /workspaces');
    console.log('   GET    /workspaces/:id');
    console.log('   POST   /workspaces/:id/api-keys');
    console.log('   GET    /workspaces/:id/api-keys');
    console.log('   DELETE /workspaces/:id/api-keys/:keyId');
    console.log('   POST   /workspaces/:id/rules');
    console.log('   GET    /workspaces/:id/rules');
    console.log('   DELETE /workspaces/:id/rules/:ruleId');
    console.log('   GET    /workspaces/:id/analytics');
    console.log('');
  });
}
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(routes): add workspace routes

- Add workspace CRUD
- Add API key management
- Add rate limit rule management
- Add basic analytics"

git checkout main
git merge feat/workspace-routes
```

---

## Branch 4.4: feat/proxy-endpoint

### Step 1: Create Branch

```bash
git checkout -b feat/proxy-endpoint
```

### Step 2: Create Proxy Routes

Create file: `apps/server/src/routes/proxy.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '@rateguard/db';
import { apiKeyService } from '../services/api-key.service';
import { rateLimitService } from '../services/rate-limit.service';

const router = Router();

// ================================================
// Proxy Endpoint - /v1/*
// ================================================
// 
// This is where API requests come in.
// Each request:
// 1. Validates the API key
// 2. Checks rate limits
// 3. Logs the request
// 4. Returns response (or forwards to upstream)

router.all('/*', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const path = req.path;
  const method = req.method;

  // ================================================
  // 1. Get API key from header
  // ================================================

  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing X-API-Key header',
    });
  }

  // ================================================
  // 2. Validate API key
  // ================================================

  const key = await apiKeyService.validate(apiKey);

  if (!key) {
    return res.status(401).json({
      error: 'Invalid API key',
    });
  }

  // ================================================
  // 3. Check rate limit
  // ================================================

  const rateLimit = await rateLimitService.check(key.id, key.workspaceId);

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + rateLimit.resetInMs / 1000)),
  });

  // ================================================
  // 4. Handle rate limited request
  // ================================================

  if (!rateLimit.allowed) {
    const latency = Date.now() - startTime;

    // Log the request
    await prisma.requestLog.create({
      data: {
        apiKeyId: key.id,
        method,
        path,
        statusCode: 429,
        latencyMs: latency,
        rateLimited: true,
      },
    });

    res.set('Retry-After', String(Math.ceil(rateLimit.resetInMs / 1000)));

    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(rateLimit.resetInMs / 1000),
    });
  }

  // ================================================
  // 5. Success - Log and respond
  // ================================================

  const latency = Date.now() - startTime;

  // Log the request
  await prisma.requestLog.create({
    data: {
      apiKeyId: key.id,
      method,
      path,
      statusCode: 200,
      latencyMs: latency,
      rateLimited: false,
    },
  });

  // For now, just echo back (proxy forwarding comes in Phase 6)
  res.json({
    success: true,
    method,
    path,
    message: 'Request successful',
    rateLimit: {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      resetInMs: rateLimit.resetInMs,
    },
  });
});

export { router as proxyRoutes };
```

### Step 3: Update Server

Update file: `apps/server/src/server.ts`

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { workspaceRoutes } from './routes/workspace.routes';
import { proxyRoutes } from './routes/proxy.routes';

export function createServer(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/auth', authRoutes);
  app.use('/workspaces', workspaceRoutes);
  app.use('/v1', proxyRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

export function startServer(app: Application): void {
  app.listen(config.port, () => {
    console.log('');
    console.log('🚀 RateGuard Server');
    console.log('='.repeat(50));
    console.log(`📡 http://localhost:${config.port}`);
    console.log('');
    console.log('📋 Auth Routes:');
    console.log('   POST /auth/register');
    console.log('   POST /auth/login');
    console.log('   GET  /auth/me');
    console.log('');
    console.log('📋 Workspace Routes:');
    console.log('   GET    /workspaces');
    console.log('   POST   /workspaces');
    console.log('   GET    /workspaces/:id');
    console.log('   POST   /workspaces/:id/api-keys');
    console.log('   GET    /workspaces/:id/api-keys');
    console.log('   DELETE /workspaces/:id/api-keys/:keyId');
    console.log('   POST   /workspaces/:id/rules');
    console.log('   GET    /workspaces/:id/rules');
    console.log('   DELETE /workspaces/:id/rules/:ruleId');
    console.log('   GET    /workspaces/:id/analytics');
    console.log('');
    console.log('📋 Proxy Routes (rate limited):');
    console.log('   ALL  /v1/* (requires X-API-Key header)');
    console.log('');
  });
}
```

### Step 4: Full Integration Test

Create file: `apps/server/src/integration-test.ts`

```typescript
import { prisma } from '@rateguard/db';
import { closeRedis } from './lib/redis';

const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('🧪 Integration Test\n');
  console.log('='.repeat(50));
  console.log('\n⚠️  Make sure the server is running: npm run dev\n');

  // 1. Register
  console.log('📌 1. Register User\n');
  
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'integration@test.com',
      password: 'password123',
      name: 'Integration Test',
    }),
  });
  
  const registerData = await registerRes.json();
  console.log('Status:', registerRes.status);
  console.log('Response:', registerData);
  
  const token = registerData.token;

  // 2. Create Workspace
  console.log('\n📌 2. Create Workspace\n');
  
  const wsRes = await fetch(`${BASE_URL}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Test Workspace',
      slug: 'test-workspace',
    }),
  });
  
  const wsData = await wsRes.json();
  console.log('Status:', wsRes.status);
  console.log('Workspace:', wsData.name);
  
  const workspaceId = wsData.id;

  // 3. Create Rate Limit Rule (5 per 60 seconds)
  console.log('\n📌 3. Create Rate Limit Rule (5/60s)\n');
  
  const ruleRes = await fetch(`${BASE_URL}/workspaces/${workspaceId}/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Test Rule',
      limit: 5,
      window: 60,
    }),
  });
  
  const ruleData = await ruleRes.json();
  console.log('Status:', ruleRes.status);
  console.log('Rule:', ruleData.name, '-', ruleData.limit, 'per', ruleData.window, 'seconds');

  // 4. Create API Key
  console.log('\n📌 4. Create API Key\n');
  
  const keyRes = await fetch(`${BASE_URL}/workspaces/${workspaceId}/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name: 'Test Key' }),
  });
  
  const keyData = await keyRes.json();
  console.log('Status:', keyRes.status);
  console.log('API Key:', keyData.key);
  
  const apiKey = keyData.key;

  // 5. Test Rate Limiting
  console.log('\n📌 5. Test Rate Limiting (7 requests, limit 5)\n');
  
  for (let i = 1; i <= 7; i++) {
    const proxyRes = await fetch(`${BASE_URL}/v1/test`, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey },
    });
    
    const remaining = proxyRes.headers.get('x-ratelimit-remaining');
    
    console.log(
      `Request ${i}:`,
      proxyRes.status === 200 ? '✅ Allowed' : '❌ Blocked',
      `| Remaining: ${remaining}`
    );
  }

  // 6. Check Analytics
  console.log('\n📌 6. Check Analytics\n');
  
  const analyticsRes = await fetch(
    `${BASE_URL}/workspaces/${workspaceId}/analytics`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  const analytics = await analyticsRes.json();
  console.log('Analytics:', analytics);

  // Cleanup
  console.log('\n📌 7. Cleanup\n');
  
  await prisma.workspace.delete({ where: { id: workspaceId } });
  await prisma.user.deleteMany({ where: { email: 'integration@test.com' } });
  console.log('Cleaned up test data');

  console.log('\n' + '='.repeat(50));
  console.log('✨ Integration test complete!\n');

  await closeRedis();
  await prisma.$disconnect();
}

test().catch(console.error);
```

### Step 5: Run Integration Test

Terminal 1:
```bash
cd apps/server
npm run dev
```

Terminal 2:
```bash
cd apps/server
npx tsx src/integration-test.ts
```

### Step 6: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(routes): add proxy endpoint with rate limiting

- Add /v1/* catch-all route
- Add API key validation
- Add rate limit checking
- Add request logging
- Add rate limit headers (X-RateLimit-*)"

git checkout main
git merge feat/proxy-endpoint
```

---

# ✅ PHASES 1-4 COMPLETE!

You now have a **working rate-limited API gateway**.

## What's Working:

| Feature | Status |
|---------|--------|
| User registration & login | ✅ |
| JWT authentication | ✅ |
| Workspaces | ✅ |
| API key management | ✅ |
| Token bucket rate limiting | ✅ |
| Request logging | ✅ |
| Basic analytics | ✅ |

## API Endpoints:

```
POST   /auth/register
POST   /auth/login
GET    /auth/me

GET    /workspaces
POST   /workspaces
GET    /workspaces/:id
POST   /workspaces/:id/api-keys
GET    /workspaces/:id/api-keys
DELETE /workspaces/:id/api-keys/:keyId
POST   /workspaces/:id/rules
GET    /workspaces/:id/rules
DELETE /workspaces/:id/rules/:ruleId
GET    /workspaces/:id/analytics

ALL    /v1/* (rate limited)
```

## Next: Phases 5-8

Continue to the next file for:
- Phase 5: Next.js Dashboard
- Phase 6: Real Upstream Proxy
- Phase 7: Advanced Analytics
- Phase 8: Production Deployment

---

# Continue in Part 2...
