# Learning Roadmap: From MERN to Backend Infrastructure

## Your Starting Point

You know:
- ✅ JavaScript/Node.js
- ✅ React + Next.js
- ✅ Express.js
- ✅ MongoDB
- ✅ REST APIs

You need to learn:
- ❓ Docker (running services)
- ❓ Redis (fast data store)
- ❓ PostgreSQL (SQL database)
- ❓ Fastify (faster Express)
- ❓ Lua (only for Redis scripts)
- ❓ ClickHouse (analytics database)
- ❓ Kafka (message queue)

---

## The Good News

| New Thing | How Hard | Why |
|-----------|----------|-----|
| Docker | Easy | Just commands to memorize |
| Redis | Easy | Like a JavaScript object, but shared |
| PostgreSQL | Medium | SQL instead of MongoDB queries |
| Fastify | Very Easy | Almost identical to Express |
| Lua | Easy | Only ~20 lines needed, similar to JS |
| ClickHouse | Skip for now | Use PostgreSQL instead |
| Kafka | Skip for now | Not needed for MVP |

---

## Simplified Tech Stack (What You'll Actually Use)

### Original (Complex):
```
Next.js → Fastify → Redis + PostgreSQL + ClickHouse + Kafka
```

### Simplified (Start Here):
```
Next.js → Express → Redis + PostgreSQL
```

You already know Next.js and Express. So you only need to learn:
1. **Docker** - To run Redis and PostgreSQL
2. **Redis** - For rate limiting
3. **PostgreSQL** - For storing data (instead of MongoDB)

That's it. Just 3 things.

---

# WEEK 1: Docker (Days 1-2)

## What is Docker?

Think of it like this:

**Without Docker:**
- "Install MongoDB on your laptop"
- "Install Redis on your laptop"
- "Install PostgreSQL on your laptop"
- Different versions, conflicts, "works on my machine" problems

**With Docker:**
- "Run this ONE command and everything works"
- Same setup everywhere
- Delete and recreate anytime

## Docker is just 5 commands

```bash
# 1. Start services (like npm start)
docker-compose up -d

# 2. Stop services (like Ctrl+C)
docker-compose down

# 3. See what's running
docker-compose ps

# 4. See logs
docker-compose logs redis

# 5. Run command inside container
docker exec -it container-name command
```

That's literally all you need to know.

## Day 1 Exercise: Run Redis with Docker

### Step 1: Install Docker Desktop
- Go to: https://www.docker.com/products/docker-desktop
- Download for your OS
- Install and start it

### Step 2: Create a file called `docker-compose.yml`

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

This says: "Download Redis and run it on port 6379"

### Step 3: Run it

```bash
docker-compose up -d
```

### Step 4: Test it

```bash
docker exec -it $(docker ps -qf "name=redis") redis-cli ping
```

Should print: `PONG`

🎉 **You just ran Redis! You didn't install anything on your laptop.**

### Step 5: Play with Redis CLI

```bash
# Enter Redis CLI
docker exec -it $(docker ps -qf "name=redis") redis-cli

# Now you're inside Redis, try these:
SET name "Usama"
GET name
SET counter 0
INCR counter
INCR counter
GET counter
DEL name
GET name
exit
```

---

# WEEK 1: Redis (Days 3-5)

## What is Redis?

**MongoDB:** Store complex documents on disk, query later
**Redis:** Store simple values in memory, access instantly

Think of Redis as a **global JavaScript object** that:
- Lives outside your app
- Multiple servers can access
- Super fast (1ms vs 50ms for MongoDB)
- Data can expire automatically

## Redis Data Types (Compare to JavaScript)

| Redis | JavaScript | Example |
|-------|------------|---------|
| String | `let x = "hello"` | `SET x "hello"` |
| Number | `let x = 42` | `SET x 42` then `INCR x` |
| Hash | `let x = {a: 1, b: 2}` | `HSET x a 1 b 2` |
| List | `let x = [1, 2, 3]` | `LPUSH x 1 2 3` |
| Set | `let x = new Set([1,2,3])` | `SADD x 1 2 3` |

## Day 3 Exercise: Redis from Node.js

### Step 1: Create a new folder

```bash
mkdir learn-redis
cd learn-redis
npm init -y
npm install ioredis
```

### Step 2: Create `basic.js`

