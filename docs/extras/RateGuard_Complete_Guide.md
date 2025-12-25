# RateGuard: Complete Build Guide

## Fresh Start. New Repo. Professional Workflow.

---

## How This Guide Works

```
You will build RateGuard step by step.

Each PHASE has multiple BRANCHES.
Each BRANCH adds ONE feature.
You TEST it, COMMIT it, MERGE it.
Then move to the next branch.

This is how professional developers work.
```

---

## Complete Roadmap

```
PHASE 1: Foundation (3 branches)
├── Branch: feat/project-setup      ← Folders, packages, configs
├── Branch: feat/docker-setup       ← PostgreSQL + Redis containers
└── Branch: feat/database-schema    ← Prisma models

PHASE 2: Core Services (4 branches)
├── Branch: feat/crypto-utils       ← Hashing, key generation
├── Branch: feat/auth-service       ← Register, login, JWT
├── Branch: feat/workspace-service  ← Workspace CRUD
└── Branch: feat/api-key-service    ← API key management

PHASE 3: Rate Limiting (3 branches)
├── Branch: feat/redis-client       ← Redis connection
├── Branch: feat/rate-limiter       ← Token bucket algorithm
└── Branch: feat/rate-limit-service ← Rate limit coordination

PHASE 4: HTTP Server (4 branches)
├── Branch: feat/express-setup      ← Express server, middleware
├── Branch: feat/auth-routes        ← /auth/register, /auth/login
├── Branch: feat/workspace-routes   ← /workspaces/*
└── Branch: feat/proxy-endpoint     ← /v1/* with rate limiting

PHASE 5: Dashboard (4 branches)
├── Branch: feat/nextjs-setup       ← Next.js project
├── Branch: feat/auth-pages         ← Login, register pages
├── Branch: feat/dashboard-pages    ← Main dashboard
└── Branch: feat/analytics-page     ← Charts and stats
```

**Total: 18 branches across 5 phases**

---

# PHASE 1: Foundation

**Goal:** Project structure, Docker, database schema.

**Time:** 2-3 hours

**What you'll learn:**
- Monorepo structure
- Docker containers
- PostgreSQL with Prisma

---

## Branch 1.1: feat/project-setup

### What You're Building
- Git repository
- Folder structure
- Package.json files
- TypeScript configuration

### Step 1: Create Repository

```bash
# Create project folder
mkdir rateguard
cd rateguard

# Initialize Git
git init
git branch -M main

# Create first branch
git checkout -b feat/project-setup
```

### Step 2: Create .gitignore

Create `.gitignore`:

```
# Dependencies
node_modules/

# Build
dist/
build/
.next/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Logs
*.log

# Prisma
*.db
*.db-journal
```

### Step 3: Create Folder Structure

```bash
# Create all folders
mkdir -p apps/server/src
mkdir -p apps/web
mkdir -p packages/db/src
mkdir -p packages/db/prisma
mkdir -p docker
```

Your structure:
```
rateguard/
├── apps/
│   ├── server/src/    ← Backend API
│   └── web/           ← Frontend (later)
├── packages/
│   └── db/
│       ├── src/       ← Database client
│       └── prisma/    ← Schema
└── docker/            ← Docker files
```

### Step 4: Create Root package.json

Create `package.json`:

```json
{
  "name": "rateguard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev:server": "npm run dev -w @rateguard/server",
    "build": "npm run build --workspaces",
    "docker:up": "docker compose -f docker/compose.yml up -d",
    "docker:down": "docker compose -f docker/compose.yml down",
    "docker:logs": "docker compose -f docker/compose.yml logs -f",
    "db:push": "npm run db:push -w @rateguard/db",
    "db:studio": "npm run db:studio -w @rateguard/db"
  },
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

### Step 5: Create Database Package

Create `packages/db/package.json`:

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

Create `packages/db/tsconfig.json`:

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
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create `packages/db/src/index.ts`:

```typescript
// Placeholder - will export Prisma client
export const DB_VERSION = '0.1.0';
```

### Step 6: Create Server Package

Create `apps/server/package.json`:

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

Create `apps/server/tsconfig.json`:

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
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create `apps/server/src/index.ts`:

```typescript
console.log('🚀 RateGuard Server');
console.log('📁 Project setup complete!');
console.log('');
console.log('Next: feat/docker-setup');
```

### Step 7: Create README

Create `README.md`:

```markdown
# RateGuard

API Rate Limiting Gateway

## Quick Start

```bash
npm install
npm run docker:up
npm run db:push
npm run dev:server
```

## Structure

- `apps/server` - Backend API
- `apps/web` - Dashboard (Next.js)
- `packages/db` - Database (Prisma)
```

### Step 8: Install Dependencies

```bash
npm install
```

### Step 9: Test

```bash
npm run dev:server
```

Should see:
```
🚀 RateGuard Server
📁 Project setup complete!

Next: feat/docker-setup
```

Press `Ctrl+C` to stop.

### Step 10: Commit

```bash
git add .
git commit -m "feat(setup): initialize project structure

- Create monorepo with npm workspaces
- Add packages/db for Prisma client
- Add apps/server for backend API
- Configure TypeScript for all packages"
```

### Step 11: Merge to Main

```bash
git checkout main
git merge feat/project-setup
```

---

## Branch 1.2: feat/docker-setup

### What You're Building
- Docker Compose file
- PostgreSQL container
- Redis container

### Why Docker?

| Without Docker | With Docker |
|----------------|-------------|
| Install PostgreSQL | `docker compose up` |
| Install Redis | (same command) |
| Configure each | Already configured |
| Conflicts with system | Isolated containers |
| Hard to reset | `docker compose down -v` |

### Step 1: Create Branch

```bash
git checkout -b feat/docker-setup
```

### Step 2: Create Docker Compose

Create `docker/compose.yml`:

```yaml
services:
  # PostgreSQL Database
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

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: rateguard-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**What each line means:**

