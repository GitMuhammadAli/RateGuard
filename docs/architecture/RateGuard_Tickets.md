# RateGuard: Ticket Board

## How This Works

Each ticket is a small task. You:

1. **Read** the ticket
2. **Try** to build it yourself first
3. **Ask LLM** for help when stuck (paste the ticket)
4. **Debug** until it works
5. **Check off** acceptance criteria
6. **Move to next ticket**

---

# 🎫 SPRINT 1: Environment Setup (Day 1)

---

## TICKET-001: Install Docker Desktop

**Type:** Setup  
**Time:** 15 min  
**Depends on:** Nothing

### Task
Install Docker Desktop on your machine.

### Steps
1. Go to https://docker.com/products/docker-desktop
2. Download for your OS
3. Install it
4. Start Docker Desktop
5. Open terminal and run: `docker --version`

### Acceptance Criteria
- [ ] `docker --version` shows version number (e.g., `Docker version 24.0.0`)
- [ ] Docker Desktop is running (whale icon in taskbar)

### If Stuck
- Windows: Enable WSL2 first
- Mac: Just install and run
- Linux: Follow official docs

---

## TICKET-002: Create Project Folder

**Type:** Setup  
**Time:** 5 min  
**Depends on:** TICKET-001

### Task
Create the project structure.

### Steps
```bash
mkdir rateguard-learn
cd rateguard-learn
npm init -y
```

### Acceptance Criteria
- [ ] Folder `rateguard-learn` exists
- [ ] `package.json` exists inside it

---

## TICKET-003: Run Redis with Docker

**Type:** Infrastructure  
**Time:** 10 min  
**Depends on:** TICKET-002

### Task
Create a docker-compose file and run Redis.

### What to Create
File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Commands to Run
```bash
docker-compose up -d
docker-compose ps
```

### Acceptance Criteria
- [ ] `docker-compose ps` shows redis as "running" or "Up"
- [ ] No errors in terminal

### How to Verify
```bash
docker exec -it rateguard-learn-redis-1 redis-cli ping
```
Should print: `PONG`

### If Container Name Different
Run `docker ps` to see actual container name, then use that name.

---

## TICKET-004: Play with Redis CLI

**Type:** Learning  
**Time:** 15 min  
**Depends on:** TICKET-003

### Task
Learn basic Redis commands by typing them yourself.

### Steps

1. Enter Redis CLI:
```bash
docker exec -it rateguard-learn-redis-1 redis-cli
```

2. Try each command and observe the output:

```redis
SET name "Usama"
GET name

SET counter 0
INCR counter
INCR counter
INCR counter
GET counter

EXPIRE counter 10
TTL counter
# wait 10 seconds
GET counter

DEL name
GET name

exit
```

### Acceptance Criteria
- [ ] You typed each command yourself (no copy-paste)
- [ ] You understand what SET, GET, INCR, EXPIRE, TTL, DEL do
- [ ] You saw counter disappear after 10 seconds

### What You Learned
- SET: Store a value
- GET: Retrieve a value
- INCR: Add 1 to a number
- EXPIRE: Set time-to-live in seconds
- TTL: Check remaining time
- DEL: Delete a key

---

# 🎫 SPRINT 2: Redis from Node.js (Day 2)

---

## TICKET-005: Install ioredis Package

**Type:** Setup  
**Time:** 2 min  
**Depends on:** TICKET-004

### Task
Install the Redis client for Node.js.

### Command
```bash
npm install ioredis
```

### Acceptance Criteria
- [ ] `package.json` has `ioredis` in dependencies
- [ ] `node_modules/ioredis` folder exists

---

## TICKET-006: Connect to Redis from Node.js

**Type:** Code  
**Time:** 10 min  
**Depends on:** TICKET-005

### Task
Write a script that connects to Redis and does basic operations.

### What to Create
File: `01-redis-basic.js`

