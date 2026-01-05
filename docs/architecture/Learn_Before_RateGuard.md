# STOP. Learn This First.

## Forget RateGuard.

You're overwhelmed because you're trying to:
- Learn 5 new technologies
- Build a complex project
- Understand advanced patterns

ALL AT THE SAME TIME.

That's impossible. Let's fix this.

---

## Your REAL Problem

You know: JavaScript, Node.js, Express, MongoDB, React, Next.js

You're trying to learn: Docker, Redis, PostgreSQL, Fastify, Lua, Rate Limiting, Kafka, ClickHouse

**That's 8 new things.** No wonder you're confused.

---

## The Fix: Learn ONE Thing Per Day

Forget the big project. Just learn tools with TINY examples.

---

# DAY 1: Docker (Just Run Stuff)

## What is Docker?

Docker = "Run any software without installing it"

Instead of:
- Download PostgreSQL installer
- Configure it
- Fix errors
- Different version than tutorial

With Docker:
- Run ONE command
- It works
- Delete when done

## Step 1: Install Docker Desktop

Go here: https://www.docker.com/products/docker-desktop/

Download. Install. Open it. Wait for it to start.

## Step 2: Your First Container

Open terminal (Command Prompt / Terminal / PowerShell):

```bash
docker run hello-world
```

You should see:
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

🎉 **You just ran your first container!**

## Step 3: Run Redis (No Install!)

```bash
docker run -d -p 6379:6379 --name my-redis redis:alpine
```

What this means:
- `docker run` = start a container
- `-d` = run in background
- `-p 6379:6379` = make port 6379 accessible
- `--name my-redis` = call it "my-redis"
- `redis:alpine` = use Redis image

## Step 4: Check It's Running

```bash
docker ps
```

You should see `my-redis` in the list.

## Step 5: Connect to Redis

```bash
docker exec -it my-redis redis-cli
```

Now you're INSIDE Redis! Try:

```
PING
```

It says `PONG`. 

```
SET name "Usama"
GET name
quit
```

🎉 **You're using Redis!**

## Step 6: Stop and Remove

```bash
docker stop my-redis
docker rm my-redis
```

## Day 1 Summary

You learned:
- `docker run` = start something
- `docker ps` = see what's running
- `docker exec -it` = go inside
- `docker stop` / `docker rm` = cleanup

**That's all the Docker you need for now.**

---

# DAY 2: Redis (Fast Storage)

## What is Redis?

Redis = Super fast storage that lives in memory

Think of it like:
```javascript
// JavaScript object (dies when app restarts)
const data = { name: "Usama" };

// Redis (lives forever, shared between apps)
await redis.set("name", "Usama");
```

## Step 1: Start Redis

```bash
docker run -d -p 6379:6379 --name my-redis redis:alpine
```

## Step 2: Create a Folder

```bash
mkdir learn-redis
cd learn-redis
npm init -y
npm install ioredis
```

## Step 3: Create `app.js`

```javascript
const Redis = require('ioredis');
const redis = new Redis(); // connects to localhost:6379

async function main() {
  // SET and GET (like variables)
  await redis.set('name', 'Usama');
  const name = await redis.get('name');
  console.log('Name:', name);

  // Increment (atomic counter)
  await redis.set('views', 0);
  await redis.incr('views');
  await redis.incr('views');
  await redis.incr('views');
  const views = await redis.get('views');
  console.log('Views:', views);

  // Expire (data that disappears)
  await redis.set('token', 'abc123', 'EX', 5); // expires in 5 seconds
  console.log('Token now:', await redis.get('token'));
  
  console.log('Waiting 6 seconds...');
  await new Promise(r => setTimeout(r, 6000));
  
  console.log('Token after 6s:', await redis.get('token')); // null!

  redis.quit();
}

main();
```

## Step 4: Run It

```bash
node app.js
```

Expected output:
```
Name: Usama
Views: 3
Token now: abc123
Waiting 6 seconds...
Token after 6s: null
```

🎉 **You understand Redis basics!**

## Day 2 Summary