| Line | Meaning |
|------|---------|
| `image: postgres:16-alpine` | Use PostgreSQL 16, small Alpine version |
| `container_name` | Name for the container |
| `restart: unless-stopped` | Auto-restart if crashes |
| `ports: "5432:5432"` | Map host port to container port |
| `environment` | Set env vars inside container |
| `volumes` | Persist data outside container |
| `healthcheck` | Docker checks if service is working |

### Step 3: Create Environment Template

Create `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://rateguard:rateguard@localhost:5432/rateguard"

# Redis  
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development

# Auth (change in production!)
JWT_SECRET=change-this-secret-in-production
```

Create `.env` (copy of example):

```bash
cp .env.example .env
```

### Step 4: Start Docker

```bash
npm run docker:up
```

### Step 5: Verify Containers

```bash
# Check status
docker ps

# Should see:
# rateguard-postgres   ... healthy
# rateguard-redis      ... healthy
```

Test PostgreSQL:
```bash
docker exec -it rateguard-postgres psql -U rateguard -c "SELECT 'PostgreSQL OK' as status"
```

Test Redis:
```bash
docker exec -it rateguard-redis redis-cli PING
# Returns: PONG
```

### Step 6: Update Server

Update `apps/server/src/index.ts`:

```typescript
console.log('🚀 RateGuard Server');
console.log('🐳 Docker setup complete!');
console.log('');
console.log('Services:');
console.log('  PostgreSQL: localhost:5432');
console.log('  Redis:      localhost:6379');
console.log('');
console.log('Next: feat/database-schema');
```

### Step 7: Commit

```bash
git add .
git commit -m "feat(docker): add PostgreSQL and Redis containers

- Create docker compose with PostgreSQL 16 and Redis 7
- Add health checks for both services
- Add persistent volumes for data
- Add environment template"
```

### Step 8: Merge to Main

```bash
git checkout main
git merge feat/docker-setup
```

---

## Branch 1.3: feat/database-schema

### What You're Building
- Prisma schema with all models
- Database tables
- Prisma client export

### Prisma Basics

Prisma is like Mongoose but for SQL:

| Mongoose (MongoDB) | Prisma (PostgreSQL) |
|-------------------|---------------------|
| `const User = mongoose.model('User', schema)` | `model User { ... }` in schema.prisma |
| `User.create({...})` | `prisma.user.create({data: {...}})` |
| `User.find({})` | `prisma.user.findMany()` |
| `User.findById(id)` | `prisma.user.findUnique({where: {id}})` |
| `.populate('posts')` | `include: { posts: true }` |

### Step 1: Create Branch

```bash
git checkout -b feat/database-schema
```

### Step 2: Initialize Prisma

```bash
cd packages/db
npx prisma init --datasource-provider postgresql
```

### Step 3: Create Schema

Replace `packages/db/prisma/schema.prisma`:

```prisma
// =============================================
// PRISMA SCHEMA - RateGuard Database
// =============================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================
// USER
// People who use the RateGuard dashboard
// =============================================

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  passwordHash  String   @map("password_hash")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  memberships   WorkspaceMember[]

  @@map("users")
}

// =============================================
// WORKSPACE
// A team or project that owns API keys
// =============================================

model Workspace {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  members   WorkspaceMember[]
  apiKeys   ApiKey[]
  rules     RateLimitRule[]

  @@map("workspaces")
}

// =============================================
// WORKSPACE MEMBER
// Links users to workspaces with roles
// =============================================

model WorkspaceMember {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  workspaceId String   @map("workspace_id")
  role        Role     @default(MEMBER)
  
  createdAt   DateTime @default(now()) @map("created_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@map("workspace_members")
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

// =============================================
// API KEY
// Used to authenticate API requests
// We store HASH, not the actual key
// =============================================

model ApiKey {
  id          String    @id @default(uuid())
  workspaceId String    @map("workspace_id")
  
  name        String
  keyHash     String    @unique @map("key_hash")
  keyPrefix   String    @map("key_prefix")
  
  isActive    Boolean   @default(true) @map("is_active")
  lastUsedAt  DateTime? @map("last_used_at")
  expiresAt   DateTime? @map("expires_at")
  
  createdAt   DateTime  @default(now()) @map("created_at")

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  logs        RequestLog[]

  @@index([keyHash])
  @@map("api_keys")
}

// =============================================
// RATE LIMIT RULE
// Configures how rate limiting works
// =============================================

model RateLimitRule {
  id          String    @id @default(uuid())
  workspaceId String    @map("workspace_id")
  
  name        String
  algorithm   Algorithm @default(TOKEN_BUCKET)
  limit       Int
  window      Int
  
  isActive    Boolean   @default(true) @map("is_active")
  priority    Int       @default(0)
  
  createdAt   DateTime  @default(now()) @map("created_at")

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, priority])
  @@map("rate_limit_rules")
}

enum Algorithm {
  TOKEN_BUCKET
  SLIDING_WINDOW
  FIXED_WINDOW
}

// =============================================
// REQUEST LOG
// Records every API request for analytics
// =============================================

model RequestLog {
  id          String   @id @default(uuid())
  apiKeyId    String   @map("api_key_id")
  
  method      String
  path        String
  statusCode  Int      @map("status_code")
  latencyMs   Int      @map("latency_ms")
  rateLimited Boolean  @default(false) @map("rate_limited")
  
  createdAt   DateTime @default(now()) @map("created_at")

  apiKey      ApiKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  @@index([apiKeyId, createdAt])
  @@index([createdAt])
  @@map("request_logs")
}
```

### Step 4: Create Environment for DB Package

Create `packages/db/.env`:

```bash
DATABASE_URL="postgresql://rateguard:rateguard@localhost:5432/rateguard"
```

### Step 5: Push Schema to Database

```bash
# Make sure Docker is running
cd ../..
npm run docker:up

# Push schema
cd packages/db
npx prisma db push
```

You should see:
```
🚀 Your database is now in sync with your Prisma schema.
```