### Requirements
1. Import ioredis
2. Create a connection to localhost:6379
3. SET a key called "test" with value "hello"
4. GET the key and console.log it
5. Close the connection

### Hints
```javascript
const Redis = require('ioredis');
const redis = new Redis(); // connects to localhost:6379

// Your code here...
// Use: await redis.set(key, value)
// Use: await redis.get(key)
// Use: redis.quit() to close
```

### Acceptance Criteria
- [ ] Script runs without errors: `node 01-redis-basic.js`
- [ ] Output shows "hello"
- [ ] Script exits cleanly (doesn't hang)

### Test Command
```bash
node 01-redis-basic.js
```

---

## TICKET-007: Build a View Counter

**Type:** Code  
**Time:** 20 min  
**Depends on:** TICKET-006

### Task
Build a function that counts page views for different pages.

### What to Create
File: `02-view-counter.js`

### Requirements

1. Create function `recordView(pageId)` that:
   - Increments a counter in Redis
   - Returns the new view count

2. Create function `getViews(pageId)` that:
   - Returns current view count for a page
   - Returns 0 if page never viewed

3. Test it:
   - Record 3 views for "home"
   - Record 2 views for "about"
   - Print view counts for both

### Hints
- Key format: `views:home`, `views:about`
- Use `redis.incr(key)` to increment
- Use `redis.get(key)` to read

### Expected Output
```
Recorded view for home: 1
Recorded view for home: 2
Recorded view for home: 3
Recorded view for about: 1
Recorded view for about: 2
Views for home: 3
Views for about: 2
```

### Acceptance Criteria
- [ ] Both functions work correctly
- [ ] Output matches expected
- [ ] You wrote the code yourself (LLM can help, but you type it)

---

## TICKET-008: Add Expiring Keys

**Type:** Code  
**Time:** 15 min  
**Depends on:** TICKET-007

### Task
Create a session store where sessions expire after 30 seconds.

### What to Create
File: `03-session-store.js`

### Requirements

1. Create function `createSession(userId)` that:
   - Generates a random session ID (use `crypto.randomUUID()`)
   - Stores in Redis with 30 second expiry
   - Returns the session ID

2. Create function `getSession(sessionId)` that:
   - Returns userId if session exists
   - Returns null if expired or doesn't exist

3. Test it:
   - Create a session
   - Get it immediately (should work)
   - Wait 31 seconds
   - Get it again (should be null)

### Hints
- Use `redis.set(key, value, 'EX', 30)` for 30 second expiry
- Session key format: `session:{sessionId}`

### Acceptance Criteria
- [ ] Session works immediately after creation
- [ ] Session returns null after 30 seconds
- [ ] You understand how EX (expiry) works

---

# 🎫 SPRINT 3: Your First Rate Limiter (Day 3)

---

## TICKET-009: Simple Rate Limiter (Fixed Window)

**Type:** Code  
**Time:** 30 min  
**Depends on:** TICKET-008

### Task
Build a rate limiter that allows max 5 requests per minute per user.

### What to Create
File: `04-rate-limiter-simple.js`

### Requirements

1. Create function `checkRateLimit(userId)` that:
   - Tracks request count per user
   - Allows max 5 requests per 60 seconds
   - Returns `{ allowed: true, remaining: X }` if under limit
   - Returns `{ allowed: false, retryAfter: X }` if over limit

2. Test it:
   - Make 7 requests in a loop
   - First 5 should be allowed
   - Last 2 should be blocked

### Algorithm (Fixed Window)
```
key = "ratelimit:{userId}"
count = INCR key
if count == 1:
    EXPIRE key 60  # First request, set 60 second window
if count <= 5:
    return allowed
else:
    return blocked
```

### Expected Output
```
Request 1: ✅ allowed (4 remaining)
Request 2: ✅ allowed (3 remaining)
Request 3: ✅ allowed (2 remaining)
Request 4: ✅ allowed (1 remaining)
Request 5: ✅ allowed (0 remaining)
Request 6: ❌ blocked (retry after 58s)
Request 7: ❌ blocked (retry after 58s)
```

### Acceptance Criteria
- [ ] First 5 requests allowed
- [ ] Requests 6+ blocked
- [ ] Shows correct "remaining" count
- [ ] Shows retry time when blocked
- [ ] You can explain the algorithm

---

## TICKET-010: Test Rate Limiter with HTTP Server

**Type:** Code  
**Time:** 30 min  
**Depends on:** TICKET-009

### Task
Create an Express server that uses your rate limiter.

### What to Create
File: `05-server-with-ratelimit.js`

### Setup
```bash
npm install express
```

### Requirements

1. Create Express server on port 3000
2. Apply rate limiter to all requests
3. Use client IP as the user identifier
4. Add rate limit headers to response:
   - `X-RateLimit-Limit: 5`
   - `X-RateLimit-Remaining: X`
   - `X-RateLimit-Reset: X` (seconds until reset)
5. Return 429 status when rate limited

### Test Commands
```bash
# Start server
node 05-server-with-ratelimit.js

# In another terminal, make requests:
curl -i http://localhost:3000
curl -i http://localhost:3000
curl -i http://localhost:3000
curl -i http://localhost:3000
curl -i http://localhost:3000
curl -i http://localhost:3000  # Should get 429
```

### Expected Response (when allowed)
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 60

{"message":"Hello! Request allowed."}
```

### Expected Response (when blocked)
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
Retry-After: 45

{"error":"Too many requests","retryAfter":45}
```

### Acceptance Criteria
- [ ] Server starts on port 3000
- [ ] Headers show rate limit info
- [ ] 6th request returns 429
- [ ] Retry-After header is set
- [ ] You tested with curl yourself

---

# 🎫 SPRINT 4: Add PostgreSQL (Day 4-5)

---

## TICKET-011: Add PostgreSQL to Docker

**Type:** Infrastructure  
**Time:** 10 min  
**Depends on:** TICKET-010

### Task
Add PostgreSQL to your docker-compose file.

### Update File
`docker-compose.yml`

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: rateguard
      POSTGRES_PASSWORD: rateguard
      POSTGRES_DB: rateguard
```

### Commands
```bash
docker-compose down
docker-compose up -d
docker-compose ps
```

### Acceptance Criteria
- [ ] Both redis and postgres show as "running"
- [ ] No errors in `docker-compose logs postgres`

### How to Verify
```bash
docker exec -it rateguard-learn-postgres-1 psql -U rateguard -c "SELECT 1"
```
Should show a table with "1".

---

## TICKET-012: Setup Prisma

**Type:** Setup  
**Time:** 15 min  
**Depends on:** TICKET-011

### Task
Install and configure Prisma for PostgreSQL.

### Commands
```bash
npm install prisma @prisma/client
npx prisma init
```

### Update File
`prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = "postgresql://rateguard:rateguard@localhost:5432/rateguard"
}
```

### Acceptance Criteria
- [ ] `prisma` folder exists
- [ ] `schema.prisma` has correct database URL
- [ ] No errors when running `npx prisma db push`

---

## TICKET-013: Create API Keys Table

**Type:** Code  
**Time:** 20 min  
**Depends on:** TICKET-012

### Task
Create a database schema for API keys.

### Update File
`prisma/schema.prisma` - Add this model:

```prisma
model ApiKey {
  id        String   @id @default(uuid())
  name      String
  key       String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  lastUsedAt DateTime?
}
```

### Commands
```bash
npx prisma db push
npx prisma generate
```

### Acceptance Criteria
- [ ] No errors from prisma db push
- [ ] You can see the table in database:
  ```bash
  docker exec -it rateguard-learn-postgres-1 psql -U rateguard -c "\dt"
  ```

---

## TICKET-014: API Key CRUD Operations

**Type:** Code  
**Time:** 30 min  
**Depends on:** TICKET-013

### What to Create
File: `06-api-keys.js`

### Requirements

1. Create function `createApiKey(name)`:
   - Generate random key: `rg_` + 32 random chars
   - Save to database
   - Return the key (only shown once!)

2. Create function `validateApiKey(key)`:
   - Find key in database
   - Return apiKey object if valid and active
   - Return null if invalid or inactive

3. Create function `listApiKeys()`:
   - Return all API keys (but mask the actual key!)
   - Show: id, name, isActive, createdAt

4. Create function `revokeApiKey(id)`:
   - Set isActive to false
   - Return updated key

### Hints
```javascript
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function generateKey() {
  return 'rg_' + crypto.randomBytes(16).toString('hex');
}
```

### Test Script (add at bottom)
```javascript
async function test() {
  // Create a key
  const key = await createApiKey('Production');
  console.log('Created key:', key);

  // Validate it
  const valid = await validateApiKey(key.key);
  console.log('Valid?', valid ? 'Yes' : 'No');

  // List all
  const all = await listApiKeys();
  console.log('All keys:', all);

  // Revoke it
  await revokeApiKey(key.id);
  
  // Validate again
  const stillValid = await validateApiKey(key.key);
  console.log('Still valid after revoke?', stillValid ? 'Yes' : 'No');
}