Redis commands:
- `SET key value` = store
- `GET key` = retrieve
- `INCR key` = add 1 (atomic!)
- `SET key value EX 5` = expires in 5 seconds

---

# DAY 3: Build a Simple Rate Limiter

## What is Rate Limiting?

"Only allow 5 requests per minute"

If someone makes 10 requests:
- First 5: ✅ Allowed
- Next 5: ❌ Blocked

## Step 1: Keep Redis Running

```bash
docker ps  # check if my-redis is running
# if not:
docker start my-redis
```

## Step 2: Create `rate-limiter.js`

```javascript
const Redis = require('ioredis');
const redis = new Redis();

// Simple rate limiter: 5 requests per 60 seconds
async function isAllowed(userId) {
  const key = `limit:${userId}`;
  const limit = 5;
  const window = 60; // seconds

  // Increment counter
  const count = await redis.incr(key);

  // Set expiry on first request
  if (count === 1) {
    await redis.expire(key, window);
  }

  // Check if over limit
  if (count <= limit) {
    return { allowed: true, remaining: limit - count };
  } else {
    const ttl = await redis.ttl(key);
    return { allowed: false, remaining: 0, retryAfter: ttl };
  }
}

// Test it
async function test() {
  console.log('Making 7 requests:\n');

  for (let i = 1; i <= 7; i++) {
    const result = await isAllowed('user123');
    
    if (result.allowed) {
      console.log(`Request ${i}: ✅ ALLOWED (${result.remaining} left)`);
    } else {
      console.log(`Request ${i}: ❌ BLOCKED (retry in ${result.retryAfter}s)`);
    }
  }

  redis.quit();
}

test();
```

## Step 3: Run It

```bash
node rate-limiter.js
```

Expected output:
```
Making 7 requests:

Request 1: ✅ ALLOWED (4 left)
Request 2: ✅ ALLOWED (3 left)
Request 3: ✅ ALLOWED (2 left)
Request 4: ✅ ALLOWED (1 left)
Request 5: ✅ ALLOWED (0 left)
Request 6: ❌ BLOCKED (retry in 59s)
Request 7: ❌ BLOCKED (retry in 59s)
```

🎉 **YOU JUST BUILT A RATE LIMITER!**

This is the CORE of RateGuard. 30 lines of code.

## Day 3 Summary

Rate limiting = Count requests, block if over limit.

That's it. The fancy algorithms (Token Bucket, etc.) are just variations of this.

---

# DAY 4: Add an Express Server

## Step 1: Create New Folder

```bash
mkdir rate-limit-server
cd rate-limit-server
npm init -y
npm install express ioredis
```

## Step 2: Create `server.js`

```javascript
const express = require('express');
const Redis = require('ioredis');

const app = express();
const redis = new Redis();

// Rate limit middleware
async function rateLimit(req, res, next) {
  const ip = req.ip;
  const key = `limit:${ip}`;
  const limit = 5;
  const window = 60;

  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, window);
  }

  // Add headers
  res.set('X-RateLimit-Limit', limit);
  res.set('X-RateLimit-Remaining', Math.max(0, limit - count));

  if (count > limit) {
    const ttl = await redis.ttl(key);
    res.set('Retry-After', ttl);
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: ttl 
    });
  }

  next();
}

// Apply to all routes
app.use(rateLimit);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello! You are within the rate limit.' });
});

app.get('/api/data', (req, res) => {
  res.json({ data: 'Some important data', timestamp: new Date() });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Rate limit: 5 requests per 60 seconds');
  console.log('\nTest with: curl http://localhost:3000');
});
```

## Step 3: Run It

```bash
node server.js
```

## Step 4: Test It

Open another terminal:

```bash
# Make 7 requests
curl http://localhost:3000
curl http://localhost:3000
curl http://localhost:3000
curl http://localhost:3000
curl http://localhost:3000
curl http://localhost:3000  # Should get 429
curl http://localhost:3000  # Should get 429
```