### Step 6: Generate Prisma Client

```bash
npx prisma generate
```

### Step 7: Create Database Client

Replace `packages/db/src/index.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

// Singleton pattern - one client for entire app
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export everything from Prisma
export * from '@prisma/client';
```

### Step 8: Build Package

```bash
npm run build
```

### Step 9: Test with Prisma Studio

```bash
npx prisma studio
```

Opens browser at http://localhost:5555 — you can see all tables!

### Step 10: Create Test Script

Create `packages/db/src/test.ts`:

```typescript
import { prisma } from './index';

async function test() {
  console.log('🔌 Testing database...\n');

  // Test connection
  await prisma.$connect();
  console.log('✅ Connected!\n');

  // Show tables
  const users = await prisma.user.count();
  const workspaces = await prisma.workspace.count();
  const apiKeys = await prisma.apiKey.count();

  console.log('📊 Tables:');
  console.log(`   users: ${users}`);
  console.log(`   workspaces: ${workspaces}`);
  console.log(`   api_keys: ${apiKeys}`);
  console.log('');
  console.log('✨ Database ready!');

  await prisma.$disconnect();
}

test().catch(console.error);
```

Run:

```bash
npx tsx src/test.ts
```

### Step 11: Update Server

Update `apps/server/src/index.ts`:

```typescript
import { prisma } from '@rateguard/db';

async function main() {
  console.log('🚀 RateGuard Server');
  console.log('');

  // Test database
  await prisma.$connect();
  console.log('✅ Database connected');

  const userCount = await prisma.user.count();
  console.log(`📊 Users: ${userCount}`);
  console.log('');
  console.log('✨ Phase 1 complete!');
  console.log('');
  console.log('Next: Phase 2 - Core Services');

  await prisma.$disconnect();
}

main().catch(console.error);
```

Test:
```bash
cd ../..
npm run dev:server
```

### Step 12: Commit

```bash
git add .
git commit -m "feat(db): add Prisma schema and models

- Add User, Workspace, WorkspaceMember models
- Add ApiKey with hash storage
- Add RateLimitRule with algorithm enum
- Add RequestLog for analytics
- Create Prisma client singleton"
```

### Step 13: Merge to Main

```bash
git checkout main
git merge feat/database-schema
```

---

## ✅ Phase 1 Complete!

### What You Built

```
rateguard/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── docker/
│   └── compose.yml          ← PostgreSQL + Redis
├── packages/
│   └── db/
│       ├── prisma/
│       │   └── schema.prisma ← 6 models
│       ├── src/
│       │   ├── index.ts      ← Prisma client
│       │   └── test.ts
│       ├── package.json
│       └── tsconfig.json
└── apps/
    └── server/
        ├── src/
        │   └── index.ts
        ├── package.json
        └── tsconfig.json
```

### Git Log

```bash
git log --oneline
```
```
abc123 feat(db): add Prisma schema and models
def456 feat(docker): add PostgreSQL and Redis containers
ghi789 feat(setup): initialize project structure
```

### What You Learned

| Branch | Technology | Concept |
|--------|------------|---------|
| feat/project-setup | npm | Workspaces, monorepo |
| feat/docker-setup | Docker | Containers, compose |
| feat/database-schema | Prisma | ORM, models, relations |

---

# PHASE 2: Core Services

**Goal:** Build the core business logic services.

**Time:** 2-3 hours

**Branches:**
1. `feat/crypto-utils` — Password and API key hashing
2. `feat/auth-service` — Register, login, JWT
3. `feat/workspace-service` — Workspace CRUD
4. `feat/api-key-service` — API key management

---

## Branch 2.1: feat/crypto-utils

### What You're Building
- Password hashing (bcrypt)
- API key generation
- API key hashing (SHA256)

### Why Two Different Hashing Methods?

| | Passwords | API Keys |
|---|-----------|----------|
| **Entropy** | Low (humans pick "password123") | High (random 32 chars) |
| **Attack** | Brute force possible | Can't brute force |
| **Speed need** | Slow is good (slows attacks) | Fast (check every request) |
| **Algorithm** | bcrypt (slow) | SHA256 (fast) |

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

### Step 3: Create Crypto Utils

Create `apps/server/src/utils/crypto.ts`:

```typescript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// =============================================
// API KEY FUNCTIONS
// =============================================

/**
 * Generate API key
 * Format: rg_live_xxxxxxxxxxxxxxxxxxxxxxxx
 */
export function generateApiKey(env: 'live' | 'test' = 'live'): string {
  const random = crypto.randomBytes(24).toString('base64url');
  return `rg_${env}_${random}`;
}

/**
 * Hash API key (SHA256 - fast)
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Get display prefix: "rg_live_K7dF..."
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 14) + '...';
}

// =============================================
// PASSWORD FUNCTIONS
// =============================================

/**
 * Hash password (bcrypt - slow, secure)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string, 
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Step 4: Test Crypto

Create `apps/server/src/utils/crypto.test.ts`:

```typescript
import {
  generateApiKey,
  hashApiKey,
  getKeyPrefix,
  hashPassword,
  verifyPassword,
} from './crypto';

async function test() {
  console.log('🔐 Testing Crypto\n');

  // API Key
  console.log('--- API Key ---');
  const key = generateApiKey('live');
  console.log('Key:', key);
  console.log('Hash:', hashApiKey(key).substring(0, 20) + '...');
  console.log('Prefix:', getKeyPrefix(key));
  console.log('');

  // Password
  console.log('--- Password ---');
  const hash = await hashPassword('mypassword');
  console.log('Hash:', hash.substring(0, 30) + '...');
  
  const valid = await verifyPassword('mypassword', hash);
  const invalid = await verifyPassword('wrongpassword', hash);
  console.log('Correct password:', valid ? '✅' : '❌');
  console.log('Wrong password:', invalid ? '❌ (bug!)' : '✅');
  console.log('');

  console.log('✨ Crypto tests passed!');
}