```javascript
const Redis = require('ioredis');
const redis = new Redis(); // Connects to localhost:6379

async function main() {
  // STRING - like a variable
  await redis.set('username', 'usama');
  const username = await redis.get('username');
  console.log('Username:', username);

  // NUMBER - with increment
  await redis.set('visitors', 0);
  await redis.incr('visitors');
  await redis.incr('visitors');
  await redis.incr('visitors');
  const visitors = await redis.get('visitors');
  console.log('Visitors:', visitors);

  // HASH - like an object
  await redis.hset('user:1', {
    name: 'Usama',
    email: 'usama@example.com',
    age: 25
  });
  const user = await redis.hgetall('user:1');
  console.log('User:', user);

  // EXPIRY - data that disappears
  await redis.set('session', 'abc123', 'EX', 10); // Expires in 10 seconds
  console.log('Session now:', await redis.get('session'));
  
  console.log('Waiting 11 seconds...');
  await new Promise(r => setTimeout(r, 11000));
  
  console.log('Session after 11s:', await redis.get('session')); // null!

  redis.quit();
}

main();
```

### Step 3: Run it

```bash
node basic.js
```

🎉 **You just used Redis from Node.js!**

## Day 4 Exercise: Build a View Counter

Real use case: Count page views (like YouTube views)

### Create `view-counter.js`

```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function recordView(videoId) {
  // Increment view count
  const views = await redis.incr(`views:${videoId}`);
  return views;
}

async function getViews(videoId) {
  const views = await redis.get(`views:${videoId}`);
  return parseInt(views) || 0;
}

async function getTopVideos() {
  // Get all keys starting with "views:"
  const keys = await redis.keys('views:*');
  
  const results = [];
  for (const key of keys) {
    const videoId = key.replace('views:', '');
    const views = await redis.get(key);
    results.push({ videoId, views: parseInt(views) });
  }
  
  // Sort by views descending
  return results.sort((a, b) => b.views - a.views);
}

// Test it
async function main() {
  // Simulate views
  console.log('Recording views...\n');
  
  await recordView('video-1');
  await recordView('video-1');
  await recordView('video-1');
  await recordView('video-2');
  await recordView('video-2');
  await recordView('video-3');

  // Check individual video
  console.log('Video 1 views:', await getViews('video-1'));
  console.log('Video 2 views:', await getViews('video-2'));
  console.log('Video 3 views:', await getViews('video-3'));

  // Get leaderboard
  console.log('\nTop Videos:');
  const top = await getTopVideos();
  top.forEach((v, i) => {
    console.log(`${i + 1}. ${v.videoId}: ${v.views} views`);
  });

  redis.quit();
}

main();
```

🎉 **You just built something real with Redis!**

## Day 5 Exercise: Simple Rate Limiter

This is the CORE of RateGuard. Let's build it simple first.

### Create `rate-limiter.js`

```javascript
const Redis = require('ioredis');
const redis = new Redis();

/**
 * Simple Rate Limiter
 * 
 * Rule: Max 5 requests per 60 seconds per user
 */
async function isAllowed(userId) {
  const key = `ratelimit:${userId}`;
  const limit = 5;
  const windowSeconds = 60;

  // Get current count
  const current = await redis.get(key);
  
  if (current === null) {
    // First request - start counting
    await redis.set(key, 1, 'EX', windowSeconds);
    return { allowed: true, remaining: limit - 1 };
  }
  
  const count = parseInt(current);
  
  if (count < limit) {
    // Under limit - increment
    await redis.incr(key);
    return { allowed: true, remaining: limit - count - 1 };
  }
  
  // Over limit - blocked
  const ttl = await redis.ttl(key);
  return { allowed: false, remaining: 0, retryAfter: ttl };
}

// Test it
async function main() {
  const userId = 'user-123';

  console.log('Making 7 requests:\n');

  for (let i = 1; i <= 7; i++) {
    const result = await isAllowed(userId);
    
    if (result.allowed) {
      console.log(`Request ${i}: ✅ ALLOWED (${result.remaining} remaining)`);
    } else {
      console.log(`Request ${i}: ❌ BLOCKED (retry after ${result.retryAfter}s)`);
    }
  }

  redis.quit();
}

main();
```

### Run it

```bash
node rate-limiter.js
```

Expected output:
```
Making 7 requests:

Request 1: ✅ ALLOWED (4 remaining)
Request 2: ✅ ALLOWED (3 remaining)
Request 3: ✅ ALLOWED (2 remaining)
Request 4: ✅ ALLOWED (1 remaining)
Request 5: ✅ ALLOWED (0 remaining)
Request 6: ❌ BLOCKED (retry after 59s)
Request 7: ❌ BLOCKED (retry after 59s)
```

🎉 **You just built a rate limiter! This is the core of RateGuard!**

---