Or if you're on Windows without curl:
- Open browser
- Go to http://localhost:3000
- Refresh 6 times quickly
- You'll see the error!

🎉 **You built a rate-limited API!**

---

# DAY 5: PostgreSQL Basics

## What is PostgreSQL?

PostgreSQL = Database with tables (like MongoDB but structured)

| MongoDB | PostgreSQL |
|---------|------------|
| Collections | Tables |
| Documents | Rows |
| Flexible schema | Fixed schema |
| `db.users.find()` | `SELECT * FROM users` |

## Step 1: Run PostgreSQL

```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  --name my-postgres \
  postgres:alpine
```

## Step 2: Connect to It

```bash
docker exec -it my-postgres psql -U admin -d myapp
```

Now you're in PostgreSQL! Try:

```sql
-- Create a table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE
);

-- Insert data
INSERT INTO users (name, email) VALUES ('Usama', 'usama@test.com');
INSERT INTO users (name, email) VALUES ('Ahmed', 'ahmed@test.com');

-- Query data
SELECT * FROM users;

-- Exit
\q
```

## Step 3: Use Prisma (Easy Mode!)

```bash
mkdir learn-prisma
cd learn-prisma
npm init -y
npm install prisma @prisma/client
npx prisma init
```

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://admin:secret@localhost:5432/myapp"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}
```

Push to database:
```bash
npx prisma db push
```

Create `app.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create
  const user = await prisma.user.create({
    data: { name: 'Usama', email: 'usama@example.com' }
  });
  console.log('Created:', user);

  // Read all
  const users = await prisma.user.findMany();
  console.log('All users:', users);

  // Cleanup
  await prisma.user.deleteMany();
}

main().finally(() => prisma.$disconnect());
```

Run:
```bash
node app.js
```

🎉 **You're using PostgreSQL!**

Prisma feels just like Mongoose, right?

---

# WHAT YOU'VE LEARNED

After 5 days:

| Day | What You Learned | Lines of Code |
|-----|------------------|---------------|
| 1 | Docker basics | 0 (just commands) |
| 2 | Redis basics | ~25 |
| 3 | Rate limiting | ~35 |
| 4 | Express + rate limit | ~50 |
| 5 | PostgreSQL + Prisma | ~30 |

**Total: ~140 lines of code**

And you understand:
- ✅ How to run services with Docker
- ✅ How Redis stores data
- ✅ How rate limiting works
- ✅ How to add rate limiting to Express
- ✅ How PostgreSQL/Prisma works

---

# NOW You Can Think About RateGuard

RateGuard is just:
1. **Express server** (you know this)
2. **Rate limiting with Redis** (you just learned this!)
3. **User data in PostgreSQL** (you just learned this!)
4. **Next.js dashboard** (you already know React)

That's it. The complex docs just describe HOW to combine these things.

---

# What's Next?

## Option A: Keep Learning (Recommended)

Spend another week on small projects:
- Day 6: Build a URL shortener (Redis)
- Day 7: Build a todo API (PostgreSQL)
- Day 8: Build a session store (Redis + Express)
- Day 9: Build a simple analytics counter (Redis)
- Day 10: Combine them all

## Option B: Start Simple RateGuard

After Day 5, build a TINY version:
- Express server
- 1 rate limit rule
- 1 API key
- No fancy UI

## Option C: Take a Break

You've learned a lot. Let it sink in.
Come back tomorrow with fresh eyes.

---

# Remember

You don't need to understand everything.

The fancy RateGuard docs with Lua scripts and Kafka and ClickHouse?

**That's optimization.** 

You can build a working rate limiter with just:
- Redis
- 30 lines of JavaScript

Everything else is making it faster/better/scalable.

---

# Your Homework

**Right now, do Day 1.**

1. Install Docker Desktop
2. Run `docker run hello-world`
3. Run Redis: `docker run -d -p 6379:6379 --name my-redis redis:alpine`
4. Test it: `docker exec -it my-redis redis-cli PING`

When you see `PONG`, you're done.

**Come back and tell me: "PONG"**

That's it. Nothing else today.