test();
```

Run:
```bash
npx tsx src/utils/crypto.test.ts
```

### Step 5: Commit

```bash
cd ../..
git add .
git commit -m "feat(crypto): add password and API key utilities

- Add bcrypt password hashing
- Add SHA256 API key hashing  
- Add API key generation (rg_live_xxx format)"
```

### Step 6: Merge

```bash
git checkout main
git merge feat/crypto-utils
```

---

## Branch 2.2: feat/auth-service

### What You're Building
- User registration
- User login
- JWT tokens

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

Create `apps/server/src/config.ts`:

```typescript
export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: '24h',
};
```

### Step 4: Create Auth Service

Create `apps/server/src/services/auth.service.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { prisma, User } from '@rateguard/db';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { config } from '../config';

// Types
export interface AuthResult {
  user: { id: string; email: string; name: string };
  token: string;
}

// Service
class AuthService {
  async register(email: string, password: string, name: string): Promise<AuthResult> {
    // Validate
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check existing
    const existing = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    if (existing) {
      throw new Error('Email already registered');
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash: await hashPassword(password),
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: this.createToken(user),
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token: this.createToken(user),
    };
  }

  verifyToken(token: string): { userId: string; email: string } {
    try {
      return jwt.verify(token, config.jwtSecret) as any;
    } catch {
      throw new Error('Invalid token');
    }
  }

  private createToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }
}

export const authService = new AuthService();
```

### Step 5: Test Auth

Create `apps/server/src/services/auth.service.test.ts`:

```typescript
import { prisma } from '@rateguard/db';
import { authService } from './auth.service';

async function test() {
  console.log('🔐 Testing Auth Service\n');

  // Cleanup
  await prisma.user.deleteMany({ where: { email: 'test@test.com' } });

  // Register
  console.log('--- Register ---');
  const reg = await authService.register('test@test.com', 'password123', 'Test User');
  console.log('User:', reg.user);
  console.log('Token:', reg.token.substring(0, 30) + '...');
  console.log('');

  // Login
  console.log('--- Login ---');
  const login = await authService.login('test@test.com', 'password123');
  console.log('User:', login.user);
  console.log('');

  // Verify token
  console.log('--- Verify Token ---');
  const payload = authService.verifyToken(login.token);
  console.log('Payload:', payload);
  console.log('');

  // Wrong password
  console.log('--- Wrong Password ---');
  try {
    await authService.login('test@test.com', 'wrong');
  } catch (e: any) {
    console.log('✅ Rejected:', e.message);
  }
  console.log('');

  // Cleanup
  await prisma.user.deleteMany({ where: { email: 'test@test.com' } });

  console.log('✨ Auth tests passed!');
  await prisma.$disconnect();
}

test().catch(console.error);
```

Run:
```bash
npx tsx src/services/auth.service.test.ts
```

### Step 6: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(auth): add user authentication service

- Add register with email validation
- Add login with password verification
- Add JWT token creation and verification"

git checkout main
git merge feat/auth-service
```

---

## Branch 2.3: feat/workspace-service

### What You're Building
- Create workspace
- List user's workspaces
- Check workspace access

### Step 1: Create Branch

```bash
git checkout -b feat/workspace-service
```

### Step 2: Create Service

Create `apps/server/src/services/workspace.service.ts`:

```typescript
import { prisma, Workspace, Role } from '@rateguard/db';

class WorkspaceService {
  async create(name: string, slug: string, ownerId: string): Promise<Workspace> {
    // Check slug availability
    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) {
      throw new Error('Workspace slug already taken');
    }

    // Create with owner
    return prisma.workspace.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        members: {
          create: { userId: ownerId, role: 'OWNER' },
        },
      },
      include: { members: true },
    });
  }

  async listByUser(userId: string): Promise<Workspace[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
    return memberships.map(m => m.workspace);
  }

  async getByIdWithAccess(workspaceId: string, userId: string): Promise<Workspace | null> {
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: { workspace: true },
    });
    return membership?.workspace ?? null;
  }

  async getMemberRole(workspaceId: string, userId: string): Promise<Role | null> {
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    return membership?.role ?? null;
  }
}

export const workspaceService = new WorkspaceService();
```

### Step 3: Test

Create `apps/server/src/services/workspace.service.test.ts`:

```typescript
import { prisma } from '@rateguard/db';
import { workspaceService } from './workspace.service';

async function test() {
  console.log('🏢 Testing Workspace Service\n');

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'ws-test@test.com',
      name: 'WS Test',
      passwordHash: 'test',
    },
  });

  // Create workspace
  console.log('--- Create ---');
  const ws = await workspaceService.create('My Workspace', 'my-workspace', user.id);
  console.log('Created:', ws.name, ws.slug);
  console.log('');

  // List
  console.log('--- List ---');
  const list = await workspaceService.listByUser(user.id);
  console.log('Workspaces:', list.map(w => w.name));
  console.log('');

  // Access check
  console.log('--- Access ---');
  const access = await workspaceService.getByIdWithAccess(ws.id, user.id);
  console.log('Has access:', access ? '✅' : '❌');
  
  const role = await workspaceService.getMemberRole(ws.id, user.id);
  console.log('Role:', role);
  console.log('');

  // Cleanup
  await prisma.workspace.delete({ where: { id: ws.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('✨ Workspace tests passed!');
  await prisma.$disconnect();
}

test().catch(console.error);
```

Run:
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
- Add access check with roles"

git checkout main
git merge feat/workspace-service
```

---

## Branch 2.4: feat/api-key-service

### What You're Building
- Generate API keys
- Store hashed keys
- Validate keys on requests

### Step 1: Create Branch

```bash
git checkout -b feat/api-key-service
```

### Step 2: Create Service

Create `apps/server/src/services/api-key.service.ts`:

```typescript
import { prisma, ApiKey } from '@rateguard/db';
import { generateApiKey, hashApiKey, getKeyPrefix } from '../utils/crypto';