# WEEK 2: PostgreSQL (Days 6-8)

## What is PostgreSQL?

**MongoDB:** Documents, flexible schema, NoSQL
**PostgreSQL:** Tables, strict schema, SQL

You'll like PostgreSQL because:
- Industry standard (more jobs)
- Relations between tables (like MongoDB refs but better)
- Powerful queries

## MongoDB vs PostgreSQL Comparison

| MongoDB | PostgreSQL |
|---------|------------|
| `db.users.find({name: "Usama"})` | `SELECT * FROM users WHERE name = 'Usama'` |
| `db.users.insertOne({name: "Usama"})` | `INSERT INTO users (name) VALUES ('Usama')` |
| `db.users.updateOne({_id: id}, {$set: {age: 25}})` | `UPDATE users SET age = 25 WHERE id = 1` |
| `db.users.deleteOne({_id: id})` | `DELETE FROM users WHERE id = 1` |
| Collections | Tables |
| Documents | Rows |
| Fields | Columns |

## Day 6: Add PostgreSQL to Docker

Update your `docker-compose.yml`:

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
      POSTGRES_USER: usama
      POSTGRES_PASSWORD: password
      POSTGRES_DB: learning
```

Restart:
```bash
docker-compose down
docker-compose up -d
```

## Day 6: Play with PostgreSQL

```bash
# Enter PostgreSQL CLI
docker exec -it $(docker ps -qf "name=postgres") psql -U usama -d learning

# Now you're inside PostgreSQL, try these:

-- Create a table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert data
INSERT INTO users (name, email) VALUES ('Usama', 'usama@example.com');
INSERT INTO users (name, email) VALUES ('Ahmed', 'ahmed@example.com');

-- Query data
SELECT * FROM users;
SELECT name, email FROM users WHERE name = 'Usama';

-- Update data
UPDATE users SET name = 'Usama Khan' WHERE id = 1;

-- Delete data
DELETE FROM users WHERE id = 2;

-- Exit
\q
```

## Day 7: PostgreSQL from Node.js with Prisma

Prisma makes PostgreSQL feel like MongoDB. You'll love it.

```bash
mkdir learn-postgres
cd learn-postgres
npm init -y
npm install prisma @prisma/client
npx prisma init
```

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://usama:password@localhost:5432/learning"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
```

Push to database:
```bash
npx prisma db push
```

Create `index.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create user (like MongoDB insertOne)
  const user = await prisma.user.create({
    data: {
      name: 'Usama',
      email: 'usama@example.com',
    },
  });
  console.log('Created user:', user);

  // Create post with relation
  const post = await prisma.post.create({
    data: {
      title: 'My First Post',
      content: 'Hello World!',
      authorId: user.id,
    },
  });
  console.log('Created post:', post);

  // Find all users (like MongoDB find)
  const users = await prisma.user.findMany({
    include: { posts: true }, // Include related posts
  });
  console.log('All users with posts:', JSON.stringify(users, null, 2));

  // Update user (like MongoDB updateOne)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: 'Usama Khan' },
  });
  console.log('Updated user:', updated);

  // Delete (like MongoDB deleteOne)
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleaned up!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
node index.js
```

🎉 **Prisma makes PostgreSQL feel almost like MongoDB!**

---

# WEEK 2: Fastify (Days 9-10)

## What is Fastify?

**Express:** `app.get('/', (req, res) => res.send('Hello'))`
**Fastify:** `app.get('/', (req, reply) => reply.send('Hello'))`

That's it. Almost the same. But Fastify is:
- 2-5x faster than Express
- Better TypeScript support
- Built-in validation
- Better plugin system

## Express vs Fastify Comparison

```javascript
// EXPRESS (what you know)
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello' });
});

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  res.json({ name, email });
});

app.listen(3000);
```

```javascript
// FASTIFY (almost identical)
const fastify = require('fastify')();

fastify.get('/', (req, reply) => {
  reply.send({ message: 'Hello' });
});

fastify.post('/users', (req, reply) => {
  const { name, email } = req.body;
  reply.send({ name, email });
});

fastify.listen({ port: 3000 });
```

## Day 9: Build an API with Fastify

```bash
mkdir learn-fastify
cd learn-fastify
npm init -y
npm install fastify
```

Create `server.js`:

```javascript
const fastify = require('fastify')({ logger: true });

// In-memory storage (replace with database later)
const users = [];

// GET all users
fastify.get('/users', async (req, reply) => {
  return users;
});

// GET one user
fastify.get('/users/:id', async (req, reply) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    reply.code(404);
    return { error: 'User not found' };
  }
  return user;
});

// POST create user
fastify.post('/users', async (req, reply) => {
  const { name, email } = req.body;
  const user = {
    id: users.length + 1,
    name,
    email,
    createdAt: new Date()
  };
  users.push(user);
  reply.code(201);
  return user;
});

// DELETE user
fastify.delete('/users/:id', async (req, reply) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) {
    reply.code(404);
    return { error: 'User not found' };
  }
  users.splice(index, 1);
  return { message: 'Deleted' };
});

// Start server
fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running on http://localhost:3000');
});
```

Test it:
```bash
# Start server
node server.js

# In another terminal:
# Create users
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Usama","email":"usama@test.com"}'

curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Ahmed","email":"ahmed@test.com"}'

# Get all users
curl http://localhost:3000/users

# Get one user
curl http://localhost:3000/users/1

# Delete user
curl -X DELETE http://localhost:3000/users/1
```

🎉 **If you know Express, you know Fastify!**

---

# WEEK 3: Put It All Together (Days 11-14)

Now combine everything into a simple rate-limited API.

## Day 11-12: Rate-Limited API

Create `api-with-ratelimit/`:

```bash
mkdir api-with-ratelimit
cd api-with-ratelimit
npm init -y
npm install fastify ioredis
```

Create `server.js`:

```javascript
const fastify = require('fastify')({ logger: true });
const Redis = require('ioredis');
const redis = new Redis();

// Rate limit middleware
async function rateLimit(req, reply) {
  const ip = req.ip;
  const key = `ratelimit:${ip}`;
  const limit = 10;
  const window = 60;

  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }

  const remaining = Math.max(0, limit - current);
  const ttl = await redis.ttl(key);

  reply.header('X-RateLimit-Limit', limit);
  reply.header('X-RateLimit-Remaining', remaining);
  reply.header('X-RateLimit-Reset', ttl);

  if (current > limit) {
    reply.code(429);
    throw new Error('Too many requests');
  }
}

// Apply rate limit to all routes
fastify.addHook('preHandler', rateLimit);

// Routes
fastify.get('/', async () => {
  return { message: 'Hello! You are within rate limit.' };
});

fastify.get('/api/data', async () => {
  return { 
    data: 'Some important data',
    timestamp: new Date()
  };
});

// Start
fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running on http://localhost:3000');
  console.log('Rate limit: 10 requests per 60 seconds');
});
```

Test it:
```bash
node server.js

# Make requests until you get rate limited
for i in {1..15}; do curl -s http://localhost:3000 | head -1; done
```

🎉 **You built a rate-limited API!**

---

# Summary: What You Learned

| Week | Topic | What You Built |
|------|-------|----------------|
| 1 | Docker | Running Redis & PostgreSQL |
| 1 | Redis | View counter, Rate limiter |
| 2 | PostgreSQL | User/Post CRUD with Prisma |
| 2 | Fastify | REST API (same as Express) |
| 3 | Combined | Rate-limited API |

---

# What About Lua, ClickHouse, Kafka?

## Lua
- Only needed for advanced Redis scripts
- Skip for now, use simple Redis commands
- Learn later when you need atomic operations

## ClickHouse
- For analytics with billions of rows
- Skip for now, use PostgreSQL
- Learn later when PostgreSQL is too slow

## Kafka
- For processing millions of events
- Skip for now, just log to PostgreSQL
- Learn later when you need event streaming

---

# Your New Simplified RateGuard Stack

Instead of:
```
Next.js + Fastify + Redis + PostgreSQL + ClickHouse + Kafka + Lua
```

Start with:
```
Next.js + Express + Redis + PostgreSQL
```

You know Next.js and Express already. Now you know Redis and PostgreSQL too.

**That's enough to build RateGuard MVP!**

---

# Next Steps After This Roadmap

1. ✅ Complete Week 1-3 exercises
2. Build RateGuard MVP with simplified stack
3. Learn Fastify (20 min, it's just faster Express)
4. Learn Lua for Redis (when you need atomic operations)
5. Learn ClickHouse (when PostgreSQL gets slow)
6. Learn Kafka (when you need event streaming)

---

# Remember

You don't need to know everything to start.

| Myth | Reality |
|------|---------|
| "I need to know all tools" | Start with what you know + 1 new thing |
| "I need the perfect stack" | Start simple, improve later |
| "I need to understand everything" | Build first, understand while building |

The best way to learn Redis is to USE Redis.
The best way to learn PostgreSQL is to USE PostgreSQL.

Not by reading 9,000 lines of docs.

**Go build something.**