test();
```

### Acceptance Criteria
- [ ] Can create API key
- [ ] Key is validated correctly
- [ ] List shows keys (without full key value)
- [ ] Revoked key fails validation

---

## TICKET-015: Protected API with Key Authentication

**Type:** Code  
**Time:** 30 min  
**Depends on:** TICKET-014

### Task
Create an API where routes require a valid API key.

### What to Create
File: `07-protected-api.js`

### Requirements

1. Express server on port 3000
2. Middleware that checks `X-API-Key` header
3. If no key or invalid key → 401 Unauthorized
4. If valid key → allow request + update lastUsedAt
5. Apply rate limiting per API key (not per IP)

### Routes
- `GET /` - Public, no auth needed
- `GET /api/data` - Protected, needs valid API key
- `POST /api/keys` - Create new API key (protected with master key)

### Test Commands
```bash
# No key - should fail
curl http://localhost:3000/api/data

# Invalid key - should fail
curl -H "X-API-Key: wrong" http://localhost:3000/api/data

# Create a key first, then use it
# (You'll need to create key manually first via script)
curl -H "X-API-Key: rg_xxxxx" http://localhost:3000/api/data
```

### Acceptance Criteria
- [ ] Public route works without key
- [ ] Protected routes return 401 without valid key
- [ ] Protected routes work with valid key
- [ ] Rate limit is per API key, not per IP
- [ ] lastUsedAt updates on each request

---

# 🎫 SPRINT 5: Build the Dashboard (Day 6-7)

---

## TICKET-016: Create Next.js App

**Type:** Setup  
**Time:** 10 min  
**Depends on:** TICKET-015

### Task
Create a Next.js frontend for the dashboard.

### Commands
```bash
npx create-next-app@latest dashboard --typescript --tailwind --app
cd dashboard
npm install
```

### Acceptance Criteria
- [ ] `npm run dev` starts on localhost:3000
- [ ] You see the Next.js welcome page

---

## TICKET-017: Dashboard Layout

**Type:** Code  
**Time:** 45 min  
**Depends on:** TICKET-016

### Task
Create the main dashboard layout with sidebar.

### What to Create
1. `app/layout.tsx` - Root layout
2. `app/dashboard/layout.tsx` - Dashboard layout with sidebar
3. `components/Sidebar.tsx` - Navigation sidebar

### Requirements
- Dark theme (bg-gray-900)
- Sidebar with navigation links:
  - Overview
  - API Keys
  - Rate Limits (placeholder)
  - Settings (placeholder)
- Main content area

### Acceptance Criteria
- [ ] Sidebar shows on left
- [ ] Navigation links work
- [ ] Dark theme applied
- [ ] Responsive (sidebar collapses on mobile - optional)

---

## TICKET-018: API Keys List Page

**Type:** Code  
**Time:** 45 min  
**Depends on:** TICKET-017

### Task
Create a page that lists all API keys.

### What to Create
1. `app/dashboard/keys/page.tsx` - Keys list page
2. `app/api/keys/route.ts` - API route to fetch keys

### Requirements
- Table showing: Name, Key (masked), Status, Created, Last Used
- "Create Key" button (just UI for now)
- Status badge: green for active, gray for revoked

### API Response Format
```json
{
  "keys": [
    {
      "id": "xxx",
      "name": "Production",
      "keyPrefix": "rg_8f7d...",
      "isActive": true,
      "createdAt": "2024-01-15",
      "lastUsedAt": "2024-01-15"
    }
  ]
}
```

### Acceptance Criteria
- [ ] Keys load from API
- [ ] Table displays correctly
- [ ] Key is masked (only show first 8 chars)
- [ ] Status badge colors correct

---

## TICKET-019: Create API Key Modal

**Type:** Code  
**Time:** 45 min  
**Depends on:** TICKET-018

### Task
Add ability to create new API keys.

### What to Create
1. `components/CreateKeyModal.tsx` - Modal dialog
2. `app/api/keys/route.ts` - Add POST handler

### Requirements
- Modal opens when "Create Key" clicked
- Form with "Key Name" input
- On submit: Create key, show it ONCE
- Warning: "Copy this key now, it won't be shown again"
- Copy button that copies to clipboard
- After closing, key list refreshes

### Acceptance Criteria
- [ ] Modal opens/closes
- [ ] Key is created in database
- [ ] Full key shown only once
- [ ] Copy button works
- [ ] List updates after creation

---

## TICKET-020: Delete/Revoke API Key

**Type:** Code  
**Time:** 30 min  
**Depends on:** TICKET-019

### Task
Add ability to revoke API keys.

### Requirements
- Each key row has a "Revoke" button
- Confirmation dialog before revoking
- On revoke: Mark as inactive (don't delete)
- Row updates to show "Revoked" status

### Acceptance Criteria
- [ ] Revoke button appears on each row
- [ ] Confirmation prevents accidental revoke
- [ ] Key status updates in UI
- [ ] Revoked keys show gray badge

---

# 🎫 SPRINT 6: Analytics (Day 8-9)

---

## TICKET-021: Log Requests to Database

**Type:** Code  
**Time:** 30 min  
**Depends on:** TICKET-020

### Task
Create a table to log all API requests.

### Update Prisma Schema
```prisma
model RequestLog {
  id          String   @id @default(uuid())
  apiKeyId    String
  apiKey      ApiKey   @relation(fields: [apiKeyId], references: [id])
  endpoint    String
  method      String
  statusCode  Int
  latencyMs   Int
  createdAt   DateTime @default(now())
}
```

### Update API Server
- After each request, log to database
- Include: apiKeyId, endpoint, method, status, latency

### Acceptance Criteria
- [ ] Schema updated and migrated
- [ ] Each API request creates a log entry
- [ ] Can query logs in database

---

## TICKET-022: Analytics API

**Type:** Code  
**Time:** 30 min  
**Depends on:** TICKET-021

### Task
Create API endpoints for analytics data.

### What to Create
`app/api/analytics/route.ts`

### Endpoints
- `GET /api/analytics/summary` - Total requests, errors, avg latency
- `GET /api/analytics/requests?hours=24` - Request count over time

### Response Format
```json
{
  "summary": {
    "totalRequests": 1234,
    "errorRate": 2.5,
    "avgLatencyMs": 145
  },
  "timeSeries": [
    { "hour": "2024-01-15T10:00:00", "requests": 45, "errors": 1 },
    { "hour": "2024-01-15T11:00:00", "requests": 62, "errors": 0 }
  ]
}
```

### Acceptance Criteria
- [ ] Summary endpoint works
- [ ] Time series endpoint works
- [ ] Data is accurate

---

## TICKET-023: Dashboard Overview Page

**Type:** Code  
**Time:** 60 min  
**Depends on:** TICKET-022

### Task
Create the main dashboard with stats and charts.

### What to Create
`app/dashboard/page.tsx`

### Requirements
1. Stats cards: Total Requests, Error Rate, Avg Latency
2. Line chart: Requests over last 24 hours
3. Auto-refresh every 30 seconds

### Libraries to Install
```bash
npm install recharts
```

### Acceptance Criteria
- [ ] Stats cards show real data
- [ ] Chart displays correctly
- [ ] Data refreshes automatically

---

# 🎫 SPRINT 7: Polish & Deploy (Day 10)

---

## TICKET-024: Error Handling

**Type:** Code  
**Time:** 30 min  
**Depends on:** TICKET-023

### Task
Add proper error handling throughout the app.

### Requirements
- API returns proper error responses
- Frontend shows error messages
- Loading states while fetching
- Empty states when no data

### Acceptance Criteria
- [ ] No unhandled errors in console
- [ ] User sees friendly error messages
- [ ] Loading spinners appear during fetch

---

## TICKET-025: Environment Variables

**Type:** Code  
**Time:** 20 min  
**Depends on:** TICKET-024

### Task
Move all secrets to environment variables.

### Create Files
- `.env.example` (template)
- `.env` (actual values, gitignored)

### Variables Needed
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

### Acceptance Criteria
- [ ] No hardcoded secrets in code
- [ ] App works with .env file
- [ ] .env is in .gitignore

---

## TICKET-026: README Documentation

**Type:** Documentation  
**Time:** 30 min  
**Depends on:** TICKET-025

### Task
Write clear documentation for running the project.

### README Sections
1. Project Overview
2. Prerequisites (Docker, Node.js)
3. Quick Start
4. Environment Variables
5. API Documentation
6. Architecture Overview

### Acceptance Criteria
- [ ] Someone else could run your project following the README
- [ ] All commands are documented
- [ ] Screenshots of the dashboard

---

# ✅ Definition of Done

After completing all tickets, you will have:

1. ✅ Redis running in Docker
2. ✅ PostgreSQL running in Docker
3. ✅ Rate limiter using Redis
4. ✅ API key authentication
5. ✅ Request logging to PostgreSQL
6. ✅ Next.js dashboard
7. ✅ API keys management UI
8. ✅ Analytics with charts
9. ✅ Clean code with proper error handling
10. ✅ Documentation

---

# How to Use This Ticket Board

## For Each Ticket:

### 1. Read it completely first

### 2. Try to build it yourself
Give yourself 15-20 minutes of struggling. This is where learning happens.

### 3. When stuck, ask LLM:
```
I'm working on TICKET-009: Simple Rate Limiter.

I need to build a function that allows max 5 requests 
per 60 seconds per user using Redis.

Here's what I have so far:
[paste your code]

I'm stuck on: [describe the problem]
```

### 4. Debug the response
Don't just copy-paste. Read the code, understand it, type it yourself.

### 5. Verify acceptance criteria
Check every box before moving on.

### 6. Commit your work
```bash
git add .
git commit -m "Complete TICKET-009: Simple Rate Limiter"
```

---

# Estimated Timeline

| Sprint | Tickets | Days |
|--------|---------|------|
| 1: Setup | 001-004 | Day 1 |
| 2: Redis | 005-008 | Day 2 |
| 3: Rate Limiter | 009-010 | Day 3 |
| 4: PostgreSQL | 011-015 | Day 4-5 |
| 5: Dashboard | 016-020 | Day 6-7 |
| 6: Analytics | 021-023 | Day 8-9 |
| 7: Polish | 024-026 | Day 10 |

**Total: 26 tickets over 10 days**

---

# Start Now

Your first ticket: **TICKET-001: Install Docker Desktop**

Go do it. Come back when it's done.