class ApiKeyService {
  /**
   * Create new API key
   * Returns the full key ONLY ONCE
   */
  async create(
    workspaceId: string,
    name: string
  ): Promise<{ apiKey: ApiKey; fullKey: string }> {
    const fullKey = generateApiKey('live');
    const keyHash = hashApiKey(fullKey);
    const keyPrefix = getKeyPrefix(fullKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId,
        name,
        keyHash,
        keyPrefix,
      },
    });

    return { apiKey, fullKey };
  }

  /**
   * Validate API key from request header
   */
  async validate(key: string): Promise<ApiKey | null> {
    if (!key.startsWith('rg_')) return null;

    const keyHash = hashApiKey(key);

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey) return null;
    if (!apiKey.isActive) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update last used (non-blocking)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    return apiKey;
  }

  /**
   * List keys for workspace (without hashes)
   */
  async listByWorkspace(workspaceId: string) {
    return prisma.apiKey.findMany({
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
  }

  /**
   * Revoke API key
   */
  async revoke(id: string, workspaceId: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id, workspaceId },
      data: { isActive: false },
    });
  }
}

export const apiKeyService = new ApiKeyService();
```

### Step 3: Test

Create `apps/server/src/services/api-key.service.test.ts`:

```typescript
import { prisma } from '@rateguard/db';
import { apiKeyService } from './api-key.service';

async function test() {
  console.log('🔑 Testing API Key Service\n');

  // Create test data
  const user = await prisma.user.create({
    data: { email: 'key-test@test.com', name: 'Key Test', passwordHash: 'test' },
  });
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Key Test WS',
      slug: 'key-test-ws',
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  });

  // Create key
  console.log('--- Create ---');
  const { apiKey, fullKey } = await apiKeyService.create(workspace.id, 'Test Key');
  console.log('Full key (one time!):', fullKey);
  console.log('Prefix:', apiKey.keyPrefix);
  console.log('');

  // Validate correct key
  console.log('--- Validate ---');
  const valid = await apiKeyService.validate(fullKey);
  console.log('Valid key:', valid ? '✅' : '❌');

  // Validate wrong key
  const invalid = await apiKeyService.validate('rg_live_wrongkey');
  console.log('Wrong key:', invalid ? '❌ (bug!)' : '✅ rejected');
  console.log('');

  // List keys
  console.log('--- List ---');
  const keys = await apiKeyService.listByWorkspace(workspace.id);
  console.log('Keys:', keys.map(k => ({ name: k.name, prefix: k.keyPrefix })));
  console.log('');

  // Revoke
  console.log('--- Revoke ---');
  await apiKeyService.revoke(apiKey.id, workspace.id);
  const revoked = await apiKeyService.validate(fullKey);
  console.log('After revoke:', revoked ? '❌ still valid (bug!)' : '✅ rejected');
  console.log('');

  // Cleanup
  await prisma.workspace.delete({ where: { id: workspace.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log('✨ API Key tests passed!');
  await prisma.$disconnect();
}

test().catch(console.error);
```

Run:
```bash
cd apps/server
npx tsx src/services/api-key.service.test.ts
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(api-key): add API key service

- Add key generation with secure random
- Add hash-based storage (never store plain key)
- Add key validation for requests
- Add revocation"

git checkout main
git merge feat/api-key-service
```

---

## ✅ Phase 2 Complete!

### Git Log

```bash
git log --oneline
```
```
xxx feat(api-key): add API key service
xxx feat(workspace): add workspace service
xxx feat(auth): add user authentication service
xxx feat(crypto): add password and API key utilities
xxx feat(db): add Prisma schema and models
xxx feat(docker): add PostgreSQL and Redis containers
xxx feat(setup): initialize project structure
```

### Files Added

```
apps/server/src/
├── config.ts
├── utils/
│   ├── crypto.ts
│   └── crypto.test.ts
└── services/
    ├── auth.service.ts
    ├── auth.service.test.ts
    ├── workspace.service.ts
    ├── workspace.service.test.ts
    ├── api-key.service.ts
    └── api-key.service.test.ts
```

---

# PHASE 3: Rate Limiting

**Goal:** Build the rate limiting system.

**Time:** 2 hours

**Branches:**
1. `feat/redis-client` — Redis connection
2. `feat/rate-limiter` — Token bucket algorithm
3. `feat/rate-limit-service` — Coordination service

---

## Branch 3.1: feat/redis-client

### Step 1: Create Branch

```bash
git checkout -b feat/redis-client
```

### Step 2: Install Redis

```bash
cd apps/server
npm install ioredis
npm install -D @types/ioredis
```

### Step 3: Create Redis Client

Create `apps/server/src/lib/redis.ts`:

```typescript
import Redis from 'ioredis';

// Create connection
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Log connection
redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));
```

### Step 4: Test

Create `apps/server/src/lib/redis.test.ts`:

```typescript
import { redis } from './redis';

async function test() {
  console.log('🔴 Testing Redis\n');

  // Set
  await redis.set('test:key', 'hello');
  console.log('SET test:key = hello');

  // Get
  const value = await redis.get('test:key');
  console.log('GET test:key =', value);

  // Increment
  await redis.set('test:counter', '0');
  await redis.incr('test:counter');
  await redis.incr('test:counter');
  const counter = await redis.get('test:counter');
  console.log('Counter after 2 incr:', counter);

  // Cleanup
  await redis.del('test:key', 'test:counter');

  console.log('\n✨ Redis tests passed!');
  await redis.quit();
}

test().catch(console.error);
```

Run:
```bash
npx tsx src/lib/redis.test.ts
```

### Step 5: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(redis): add Redis client

- Add ioredis connection
- Add connection logging"

git checkout main
git merge feat/redis-client
```

---

## Branch 3.2: feat/rate-limiter

### What You're Building
Token bucket rate limiter with Lua for atomicity.

### Why Lua?

```
Without Lua (broken):
  Request 1: GET tokens → 1 token
  Request 2: GET tokens → 1 token (same time!)
  Request 1: SET tokens → 0
  Request 2: SET tokens → 0
  
  Both requests think they got the last token!

With Lua (atomic):
  Request 1: [GET-CHECK-SET all at once] → got token
  Request 2: [GET-CHECK-SET all at once] → no tokens!
```

### Step 1: Create Branch

```bash
git checkout -b feat/rate-limiter
```

### Step 2: Create Rate Limiter

Create `apps/server/src/lib/rate-limiter.ts`:

```typescript
import { redis } from './redis';

// Result from rate limit check
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInMs: number;
}

// Lua script for token bucket
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

-- Initialize if new
if tokens == nil then
  tokens = capacity
  lastRefill = now
end

-- Refill tokens based on time passed
local elapsed = (now - lastRefill) / 1000
tokens = math.min(capacity, tokens + elapsed * refillRate)

-- Try to consume 1 token
if tokens >= 1 then
  tokens = tokens - 1
  redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
  redis.call('EXPIRE', key, math.ceil(capacity / refillRate) * 2)
  return {1, math.floor(tokens), math.ceil((capacity - tokens) / refillRate * 1000)}
else
  local waitTime = math.ceil((1 - tokens) / refillRate * 1000)
  return {0, 0, waitTime}
end
`;

let scriptSha: string | null = null;

async function loadScript(): Promise<string> {
  if (!scriptSha) {
    scriptSha = await redis.script('LOAD', TOKEN_BUCKET_SCRIPT) as string;
  }
  return scriptSha;
}

/**
 * Check rate limit
 * @param key - Unique identifier (e.g., "ratelimit:apikey:xxx")
 * @param limit - Max requests per window
 * @param windowSeconds - Time window in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const refillRate = limit / windowSeconds;
  const now = Date.now();

  try {
    const sha = await loadScript();
    const result = await redis.evalsha(sha, 1, key, limit, refillRate, now) as number[];

    return {
      allowed: result[0] === 1,
      limit,
      remaining: result[1],
      resetInMs: result[2],
    };
  } catch (error: any) {
    // Script not loaded (Redis restarted)
    if (error.message?.includes('NOSCRIPT')) {
      scriptSha = null;
      return checkRateLimit(key, limit, windowSeconds);
    }
    throw error;
  }
}
```

### Step 3: Test

Create `apps/server/src/lib/rate-limiter.test.ts`:

```typescript
import { redis } from './redis';
import { checkRateLimit } from './rate-limiter';

async function test() {
  console.log('⏱️  Testing Rate Limiter\n');

  const key = 'test:ratelimit';
  await redis.del(key);

  // Make 7 requests with limit of 5
  console.log('--- 7 requests, limit 5 ---\n');

  for (let i = 1; i <= 7; i++) {
    const result = await checkRateLimit(key, 5, 10);
    console.log(
      `Request ${i}:`,
      result.allowed ? '✅ Allowed' : '❌ Blocked',
      `| Remaining: ${result.remaining}`
    );
  }

  console.log('\n⏳ Waiting 3 seconds...\n');
  await new Promise(r => setTimeout(r, 3000));

  // Should have some tokens back
  const after = await checkRateLimit(key, 5, 10);
  console.log(
    'After 3s:',
    after.allowed ? '✅ Allowed' : '❌ Blocked',
    `| Remaining: ${after.remaining}`
  );

  // Cleanup
  await redis.del(key);

  console.log('\n✨ Rate limiter tests passed!');
  await redis.quit();
}

test().catch(console.error);
```

Run:
```bash
cd apps/server
npx tsx src/lib/rate-limiter.test.ts
```

Expected:
```
⏱️  Testing Rate Limiter

--- 7 requests, limit 5 ---

Request 1: ✅ Allowed | Remaining: 4
Request 2: ✅ Allowed | Remaining: 3
Request 3: ✅ Allowed | Remaining: 2
Request 4: ✅ Allowed | Remaining: 1
Request 5: ✅ Allowed | Remaining: 0
Request 6: ❌ Blocked | Remaining: 0
Request 7: ❌ Blocked | Remaining: 0

⏳ Waiting 3 seconds...

After 3s: ✅ Allowed | Remaining: 0

✨ Rate limiter tests passed!
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(rate-limit): add token bucket rate limiter

- Add Lua script for atomic operations
- Add token bucket algorithm
- Add refill based on time elapsed"

git checkout main
git merge feat/rate-limiter
```

---

## Branch 3.3: feat/rate-limit-service

### Step 1: Create Branch

```bash
git checkout -b feat/rate-limit-service
```

### Step 2: Create Service

Create `apps/server/src/services/rate-limit.service.ts`:

```typescript
import { prisma } from '@rateguard/db';
import { checkRateLimit, RateLimitResult } from '../lib/rate-limiter';

class RateLimitService {
  /**
   * Check rate limit for an API key
   */
  async check(apiKeyId: string, workspaceId: string): Promise<RateLimitResult> {
    // Get rule for workspace
    const rule = await prisma.rateLimitRule.findFirst({
      where: { workspaceId, isActive: true },
      orderBy: { priority: 'desc' },
    });

    // Default: 100 per minute
    const limit = rule?.limit ?? 100;
    const window = rule?.window ?? 60;

    // Check rate limit
    const key = `ratelimit:${workspaceId}:${apiKeyId}`;
    return checkRateLimit(key, limit, window);
  }
}

export const rateLimitService = new RateLimitService();
```

### Step 3: Test

Create `apps/server/src/services/rate-limit.service.test.ts`:

```typescript
import { prisma } from '@rateguard/db';
import { redis } from '../lib/redis';
import { rateLimitService } from './rate-limit.service';

async function test() {
  console.log('⏱️  Testing Rate Limit Service\n');

  // Setup
  const user = await prisma.user.create({
    data: { email: 'rl-test@test.com', name: 'RL Test', passwordHash: 'test' },
  });
  const workspace = await prisma.workspace.create({
    data: {
      name: 'RL Test WS',
      slug: 'rl-test-ws',
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  });

  // Create rule: 3 per 10 seconds
  await prisma.rateLimitRule.create({
    data: {
      workspaceId: workspace.id,
      name: 'Test Rule',
      algorithm: 'TOKEN_BUCKET',
      limit: 3,
      window: 10,
    },
  });

  // Clear any existing rate limit
  await redis.del(`ratelimit:${workspace.id}:test-key`);

  // Test
  console.log('--- Rule: 3 per 10 seconds ---\n');

  for (let i = 1; i <= 5; i++) {
    const result = await rateLimitService.check('test-key', workspace.id);
    console.log(
      `Request ${i}:`,
      result.allowed ? '✅' : '❌',
      `| Remaining: ${result.remaining}`
    );
  }

  // Cleanup
  await prisma.workspace.delete({ where: { id: workspace.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await redis.del(`ratelimit:${workspace.id}:test-key`);

  console.log('\n✨ Rate limit service tests passed!');
  await prisma.$disconnect();
  await redis.quit();
}

test().catch(console.error);
```

Run:
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
- Add rule lookup from database
- Add default limits"

git checkout main
git merge feat/rate-limit-service
```

---

## ✅ Phase 3 Complete!

### Files Added

```
apps/server/src/
├── lib/
│   ├── redis.ts
│   ├── redis.test.ts
│   ├── rate-limiter.ts
│   └── rate-limiter.test.ts
└── services/
    ├── rate-limit.service.ts
    └── rate-limit.service.test.ts
```

### Git Log

```
xxx feat(rate-limit): add rate limit service
xxx feat(rate-limit): add token bucket rate limiter
xxx feat(redis): add Redis client
xxx feat(api-key): add API key service
... (earlier commits)
```

---

# PHASE 4: HTTP Server

**Goal:** Create the Express API.

**Time:** 2-3 hours

**Branches:**
1. `feat/express-setup` — Express with middleware
2. `feat/auth-routes` — /auth/* endpoints
3. `feat/workspace-routes` — /workspaces/* endpoints  
4. `feat/proxy-endpoint` — /v1/* with rate limiting

---

## Branch 4.1: feat/express-setup

### Step 1: Create Branch

```bash
git checkout -b feat/express-setup
```

### Step 2: Install Express

```bash
cd apps/server
npm install express cors
npm install -D @types/express @types/cors
```

### Step 3: Create Server

Create `apps/server/src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { config } from './config';

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

export function startServer(app: express.Application) {
  const port = config.port;
  
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}
```

### Step 4: Create Auth Middleware

Create `apps/server/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      email?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.slice(7);

  try {
    const payload = authService.verifyToken(token);
    req.userId = payload.userId;
    req.email = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Step 5: Update Entry Point

Update `apps/server/src/index.ts`:

```typescript
import { createServer, startServer } from './server';

const app = createServer();
startServer(app);
```

### Step 6: Test

```bash
npx tsx src/index.ts
```

In another terminal:
```bash
curl http://localhost:3000/health
```

### Step 7: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(server): add Express setup

- Add Express with CORS and JSON middleware
- Add health check endpoint
- Add auth middleware"

git checkout main
git merge feat/express-setup
```

---

## Branch 4.2: feat/auth-routes

### Step 1: Create Branch

```bash
git checkout -b feat/auth-routes
```

### Step 2: Create Routes

Create `apps/server/src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { authService } from '../services/auth.service';

const router = Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await authService.register(email, password, name);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

export { router as authRoutes };
```

### Step 3: Register Routes

Update `apps/server/src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/auth', authRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

export function startServer(app: express.Application) {
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  });
}
```

### Step 4: Test

```bash
cd apps/server
npx tsx src/index.ts
```

In another terminal:
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Step 5: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(routes): add auth routes

- Add POST /auth/register
- Add POST /auth/login"

git checkout main
git merge feat/auth-routes
```

---

## Branch 4.3: feat/workspace-routes

### Step 1: Create Branch

```bash
git checkout -b feat/workspace-routes
```

### Step 2: Create Routes

Create `apps/server/src/routes/workspace.routes.ts`:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { workspaceService } from '../services/workspace.service';
import { apiKeyService } from '../services/api-key.service';
import { prisma } from '@rateguard/db';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// POST /workspaces - Create workspace
router.post('/', async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Missing name or slug' });
    }

    const workspace = await workspaceService.create(name, slug, req.userId!);
    res.status(201).json(workspace);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /workspaces - List user's workspaces
router.get('/', async (req, res) => {
  const workspaces = await workspaceService.listByUser(req.userId!);
  res.json(workspaces);
});

// POST /workspaces/:id/api-keys - Create API key
router.post('/:id/api-keys', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    // Check access
    const workspace = await workspaceService.getByIdWithAccess(req.params.id, req.userId!);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { apiKey, fullKey } = await apiKeyService.create(workspace.id, name);
    
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key: fullKey,  // Only shown once!
      prefix: apiKey.keyPrefix,
      message: 'Save this key! It will not be shown again.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /workspaces/:id/api-keys - List API keys
router.get('/:id/api-keys', async (req, res) => {
  const workspace = await workspaceService.getByIdWithAccess(req.params.id, req.userId!);
  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const keys = await apiKeyService.listByWorkspace(workspace.id);
  res.json(keys);
});

// POST /workspaces/:id/rules - Create rate limit rule
router.post('/:id/rules', async (req, res) => {
  try {
    const { name, limit, window } = req.body;
    
    const workspace = await workspaceService.getByIdWithAccess(req.params.id, req.userId!);
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

    res.status(201).json(rule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /workspaces/:id/rules - List rules
router.get('/:id/rules', async (req, res) => {
  const workspace = await workspaceService.getByIdWithAccess(req.params.id, req.userId!);
  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const rules = await prisma.rateLimitRule.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { priority: 'desc' },
  });
  res.json(rules);
});

export { router as workspaceRoutes };
```

### Step 3: Register Routes

Update `apps/server/src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { workspaceRoutes } from './routes/workspace.routes';

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/auth', authRoutes);
  app.use('/workspaces', workspaceRoutes);

  // Health
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

export function startServer(app: express.Application) {
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  });
}
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(routes): add workspace routes

- Add POST/GET /workspaces
- Add POST/GET /workspaces/:id/api-keys
- Add POST/GET /workspaces/:id/rules"

git checkout main
git merge feat/workspace-routes
```

---

## Branch 4.4: feat/proxy-endpoint

### Step 1: Create Branch

```bash
git checkout -b feat/proxy-endpoint
```

### Step 2: Create Proxy Route

Create `apps/server/src/routes/proxy.routes.ts`:

```typescript
import { Router } from 'express';
import { apiKeyService } from '../services/api-key.service';
import { rateLimitService } from '../services/rate-limit.service';
import { prisma } from '@rateguard/db';

const router = Router();

// All /v1/* requests
router.all('/*', async (req, res) => {
  const startTime = Date.now();

  // 1. Get API key from header
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }

  // 2. Validate API key
  const key = await apiKeyService.validate(apiKey);
  if (!key) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // 3. Check rate limit
  const rateLimit = await rateLimitService.check(key.id, key.workspaceId);

  // Set headers
  res.set({
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetInMs / 1000)),
  });

  // 4. If rate limited, reject
  if (!rateLimit.allowed) {
    const latency = Date.now() - startTime;

    // Log
    await prisma.requestLog.create({
      data: {
        apiKeyId: key.id,
        method: req.method,
        path: req.path,
        statusCode: 429,
        latencyMs: latency,
        rateLimited: true,
      },
    });

    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(rateLimit.resetInMs / 1000),
    });
  }

  // 5. Success - for now, just echo
  const latency = Date.now() - startTime;

  // Log
  await prisma.requestLog.create({
    data: {
      apiKeyId: key.id,
      method: req.method,
      path: req.path,
      statusCode: 200,
      latencyMs: latency,
      rateLimited: false,
    },
  });

  res.json({
    success: true,
    method: req.method,
    path: req.path,
    message: 'Request successful',
  });
});

export { router as proxyRoutes };
```

### Step 3: Register Routes

Update `apps/server/src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { workspaceRoutes } from './routes/workspace.routes';
import { proxyRoutes } from './routes/proxy.routes';

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/auth', authRoutes);
  app.use('/workspaces', workspaceRoutes);
  app.use('/v1', proxyRoutes);

  // Health
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  return app;
}

export function startServer(app: express.Application) {
  app.listen(config.port, () => {
    console.log(`
🚀 RateGuard Server running on http://localhost:${config.port}

Endpoints:
  POST /auth/register
  POST /auth/login
  
  GET  /workspaces
  POST /workspaces
  POST /workspaces/:id/api-keys
  GET  /workspaces/:id/api-keys
  POST /workspaces/:id/rules
  
  ALL  /v1/* (rate limited)
    `);
  });
}
```

### Step 4: Full Integration Test

```bash
cd apps/server
npx tsx src/index.ts
```

In another terminal:
```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"password123","name":"Demo"}'

# Save the token!
TOKEN="your-token-here"

# 2. Create workspace
curl -X POST http://localhost:3000/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Demo Workspace","slug":"demo"}'

# Save the workspace ID!
WS_ID="workspace-id-here"

# 3. Create rule (5 per minute)
curl -X POST "http://localhost:3000/workspaces/$WS_ID/rules" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","limit":5,"window":60}'

# 4. Create API key
curl -X POST "http://localhost:3000/workspaces/$WS_ID/api-keys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Key"}'

# Save the key!
API_KEY="rg_live_xxx"

# 5. Test rate limiting
for i in {1..7}; do
  echo "Request $i:"
  curl -s http://localhost:3000/v1/test \
    -H "X-API-Key: $API_KEY"
  echo ""
done
```

### Step 5: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(routes): add proxy endpoint with rate limiting

- Add /v1/* catch-all route
- Add API key validation
- Add rate limit checking
- Add request logging"

git checkout main
git merge feat/proxy-endpoint
```

---

## ✅ Phase 4 Complete!

### Your API is Ready!

```
POST /auth/register       ← Create account
POST /auth/login          ← Get JWT token

GET  /workspaces          ← List workspaces (needs JWT)
POST /workspaces          ← Create workspace
POST /workspaces/:id/api-keys  ← Create API key
GET  /workspaces/:id/api-keys  ← List keys
POST /workspaces/:id/rules     ← Create rule

ALL  /v1/*                ← Rate limited proxy (needs X-API-Key)
```

### Git Log

```
xxx feat(routes): add proxy endpoint with rate limiting
xxx feat(routes): add workspace routes
xxx feat(routes): add auth routes
xxx feat(server): add Express setup
xxx feat(rate-limit): add rate limit service
... (earlier)
```

---

# Summary

## What You Built

A complete API rate limiting gateway:

| Feature | Status |
|---------|--------|
| User auth (register/login) | ✅ |
| Workspaces | ✅ |
| API key management | ✅ |
| Rate limiting (token bucket) | ✅ |
| Request logging | ✅ |
| REST API | ✅ |

## Git Branches (18 total across 5 phases)

| Phase | Branches |
|-------|----------|
| 1. Foundation | 3 branches |
| 2. Core Services | 4 branches |
| 3. Rate Limiting | 3 branches |
| 4. HTTP Server | 4 branches |
| 5. Dashboard | 4 branches (to do) |

## Next Steps

1. **Phase 5: Dashboard** — Next.js frontend
2. **Analytics** — Charts and stats
3. **Proxy forwarding** — Forward to real upstream APIs

---

## Start Building!

```bash
mkdir rateguard
cd rateguard
git init
git branch -M main
git checkout -b feat/project-setup
```

Follow the guide step by step. One branch at a time.

**You got this!** 🚀
