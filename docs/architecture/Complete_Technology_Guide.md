# The Complete Guide: 8 Technologies You Need to Learn

## What This Document Is

This is the guide I wish existed when I was learning.

Official docs tell you WHAT. This guide tells you:
- **WHY** — The problem this technology solves
- **HOW** — How it actually works (mental model)
- **WHEN** — When to use it vs alternatives
- **GOTCHAS** — What the docs don't tell you

---

# Table of Contents

1. [Docker](#1-docker) — Run anything without installing it
2. [Redis](#2-redis) — Super fast data storage
3. [PostgreSQL](#3-postgresql) — Structured database
4. [Fastify](#4-fastify) — Fast web framework
5. [Lua](#5-lua-for-redis) — Scripting inside Redis
6. [Rate Limiting](#6-rate-limiting) — Control request flow
7. [Kafka](#7-kafka) — Message streaming
8. [ClickHouse](#8-clickhouse) — Analytics database

---

# 1. DOCKER

## What Is Docker?

Docker lets you run software in isolated "containers" without installing it on your computer.

```
WITHOUT DOCKER:
1. Download PostgreSQL installer
2. Run installer
3. Configure paths
4. Set up user/password
5. Pray it doesn't conflict with other software
6. Different version than your teammate
7. "Works on my machine" problems

WITH DOCKER:
1. docker run postgres
2. Done.
```

## Why Does Docker Exist?

### The Problem It Solves

**Problem 1: "Works on my machine"**
```
Developer A: "The app works fine for me"
Developer B: "It crashes on my machine"
Developer A: "What version of Node do you have?"
Developer B: "14.2"
Developer A: "I have 16.8"
Developer B: "What about MongoDB?"
Developer A: "5.0"
Developer B: "I have 4.4"
... 3 hours of debugging later ...
```

**Problem 2: Dependency Hell**
```
App 1 needs: Python 2.7
App 2 needs: Python 3.9
Your system: Can only have one Python in PATH
Result: 💥
```

**Problem 3: Clean Uninstall**
```
You install MongoDB.
You decide you don't need it.
You uninstall MongoDB.
But wait... there's still:
- Config files in /etc/
- Data files in /var/lib/
- Log files in /var/log/
- User accounts
- System services
- Random folders everywhere
```

### How Docker Solves It

Docker packages EVERYTHING an app needs into a "container":
- The app itself
- All dependencies
- The operating system libraries
- Configuration files

This container runs in ISOLATION. It can't see or affect your system.

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR COMPUTER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │ Container 1 │  │ Container 2 │  │ Container 3 │        │
│   │             │  │             │  │             │        │
│   │ PostgreSQL  │  │   Redis     │  │  Your App   │        │
│   │ v16         │  │   v7        │  │  Node 20    │        │
│   │             │  │             │  │             │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                 │
│         └────────────────┴────────────────┘                 │
│                          │                                  │
│                    They can talk                            │
│                    to each other                            │
│                    but are isolated                         │
│                    from your system                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## How Docker Works (Mental Model)

### Key Concepts

**1. Image = Recipe**
```
An image is like a recipe or blueprint.
It says: "To run PostgreSQL, you need:
- Ubuntu base
- PostgreSQL binaries
- These config files
- Run this command on startup"

Images are READ-ONLY. You download them, you don't change them.
```

**2. Container = Running Instance**
```
A container is a running copy of an image.
Like how you can bake multiple cakes from one recipe,
you can run multiple containers from one image.

┌──────────────────────────────────────────┐
│              IMAGE: postgres:16          │
│           (downloaded once)              │
└─────────────────┬────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│  Container 1  │   │  Container 2  │
│  postgres-dev │   │  postgres-test│
│  Port 5432    │   │  Port 5433    │
└───────────────┘   └───────────────┘
```

**3. Volume = Persistent Storage**
```
Containers are EPHEMERAL (temporary).
When you delete a container, all data inside is GONE.

Volumes are folders that persist OUTSIDE the container.

┌─────────────────────────────────────────┐
│              Container                   │
│                                          │
│   /var/lib/postgresql/data ─────────────┼──────┐
│                                          │      │
└─────────────────────────────────────────┘      │
                                                  │
                                                  ▼
                                     ┌────────────────────┐
                                     │  Volume on Host    │
                                     │  (persists after   │
                                     │   container dies)  │
                                     └────────────────────┘
```

**4. Port Mapping**
```
Containers have their own network.
PostgreSQL inside container listens on port 5432.
But YOUR computer can't access it!

Port mapping: "Map container's 5432 to my computer's 5432"

-p 5432:5432
   │     │
   │     └── Container's port
   └──────── Your computer's port

Now: localhost:5432 → Container:5432
```

### Docker vs Virtual Machines

```
┌─────────────────────────────────────────────────────────────┐
│                    VIRTUAL MACHINES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│  │  App 1  │ │  App 2  │ │  App 3  │                        │
│  ├─────────┤ ├─────────┤ ├─────────┤                        │
│  │ Ubuntu  │ │ Ubuntu  │ │ Ubuntu  │  ← Full OS for each!  │
│  │ 2GB RAM │ │ 2GB RAM │ │ 2GB RAM │    (wasteful)         │
│  └─────────┘ └─────────┘ └─────────┘                        │
│  ─────────────────────────────────────                      │
│              Hypervisor (VMware, etc)                       │
│  ─────────────────────────────────────                      │
│              Host Operating System                          │
│  ─────────────────────────────────────                      │
│                   Hardware                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       DOCKER                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│  │  App 1  │ │  App 2  │ │  App 3  │                        │
│  ├─────────┤ ├─────────┤ ├─────────┤                        │
│  │  Libs   │ │  Libs   │ │  Libs   │  ← Only app + libs    │
│  │  50MB   │ │  30MB   │ │  20MB   │    (efficient)        │
│  └─────────┘ └─────────┘ └─────────┘                        │
│  ─────────────────────────────────────                      │
│                 Docker Engine                                │
│  ─────────────────────────────────────                      │
│          Host Operating System (shared!)                    │
│  ─────────────────────────────────────                      │
│                   Hardware                                   │
└─────────────────────────────────────────────────────────────┘

Docker: 100MB per container
VM: 2GB per virtual machine
```

## Docker Commands (Complete Reference)

### Running Containers

```bash
# Basic run
docker run IMAGE_NAME

# Run in background (detached)
docker run -d IMAGE_NAME

# Run with a name
docker run --name my-container IMAGE_NAME

# Run with port mapping
docker run -p HOST_PORT:CONTAINER_PORT IMAGE_NAME

# Run with environment variables
docker run -e VAR_NAME=value IMAGE_NAME

# Run with volume (persist data)
docker run -v /path/on/host:/path/in/container IMAGE_NAME

# Run with auto-remove when stopped
docker run --rm IMAGE_NAME

# COMPLETE EXAMPLE:
docker run -d \
  --name my-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### Managing Containers

```bash
# List running containers
docker ps

# List ALL containers (including stopped)
docker ps -a

# Stop a container
docker stop CONTAINER_NAME

# Start a stopped container
docker start CONTAINER_NAME

# Restart a container
docker restart CONTAINER_NAME

# Remove a container (must be stopped first)
docker rm CONTAINER_NAME

# Force remove (even if running)
docker rm -f CONTAINER_NAME

# Remove all stopped containers
docker container prune
```

### Interacting with Containers

```bash
# Execute command inside container
docker exec CONTAINER_NAME COMMAND

# Open interactive shell
docker exec -it CONTAINER_NAME sh
docker exec -it CONTAINER_NAME bash

# View logs
docker logs CONTAINER_NAME

# Follow logs (like tail -f)
docker logs -f CONTAINER_NAME

# View last 100 lines
docker logs --tail 100 CONTAINER_NAME
```

### Managing Images

```bash
# List images
docker images

# Pull an image
docker pull IMAGE_NAME:TAG

# Remove an image
docker rmi IMAGE_NAME

# Remove unused images
docker image prune
```

### Docker Compose (Multiple Containers)

Instead of running multiple `docker run` commands, use a file:

**docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Commands:**
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (DELETES DATA!)
docker-compose down -v

# View logs
docker-compose logs

# View status
docker-compose ps
```

## What Docs Don't Tell You

### 1. Image Tags Matter

```bash
# DON'T DO THIS:
docker run postgres

# This pulls "latest" tag which changes over time!
# Your app might break when Postgres updates.

# DO THIS:
docker run postgres:16-alpine

# Pin to specific version
# "alpine" = smaller image (5MB vs 300MB)
```

### 2. Container Names Must Be Unique

```bash
docker run --name my-redis redis
docker run --name my-redis redis  # ERROR! Name already used

# Remove the old one first:
docker rm my-redis
```

### 3. Volumes vs Bind Mounts

```bash
# VOLUME (Docker manages it):
-v postgres_data:/var/lib/postgresql/data
# Stored somewhere in Docker's internals
# Easy to backup with docker commands

# BIND MOUNT (You manage it):
-v /home/usama/data:/var/lib/postgresql/data
# Stored exactly where you specify
# Direct access to files
```

### 4. Networking Between Containers

```bash
# Containers on same network can talk by NAME:

# Create network
docker network create mynet

# Run containers on that network
docker run --network mynet --name my-postgres postgres
docker run --network mynet --name my-app myapp

# Inside my-app, connect to:
# postgres://my-postgres:5432/db
# NOT localhost! Use container name!
```

### 5. Health Checks

```yaml
# In docker-compose.yml:
services:
  postgres:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 5s
      timeout: 5s
      retries: 5
```

This makes `docker-compose ps` show "healthy" instead of just "running".

## Common Mistakes

```bash
# MISTAKE 1: Forgetting -d (runs in foreground, blocks terminal)
docker run postgres  # Blocks your terminal!
docker run -d postgres  # Runs in background ✓

# MISTAKE 2: Wrong port order
-p 3000:5432  # Your port 3000 → Container's 5432
-p 5432:3000  # Your port 5432 → Container's 3000 (probably wrong!)

# MISTAKE 3: Thinking data persists
docker run postgres  # Create data
docker rm container  # Data is GONE!
# Use volumes for persistence!

# MISTAKE 4: Using localhost inside container
# Inside container, localhost = the container itself
# Use host.docker.internal to reach your computer
# Or use container names on same network
```

---

# 2. REDIS

## What Is Redis?

Redis = **R**emote **Di**ctionary **S**erver

It's a database that stores data in MEMORY (RAM), making it extremely fast.

```
Traditional Database (PostgreSQL):
┌──────────┐     ┌──────────┐
│   App    │────▶│   Disk   │  ~10ms per query
└──────────┘     └──────────┘

Redis:
┌──────────┐     ┌──────────┐
│   App    │────▶│   RAM    │  ~0.1ms per query (100x faster!)
└──────────┘     └──────────┘
```

## Why Does Redis Exist?

### Problem 1: Database Queries Are Slow

```javascript
// Every time user visits profile page:
const user = await db.query('SELECT * FROM users WHERE id = 123');
const posts = await db.query('SELECT * FROM posts WHERE user_id = 123');
const followers = await db.query('SELECT COUNT(*) FROM follows WHERE following_id = 123');

// Each query: 10-50ms
// Total: 30-150ms
// 1000 users = 1000 × 3 queries = 3000 queries per second on database
// Database: 💀
```

**Solution: Cache results in Redis**

```javascript
// First request: get from DB, store in Redis
let user = await redis.get('user:123');
if (!user) {
  user = await db.query('SELECT * FROM users WHERE id = 123');
  await redis.set('user:123', JSON.stringify(user), 'EX', 300); // Cache for 5 min
}

// Next 1000 requests: get from Redis (0.1ms each)
```

### Problem 2: Counting Things Is Expensive

```javascript
// Count likes on a post (database):
const likes = await db.query('SELECT COUNT(*) FROM likes WHERE post_id = 456');
// Scans entire table every time!

// With Redis:
await redis.incr('likes:post:456');  // Atomic increment, instant
const likes = await redis.get('likes:post:456');
```

### Problem 3: Session Storage

```javascript
// Storing sessions in database:
// Every request: query database to check if logged in
// 1000 requests/sec = 1000 DB queries/sec just for auth!

// Storing sessions in Redis:
const sessionData = await redis.get(`session:${sessionId}`);
// 0.1ms per check, database untouched
```

### Problem 4: Rate Limiting

```javascript
// Limit API to 100 requests per minute per user

// Without Redis: Where do you store the count?
// - In memory? Lost on restart, doesn't work with multiple servers
// - In database? Too slow for every request

// With Redis:
const count = await redis.incr(`ratelimit:${userId}`);
if (count === 1) await redis.expire(`ratelimit:${userId}`, 60);
if (count > 100) throw new Error('Rate limited!');
```

## How Redis Works

### Data Lives in RAM

```
┌─────────────────────────────────────────────────────────────┐
│                         RAM                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Key: "user:123"          Value: "{name: 'Usama'...}"       │
│  Key: "session:abc"       Value: "user_id:123"              │
│  Key: "likes:post:456"    Value: "1542"                     │
│  Key: "ratelimit:user:1"  Value: "47"                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
              │
              │ (optionally saved to disk)
              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DISK                                  │
│            (for persistence on restart)                      │
└─────────────────────────────────────────────────────────────┘
```

### Single-Threaded (And That's Good!)

```
Most databases: Multiple threads accessing same data
- Need locks to prevent conflicts
- Locks cause waiting
- Complex, potential for bugs

Redis: Single thread processes all commands
- No locks needed (only one thing happens at a time)
- Each command completes before next starts
- SIMPLE and PREDICTABLE

"But isn't single-threaded slow?"
- Network I/O is the bottleneck, not CPU
- Redis can handle 100,000+ operations per second
- That's enough for most applications
```

### Persistence Options

```
OPTION 1: No persistence (fastest)
- Data in RAM only
- Lost on restart
- OK for: caches, sessions

OPTION 2: RDB Snapshots
- Save entire dataset to disk periodically (every 5 min)
- Fast restart (load snapshot)
- May lose last 5 min of data on crash

OPTION 3: AOF (Append Only File)
- Log every write operation
- Replay log on restart
- Can lose at most 1 second of data
- Slower than RDB

OPTION 4: RDB + AOF (safest)
- Use both
- Best durability
```

## Redis Data Types

### 1. Strings (Most Common)

```bash
# Set a value
SET name "Usama"

# Get a value
GET name  # "Usama"

# Set with expiration (seconds)
SET session:abc "user_123" EX 3600  # Expires in 1 hour

# Set only if doesn't exist
SETNX lock:job "process_1"  # Returns 1 if set, 0 if already exists

# Increment number
SET counter 0
INCR counter  # 1
INCR counter  # 2
INCRBY counter 10  # 12

# Decrement
DECR counter  # 11
```

**Use cases:**
- Caching (store JSON as string)
- Counters (views, likes)
- Sessions
- Rate limiting

### 2. Hashes (Like Objects)

```bash
# Set multiple fields
HSET user:123 name "Usama" email "usama@test.com" age 25

# Get one field
HGET user:123 name  # "Usama"

# Get all fields
HGETALL user:123
# 1) "name"
# 2) "Usama"
# 3) "email"
# 4) "usama@test.com"
# 5) "age"
# 6) "25"

# Increment a field
HINCRBY user:123 age 1  # 26

# Check if field exists
HEXISTS user:123 name  # 1 (true)

# Delete a field
HDEL user:123 age
```

**Use cases:**
- User profiles
- Product details
- Any object-like data
- Rate limiter state (tokens, last_refill)

### 3. Lists (Ordered, Allows Duplicates)

```bash
# Push to left (front)
LPUSH queue:emails "email1" "email2" "email3"

# Push to right (back)
RPUSH queue:emails "email4"

# Get range (0 = first, -1 = last)
LRANGE queue:emails 0 -1
# 1) "email3"
# 2) "email2"
# 3) "email1"
# 4) "email4"

# Pop from left (remove and return)
LPOP queue:emails  # "email3"

# Pop from right
RPOP queue:emails  # "email4"

# Get length
LLEN queue:emails  # 2

# Blocking pop (wait for item)
BLPOP queue:emails 30  # Wait up to 30 seconds
```

**Use cases:**
- Job queues
- Recent activity feeds
- Message history

### 4. Sets (Unique, Unordered)

```bash
# Add members
SADD tags:post:123 "javascript" "nodejs" "redis"
SADD tags:post:123 "javascript"  # Returns 0 (already exists)

# Get all members
SMEMBERS tags:post:123
# 1) "javascript"
# 2) "nodejs"
# 3) "redis"

# Check if member exists
SISMEMBER tags:post:123 "redis"  # 1 (true)

# Remove member
SREM tags:post:123 "nodejs"

# Count members
SCARD tags:post:123  # 2

# Set operations
SADD tags:post:456 "javascript" "python"
SINTER tags:post:123 tags:post:456  # Intersection: "javascript"
SUNION tags:post:123 tags:post:456  # Union: all tags
```

**Use cases:**
- Tags
- Unique visitors
- Online users
- Friends/followers

### 5. Sorted Sets (Unique, Ordered by Score)

```bash
# Add with score
ZADD leaderboard 100 "player1" 250 "player2" 175 "player3"

# Get by rank (lowest to highest)
ZRANGE leaderboard 0 -1
# 1) "player1"
# 2) "player3"
# 3) "player2"

# Get by rank (highest to lowest)
ZREVRANGE leaderboard 0 -1 WITHSCORES
# 1) "player2"
# 2) "250"
# 3) "player3"
# 4) "175"
# 5) "player1"
# 6) "100"

# Get rank of member
ZREVRANK leaderboard "player2"  # 0 (first place)

# Increment score
ZINCRBY leaderboard 200 "player1"  # Now 300

# Get by score range
ZRANGEBYSCORE leaderboard 100 200  # Scores between 100-200

# Remove old entries (sliding window rate limiting)
ZREMRANGEBYSCORE requests:user:123 -inf 1705320000  # Remove before timestamp
```

**Use cases:**
- Leaderboards
- Priority queues
- Time-series data
- Sliding window rate limiting

## Redis in Node.js

```javascript
const Redis = require('ioredis');

// Connect
const redis = new Redis();  // localhost:6379
// or
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'optional',
});

// Strings
await redis.set('key', 'value');
await redis.set('key', 'value', 'EX', 60);  // 60 second expiry
const value = await redis.get('key');

// Numbers
await redis.incr('counter');
await redis.incrby('counter', 5);
const count = await redis.get('counter');  // Returns string! Use parseInt()

// Hashes
await redis.hset('user:1', { name: 'Usama', email: 'usama@test.com' });
const user = await redis.hgetall('user:1');  // { name: 'Usama', email: '...' }

// Expiry
await redis.expire('key', 60);  // Expire in 60 seconds
const ttl = await redis.ttl('key');  // Seconds remaining

// Delete
await redis.del('key');

// Check existence
const exists = await redis.exists('key');  // 1 or 0

// Pipeline (batch commands)
const pipeline = redis.pipeline();
pipeline.set('a', '1');
pipeline.set('b', '2');
pipeline.get('a');
pipeline.get('b');
const results = await pipeline.exec();  // [[null, 'OK'], [null, 'OK'], [null, '1'], [null, '2']]

// Transaction (atomic)
const tx = redis.multi();
tx.incr('counter');
tx.incr('counter');
const results = await tx.exec();  // Both increments happen atomically

// Close connection
redis.quit();
```

## What Docs Don't Tell You

### 1. Keys Can Expire While You're Using Them

```javascript
// WRONG:
const exists = await redis.exists('session:abc');
if (exists) {
  // Key might expire RIGHT HERE between exists and get!
  const session = await redis.get('session:abc');  // null!
}

// RIGHT:
const session = await redis.get('session:abc');
if (session) {
  // Use session
}
```

### 2. INCR on Non-Existent Key Creates It

```javascript
// Key doesn't exist
await redis.incr('counter');  // Creates key with value 1
await redis.incr('counter');  // Now 2

// This is USEFUL for rate limiting:
const count = await redis.incr(`ratelimit:${userId}`);
if (count === 1) {
  await redis.expire(`ratelimit:${userId}`, 60);
}
```

### 3. GET Returns String (Not Number)

```javascript
await redis.set('count', 42);
const count = await redis.get('count');
console.log(count + 1);  // "421" (string concatenation!)
console.log(parseInt(count) + 1);  // 43 ✓
```

### 4. Patterns for Key Names

```javascript
// Use colons as separators (convention)
// object:id:field

'user:123'              // User 123
'user:123:profile'      // User 123's profile
'session:abc123'        // Session with ID abc123
'ratelimit:user:123'    // Rate limit for user 123
'cache:posts:page:1'    // Cached posts page 1
```

### 5. SCAN Instead of KEYS

```javascript
// KEYS blocks Redis until complete (dangerous in production!)
const keys = await redis.keys('user:*');  // DON'T DO THIS

// SCAN iterates in batches (non-blocking)
let cursor = '0';
do {
  const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'user:*', 'COUNT', 100);
  cursor = nextCursor;
  // Process keys...
} while (cursor !== '0');
```

### 6. Connection Handling

```javascript
// DON'T create new connection per request:
app.get('/api/data', async (req, res) => {
  const redis = new Redis();  // WRONG! Creates new connection each time
  const data = await redis.get('data');
  redis.quit();
});

// DO create one connection at startup:
const redis = new Redis();  // One connection

app.get('/api/data', async (req, res) => {
  const data = await redis.get('data');  // Reuse connection
  res.json({ data });
});
```

## Redis vs Alternatives

| Feature | Redis | Memcached | MongoDB |
|---------|-------|-----------|---------|
| Speed | ~0.1ms | ~0.1ms | ~5ms |
| Data types | 5+ types | Strings only | Documents |
| Persistence | Optional | No | Yes |
| Clustering | Yes | Yes | Yes |
| Pub/Sub | Yes | No | Yes |
| Use case | Cache, sessions, rate limiting | Simple cache | Primary database |

**When to use Redis:**
- Caching (most common)
- Sessions
- Rate limiting
- Real-time leaderboards
- Job queues
- Pub/sub messaging

**When NOT to use Redis:**
- Primary data storage (use PostgreSQL/MongoDB)
- Large blobs (use S3/disk)
- Complex queries (use SQL database)

---

# 3. POSTGRESQL

## What Is PostgreSQL?

PostgreSQL (Postgres) is a relational database that stores data in TABLES with defined COLUMNS.

```
MongoDB (what you know):
{
  "_id": "abc123",
  "name": "Usama",
  "email": "usama@test.com",
  "posts": [...]  // Embedded or referenced
}

PostgreSQL:
┌─────────────────────────────────────────┐
│              users table                 │
├──────┬────────────┬─────────────────────┤
│ id   │ name       │ email               │
├──────┼────────────┼─────────────────────┤
│ 1    │ Usama      │ usama@test.com      │
│ 2    │ Ahmed      │ ahmed@test.com      │
└──────┴────────────┴─────────────────────┘
```

## Why PostgreSQL Over MongoDB?

### 1. Data Integrity

```javascript
// MongoDB: You can insert anything
db.users.insertOne({ naem: "Usama" });  // Typo "naem" - MongoDB accepts it!
db.users.insertOne({ name: 123 });       // Number instead of string - MongoDB accepts it!

// PostgreSQL: Schema enforcement
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,  -- Must be string, required
  email VARCHAR(100) UNIQUE    -- Must be unique
);

INSERT INTO users (naem) VALUES ('Usama');  // ERROR: column "naem" doesn't exist
INSERT INTO users (name) VALUES (123);       // ERROR: invalid input for type varchar
```

### 2. Relationships Are First-Class

```javascript
// MongoDB: Manual references
const post = {
  title: "Hello",
  author_id: "abc123"  // You manage this yourself
};
// No guarantee author_id points to real user!

// PostgreSQL: Foreign keys
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200),
  author_id INT REFERENCES users(id)  -- MUST point to real user!
);

INSERT INTO posts (title, author_id) VALUES ('Hello', 999);  
-- ERROR: violates foreign key constraint
```

### 3. Complex Queries

```sql
-- PostgreSQL: Find all users who posted in the last week, with their post count
SELECT 
  users.name,
  COUNT(posts.id) as post_count
FROM users
JOIN posts ON posts.author_id = users.id
WHERE posts.created_at > NOW() - INTERVAL '7 days'
GROUP BY users.id
HAVING COUNT(posts.id) > 5
ORDER BY post_count DESC;

-- MongoDB: This requires aggregation pipeline, multiple stages, harder to write
```

### 4. ACID Transactions

```sql
-- PostgreSQL: Either BOTH happen or NEITHER happens
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- If anything fails, everything rolls back
-- MongoDB: Only has document-level atomicity
```

## SQL Basics (For MongoDB Developers)

### MongoDB → SQL Translation

| MongoDB | SQL |
|---------|-----|
| `db.users.find({})` | `SELECT * FROM users` |
| `db.users.find({ name: "Usama" })` | `SELECT * FROM users WHERE name = 'Usama'` |
| `db.users.find({ age: { $gt: 25 } })` | `SELECT * FROM users WHERE age > 25` |
| `db.users.findOne({ id: "1" })` | `SELECT * FROM users WHERE id = 1 LIMIT 1` |
| `db.users.insertOne({ name: "X" })` | `INSERT INTO users (name) VALUES ('X')` |
| `db.users.updateOne({ id: "1" }, { $set: { name: "X" } })` | `UPDATE users SET name = 'X' WHERE id = 1` |
| `db.users.deleteOne({ id: "1" })` | `DELETE FROM users WHERE id = 1` |
| `db.users.countDocuments({})` | `SELECT COUNT(*) FROM users` |
| `db.users.find({}).sort({ name: 1 })` | `SELECT * FROM users ORDER BY name ASC` |
| `db.users.find({}).limit(10).skip(20)` | `SELECT * FROM users LIMIT 10 OFFSET 20` |

### Creating Tables

```sql
-- Basic table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,           -- Auto-incrementing integer
  name VARCHAR(100) NOT NULL,      -- Required string, max 100 chars
  email VARCHAR(255) UNIQUE,       -- Unique string
  age INT,                         -- Optional integer
  is_active BOOLEAN DEFAULT true,  -- Boolean with default
  created_at TIMESTAMP DEFAULT NOW()  -- Timestamp with default
);

-- Table with foreign key
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,                    -- Unlimited length string
  author_id INT REFERENCES users(id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: delete posts when user is deleted
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table with JSON column (best of both worlds!)
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50),
  payload JSONB,  -- Store any JSON data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Query JSON
SELECT * FROM events WHERE payload->>'user_id' = '123';
SELECT payload->'details'->>'ip' FROM events;
```

### Common Data Types

| Type | Description | Example |
|------|-------------|---------|
| `SERIAL` | Auto-increment integer | IDs |
| `INT` / `INTEGER` | Integer | Age, count |
| `BIGINT` | Large integer | Timestamps in ms |
| `NUMERIC(10,2)` | Exact decimal | Money ($123.45) |
| `VARCHAR(n)` | String up to n chars | Name, email |
| `TEXT` | Unlimited string | Blog content |
| `BOOLEAN` | true/false | is_active |
| `TIMESTAMP` | Date and time | created_at |
| `DATE` | Date only | birth_date |
| `UUID` | Universal unique ID | id |
| `JSONB` | JSON data | metadata |

### JOINs (Replacing $lookup)

```sql
-- Users and their posts
SELECT 
  users.name,
  posts.title
FROM users
JOIN posts ON posts.author_id = users.id;

-- Same as MongoDB:
-- db.users.aggregate([
--   { $lookup: { from: "posts", localField: "_id", foreignField: "author_id", as: "posts" }}
-- ])

-- LEFT JOIN (include users even if they have no posts)
SELECT 
  users.name,
  COUNT(posts.id) as post_count
FROM users
LEFT JOIN posts ON posts.author_id = users.id
GROUP BY users.id;

-- Multiple JOINs
SELECT 
  users.name,
  posts.title,
  comments.content
FROM users
JOIN posts ON posts.author_id = users.id
JOIN comments ON comments.post_id = posts.id;
```

## Prisma (ORM That Feels Like MongoDB)

Prisma makes PostgreSQL feel like MongoDB:

```javascript
// Define schema
// prisma/schema.prisma
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

// Use it like MongoDB:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create
const user = await prisma.user.create({
  data: { name: 'Usama', email: 'usama@test.com' }
});

// Find all
const users = await prisma.user.findMany();

// Find with filter
const user = await prisma.user.findFirst({
  where: { email: 'usama@test.com' }
});

// Find by ID
const user = await prisma.user.findUnique({
  where: { id: 1 }
});

// Update
const user = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Usama Khan' }
});

// Delete
await prisma.user.delete({ where: { id: 1 } });

// Include related data (like populate)
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true }
});

// Count
const count = await prisma.user.count();

// Complex query
const users = await prisma.user.findMany({
  where: {
    AND: [
      { name: { contains: 'usa' } },
      { createdAt: { gte: new Date('2024-01-01') } }
    ]
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0
});
```

## Prisma vs Mongoose Comparison

| Mongoose (MongoDB) | Prisma (PostgreSQL) |
|-------------------|---------------------|
| `User.create({...})` | `prisma.user.create({ data: {...} })` |
| `User.find({})` | `prisma.user.findMany()` |
| `User.findById(id)` | `prisma.user.findUnique({ where: { id } })` |
| `User.findOne({ email })` | `prisma.user.findFirst({ where: { email } })` |
| `User.findByIdAndUpdate(id, {...})` | `prisma.user.update({ where: { id }, data: {...} })` |
| `User.findByIdAndDelete(id)` | `prisma.user.delete({ where: { id } })` |
| `.populate('posts')` | `include: { posts: true }` |
| `User.countDocuments()` | `prisma.user.count()` |
| `{ name: /pattern/ }` | `{ name: { contains: 'pattern' } }` |
| `{ age: { $gt: 25 } }` | `{ age: { gt: 25 } }` |

## What Docs Don't Tell You

### 1. UUIDs vs Auto-Increment

```sql
-- Auto-increment (default):
id SERIAL PRIMARY KEY
-- Results in: 1, 2, 3, 4, 5...
-- Problem: Guessable! /users/1, /users/2...
-- Problem: Can't merge databases (ID conflicts)

-- UUID (recommended for APIs):
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
-- Results in: 'a1b2c3d4-e5f6-...'
-- Not guessable ✓
-- No conflicts when merging ✓
```

### 2. Indexes Are Critical

```sql
-- Without index:
SELECT * FROM users WHERE email = 'usama@test.com';
-- Scans ENTIRE table (slow with millions of rows)

-- With index:
CREATE INDEX idx_users_email ON users(email);
-- Now it's instant

-- Unique constraint automatically creates index
email VARCHAR(255) UNIQUE  -- Index created!

-- Check your indexes
SELECT * FROM pg_indexes WHERE tablename = 'users';
```

### 3. N+1 Query Problem

```javascript
// WRONG (N+1 queries):
const users = await prisma.user.findMany();  // 1 query
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });  // N queries!
}
// If 100 users = 101 queries!

// RIGHT (1 query):
const users = await prisma.user.findMany({
  include: { posts: true }  // JOINs in one query
});
```

### 4. Transactions

```javascript
// If any operation fails, ALL are rolled back
await prisma.$transaction([
  prisma.user.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } }),
  prisma.user.update({ where: { id: 2 }, data: { balance: { increment: 100 } } }),
]);

// Or with callback:
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: 1 } });
  if (user.balance < 100) throw new Error('Insufficient funds');
  
  await tx.user.update({ where: { id: 1 }, data: { balance: { decrement: 100 } } });
  await tx.user.update({ where: { id: 2 }, data: { balance: { increment: 100 } } });
});
```

---

# 4. FASTIFY

## What Is Fastify?

Fastify is a web framework like Express, but faster.

```javascript
// Express (what you know):
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

app.listen(3000);

// Fastify (almost identical):
const fastify = require('fastify')();

fastify.get('/', (request, reply) => {
  reply.send({ hello: 'world' });
});

fastify.listen({ port: 3000 });
```

## Why Fastify Over Express?

### 1. Speed

```
Requests per second (higher is better):

Express:   15,000 req/sec
Fastify:   75,000 req/sec  (5x faster!)
```

### 2. Built-in Validation

```javascript
// Express: Manual validation (repetitive)
app.post('/users', (req, res) => {
  const { name, email, age } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  if (!email) return res.status(400).json({ error: 'email required' });
  if (typeof age !== 'number') return res.status(400).json({ error: 'age must be number' });
  // ... finally do something
});

// Fastify: Schema validation (automatic)
fastify.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0 }
      }
    }
  }
}, (request, reply) => {
  // request.body is already validated!
  const { name, email, age } = request.body;
});
```

### 3. Better TypeScript Support

```typescript
// Fastify with TypeScript
import Fastify from 'fastify';

interface UserBody {
  name: string;
  email: string;
}

const fastify = Fastify();

fastify.post<{ Body: UserBody }>('/users', async (request, reply) => {
  const { name, email } = request.body;  // TypeScript knows these types!
  return { created: true };
});
```

### 4. Plugin System

```javascript
// Fastify plugins encapsulate functionality
const fastify = require('fastify')();

// Register plugins
await fastify.register(require('@fastify/cors'));
await fastify.register(require('@fastify/helmet'));
await fastify.register(require('@fastify/cookie'));

// Create your own plugin
async function myPlugin(fastify, options) {
  fastify.decorate('utility', () => 'I am useful');
  
  fastify.addHook('onRequest', async (request, reply) => {
    // Runs before every request
  });
}

fastify.register(myPlugin);
```

## Express → Fastify Translation

| Express | Fastify |
|---------|---------|
| `req.body` | `request.body` |
| `req.params` | `request.params` |
| `req.query` | `request.query` |
| `req.headers` | `request.headers` |
| `res.json(data)` | `reply.send(data)` |
| `res.status(404).json(...)` | `reply.code(404).send(...)` |
| `res.send('text')` | `reply.send('text')` |
| `res.header('X-Custom', 'value')` | `reply.header('X-Custom', 'value')` |
| `app.use(middleware)` | `fastify.addHook('preHandler', fn)` |
| `app.use(express.json())` | (built-in, automatic) |

### Complete Example: Express vs Fastify

```javascript
// ============ EXPRESS ============
const express = require('express');
const app = express();

app.use(express.json());

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Route
app.get('/users/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const user = await createUser(name, email);
  res.status(201).json(user);
});

app.listen(3000);

// ============ FASTIFY ============
const fastify = require('fastify')({ logger: true });

// Hook (like middleware)
fastify.addHook('onRequest', async (request, reply) => {
  // Logger is automatic, but you could add custom logic
});

// Route with validation
fastify.get('/users/:id', async (request, reply) => {
  const user = await getUser(request.params.id);
  if (!user) {
    reply.code(404);
    return { error: 'Not found' };
  }
  return user;  // No need for reply.send, just return!
});

fastify.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { name, email } = request.body;
  const user = await createUser(name, email);
  reply.code(201);
  return user;
});

fastify.listen({ port: 3000 });
```

## Fastify Hooks (Lifecycle)

```javascript
// Request lifecycle:
// 1. onRequest        → Runs first (logging, rate limiting)
// 2. preParsing       → Before body parsing
// 3. preValidation    → Before schema validation
// 4. preHandler       → Before route handler (auth check)
// 5. handler          → Your route handler
// 6. preSerialization → Before response serialization
// 7. onSend           → Before sending response
// 8. onResponse       → After response sent

fastify.addHook('onRequest', async (request, reply) => {
  // First thing that runs
  request.startTime = Date.now();
});

fastify.addHook('preHandler', async (request, reply) => {
  // Good for auth
  if (!request.headers.authorization) {
    reply.code(401);
    throw new Error('Unauthorized');
  }
});

fastify.addHook('onResponse', async (request, reply) => {
  // Good for logging
  console.log(`Response time: ${Date.now() - request.startTime}ms`);
});
```

## What Docs Don't Tell You

### 1. Return Values Work

```javascript
// Express requires res.send()
app.get('/', (req, res) => {
  res.json({ hello: 'world' });  // Must call res.json()
});

// Fastify: Just return!
fastify.get('/', () => {
  return { hello: 'world' };  // Automatically serialized to JSON
});

// Or async:
fastify.get('/', async () => {
  const data = await fetchData();
  return data;  // No reply.send needed
});
```

### 2. Error Handling Is Different

```javascript
// Express:
app.get('/', async (req, res, next) => {
  try {
    const data = await riskyOperation();
    res.json(data);
  } catch (error) {
    next(error);  // Must pass to error handler
  }
});

// Fastify: Just throw!
fastify.get('/', async () => {
  const data = await riskyOperation();  // If this throws, Fastify handles it
  return data;
});

// Custom error handler:
fastify.setErrorHandler((error, request, reply) => {
  reply.code(error.statusCode || 500).send({
    error: error.message
  });
});
```

### 3. Decorators Add Properties

```javascript
// Add custom properties to request, reply, or fastify instance
fastify.decorateRequest('user', null);
fastify.decorateReply('sendError', function(code, message) {
  this.code(code).send({ error: message });
});

fastify.addHook('preHandler', async (request, reply) => {
  request.user = await getUser(request.headers.authorization);
});

fastify.get('/profile', async (request, reply) => {
  return request.user;  // Available everywhere!
});
```

---

# 5. LUA (For Redis)

## What Is Lua?

Lua is a simple scripting language. In Redis context, you use it for ONE purpose: **atomic operations**.

You don't need to learn "Lua programming." You need to learn ~20 lines worth of Lua for Redis.

## Why Lua in Redis?

### The Race Condition Problem

```javascript
// WITHOUT LUA (Broken rate limiter):
async function checkRateLimit(userId) {
  const count = await redis.get(`limit:${userId}`);  // READ
  
  // ⚠️ ANOTHER REQUEST CAN RUN HERE! ⚠️
  
  if (count < 100) {
    await redis.incr(`limit:${userId}`);  // WRITE
    return true;
  }
  return false;
}

// Two requests at the same time:
// Request 1: count = 99, (pause)
// Request 2: count = 99, (pause)
// Request 1: incr → 100, allowed ✓
// Request 2: incr → 101, allowed ✓ (WRONG! Should be blocked!)
```

### The Solution: Lua Scripts Are Atomic

```lua
-- This ENTIRE script runs without interruption
local count = redis.call('GET', KEYS[1])
if tonumber(count or 0) < 100 then
    redis.call('INCR', KEYS[1])
    return 1  -- allowed
else
    return 0  -- blocked
end

-- No other Redis commands can run in the middle!
```

## Lua Basics (All You Need)

### Variables

```lua
-- Local variables (always use local)
local name = "Usama"
local count = 42
local is_active = true
local nothing = nil  -- like null/undefined

-- No 'let', 'const', 'var' - just 'local'
```

### Types

```lua
-- String
local s = "hello"

-- Number (integers and floats are both 'number')
local n = 42
local f = 3.14

-- Boolean
local b = true

-- nil (absence of value)
local x = nil
```

### Conditionals

```lua
if count > 10 then
    -- do something
elseif count > 5 then
    -- do something else
else
    -- default
end

-- Comparison operators: ==, ~= (not equal!), <, >, <=, >=
-- Logical operators: and, or, not

if count > 0 and count < 100 then
    -- ...
end

if not is_blocked then
    -- ...
end
```

### Type Conversion

```lua
-- String to number
local n = tonumber("42")    -- 42
local n = tonumber("hello") -- nil (not an error!)
local n = tonumber(nil)     -- nil

-- Number to string (rarely needed, Redis handles this)
local s = tostring(42)      -- "42"

-- Important: Redis returns strings!
local count = redis.call('GET', 'counter')  -- Returns "42" (string!)
local num = tonumber(count)  -- Now it's a number
```

### Math

```lua
local a = 10 + 5   -- 15
local b = 10 - 5   -- 5
local c = 10 * 5   -- 50
local d = 10 / 5   -- 2.0 (always float!)
local e = 10 % 3   -- 1 (modulo)

-- math library
local max = math.max(1, 5, 3)   -- 5
local min = math.min(1, 5, 3)   -- 1
local floor = math.floor(3.7)   -- 3
local ceil = math.ceil(3.2)     -- 4
```

### Redis Calls

```lua
-- Call any Redis command
local value = redis.call('GET', 'mykey')
redis.call('SET', 'mykey', 'myvalue')
redis.call('EXPIRE', 'mykey', 60)

-- KEYS and ARGV
-- KEYS[1], KEYS[2], ... = keys passed to EVAL
-- ARGV[1], ARGV[2], ... = arguments passed to EVAL

-- From JavaScript:
-- redis.eval(script, 2, 'key1', 'key2', 'arg1', 'arg2')
--                   ↑  ↑        ↑        ↑        ↑
--            num keys  KEYS[1]  KEYS[2]  ARGV[1]  ARGV[2]

local key = KEYS[1]
local limit = tonumber(ARGV[1])
```

### Returning Values

```lua
-- Return single value
return 1
return "hello"
return nil

-- Return array (becomes JavaScript array)
return {1, 2, 3}
return {allowed, remaining, reset_time}

-- From JavaScript:
-- const [allowed, remaining, resetTime] = await redis.eval(script, ...)
```

## Complete Rate Limiter in Lua

```lua
-- Rate limiter: Allow 'limit' requests per 'window' seconds

-- KEYS[1] = rate limit key (e.g., "ratelimit:user:123")
-- ARGV[1] = limit (e.g., 100)
-- ARGV[2] = window in seconds (e.g., 60)
-- ARGV[3] = current timestamp

local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Get current count
local count = tonumber(redis.call('GET', key)) or 0

if count < limit then
    -- Under limit: increment and allow
    local new_count = redis.call('INCR', key)
    
    -- Set expiry on first request
    if new_count == 1 then
        redis.call('EXPIRE', key, window)
    end
    
    local remaining = limit - new_count
    local ttl = redis.call('TTL', key)
    
    return {1, remaining, ttl}  -- {allowed, remaining, reset_in}
else
    -- Over limit: reject
    local ttl = redis.call('TTL', key)
    return {0, 0, ttl}  -- {allowed, remaining, reset_in}
end
```

### Using It From JavaScript

```javascript
const Redis = require('ioredis');
const redis = new Redis();

const LUA_SCRIPT = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  
  local count = tonumber(redis.call('GET', key)) or 0
  
  if count < limit then
    local new_count = redis.call('INCR', key)
    if new_count == 1 then
      redis.call('EXPIRE', key, window)
    end
    return {1, limit - new_count, redis.call('TTL', key)}
  else
    return {0, 0, redis.call('TTL', key)}
  end
`;

async function checkRateLimit(userId) {
  const result = await redis.eval(
    LUA_SCRIPT,
    1,                    // Number of KEYS
    `ratelimit:${userId}`, // KEYS[1]
    100,                  // ARGV[1] = limit
    60                    // ARGV[2] = window
  );
  
  const [allowed, remaining, resetIn] = result;
  return { allowed: allowed === 1, remaining, resetIn };
}

// Test it
const result = await checkRateLimit('user123');
console.log(result);  // { allowed: true, remaining: 99, resetIn: 60 }
```

## What Docs Don't Tell You

### 1. Redis Returns Strings

```lua
local count = redis.call('GET', 'counter')
-- count is "42" (STRING), not 42 (number)!

-- Always convert:
local count = tonumber(redis.call('GET', 'counter'))
```

### 2. nil vs Non-Existent

```lua
local value = redis.call('GET', 'nonexistent')
-- value is nil, not "nil" string

if value then
    -- key exists
else
    -- key doesn't exist
end

-- With default:
local value = redis.call('GET', 'key') or 0
```

### 3. EVALSHA Is Faster

```javascript
// EVAL: Send script every time (slow)
redis.eval(script, 1, 'key', 'arg');

// EVALSHA: Send script once, then use hash (fast)
const sha = await redis.script('LOAD', script);  // Do once
await redis.evalsha(sha, 1, 'key', 'arg');       // Use many times

// Handle script not loaded (after Redis restart):
try {
  await redis.evalsha(sha, ...);
} catch (error) {
  if (error.message.includes('NOSCRIPT')) {
    // Reload and retry
    const sha = await redis.script('LOAD', script);
    await redis.evalsha(sha, ...);
  }
}
```

### 4. Debug Lua Scripts

```lua
-- Print to Redis log
redis.log(redis.LOG_WARNING, "count is: " .. tostring(count))

-- View logs:
-- docker logs my-redis
```

---

# 6. RATE LIMITING

## What Is Rate Limiting?

Rate limiting controls how many requests someone can make in a time period.

```
Without rate limiting:
- Abuser: 1,000,000 requests/second
- Your server: 💀

With rate limiting:
- Abuser: 100 requests/minute (limit)
- 101st request: "Error 429: Too Many Requests"
- Your server: 😊
```

## Why Rate Limit?

### 1. Prevent Abuse

```
Without: Script kid makes 10,000 requests/second → Site down
With: Script kid blocked after 100 requests/minute
```

### 2. Cost Control

```
OpenAI API: $0.002 per request
- Without limit: Employee's script runs amok → $50,000 bill
- With limit: Max $100/day → Budget protected
```

### 3. Fair Usage

```
Without: Heavy user consumes all resources
With: All users get fair share
```

### 4. Third-Party API Limits

```
Stripe API: 100 requests/second
- Without limit: Your app sends 500/sec → Stripe blocks you
- With limit: Your app stays under 100 → Works fine
```

## Rate Limiting Algorithms

### 1. Fixed Window Counter (Simple, But Flawed)

```
Config: 100 requests per minute

Minute 1: [0:00 ────────────────────────── 0:59]
          Count requests in this window
          
Minute 2: [1:00 ────────────────────────── 1:59]
          Counter resets to 0
```

**Implementation:**
```javascript
async function fixedWindow(userId) {
  const key = `limit:${userId}`;
  const limit = 100;
  const window = 60;
  
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }
  
  return count <= limit;
}
```

**The Problem: Boundary Attack**
```
Time: 0:58   0:59   1:00   1:01
      │      │      │      │
      └──────┴──────┴──────┘
         90      90 requests
         
Window 1 allows 90 at 0:59
Window 2 allows 90 at 1:00
= 180 requests in 2 seconds!

Attacker exploits the boundary to exceed limit!
```

### 2. Sliding Window Log (Accurate, But Memory Heavy)

```
Instead of fixed windows, track each request timestamp:

Requests: [0:30, 0:45, 0:50, 0:55, 1:10, 1:15]
                                ↑
                            Current time: 1:20
                            Window: last 60 seconds
                            
Requests in window [0:20 to 1:20]: [0:30, 0:45, 0:50, 0:55, 1:10, 1:15]
Count: 6
```

**Implementation:**
```javascript
async function slidingWindowLog(userId) {
  const key = `limit:${userId}`;
  const limit = 100;
  const windowMs = 60000;
  const now = Date.now();
  
  // Remove old entries
  await redis.zremrangebyscore(key, 0, now - windowMs);
  
  // Count current entries
  const count = await redis.zcard(key);
  
  if (count < limit) {
    // Add this request
    await redis.zadd(key, now, `${now}:${Math.random()}`);
    await redis.expire(key, windowMs / 1000 + 1);
    return { allowed: true, remaining: limit - count - 1 };
  }
  
  return { allowed: false, remaining: 0 };
}
```

**Problem: Memory**
```
100 users × 100 requests/min = 10,000 entries in Redis
1,000,000 users × 100 requests/min = 100,000,000 entries!
```

### 3. Sliding Window Counter (Best Balance)

Combines fixed window with weighted overlap:

```
Previous window: 80 requests
Current window: 30 requests
Time position: 25% into current window

Estimated count = (previous × 75%) + (current × 100%)
                = (80 × 0.75) + 30
                = 60 + 30
                = 90 requests
```

**Implementation:**
```javascript
async function slidingWindowCounter(userId) {
  const key = `limit:${userId}`;
  const limit = 100;
  const windowSec = 60;
  const now = Date.now();
  
  const currentWindow = Math.floor(now / 1000 / windowSec);
  const previousWindow = currentWindow - 1;
  const position = (now / 1000 % windowSec) / windowSec;  // 0.0 to 1.0
  
  const [prevCount, currCount] = await Promise.all([
    redis.get(`${key}:${previousWindow}`),
    redis.get(`${key}:${currentWindow}`)
  ]);
  
  const previous = parseInt(prevCount || '0', 10);
  const current = parseInt(currCount || '0', 10);
  
  // Weighted estimate
  const estimate = (previous * (1 - position)) + current;
  
  if (estimate < limit) {
    await redis.incr(`${key}:${currentWindow}`);
    await redis.expire(`${key}:${currentWindow}`, windowSec * 2);
    return { allowed: true, remaining: Math.floor(limit - estimate - 1) };
  }
  
  return { allowed: false };
}
```

### 4. Token Bucket (Best for APIs)

Imagine a bucket that:
- Holds max N tokens (burst capacity)
- Refills at rate R tokens/second
- Each request takes 1 token
- Empty bucket = blocked

```
Config: bucket = 100 tokens, refill = 10/second

Time 0: Bucket full [████████████████████] 100 tokens
        50 requests → [██████████░░░░░░░░░░] 50 tokens
        
Time 1: Refill 10 → [████████████░░░░░░░░] 60 tokens
        80 requests → 60 allowed, 20 blocked
                     [░░░░░░░░░░░░░░░░░░░░] 0 tokens
                     
Time 2: Refill 10 → [██░░░░░░░░░░░░░░░░░░] 10 tokens
```

**Why Token Bucket?**
- Allows BURSTS (good for real-world traffic)
- Sustained rate still limited
- Used by: OpenAI, AWS, Stripe

**Complete Implementation:**
```lua
-- Token Bucket in Lua (atomic)
local key = KEYS[1]
local bucket_size = tonumber(ARGV[1])  -- max tokens
local refill_rate = tonumber(ARGV[2])  -- tokens per second
local now = tonumber(ARGV[3])          -- current time in ms

-- Get current state
local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

-- Initialize if new
if tokens == nil then
    tokens = bucket_size
    last_refill = now
end

-- Refill tokens based on elapsed time
local elapsed = (now - last_refill) / 1000  -- seconds
tokens = math.min(bucket_size, tokens + elapsed * refill_rate)

-- Try to consume 1 token
if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('EXPIRE', key, bucket_size / refill_rate * 2)
    
    return {1, math.floor(tokens)}  -- {allowed, remaining}
else
    local wait_time = (1 - tokens) / refill_rate * 1000
    return {0, 0, math.floor(wait_time)}  -- {allowed, remaining, retry_after_ms}
end
```

### Algorithm Comparison

| Algorithm | Accuracy | Memory | Bursts | Best For |
|-----------|----------|--------|--------|----------|
| Fixed Window | Low | O(1) | Boundary exploit | Simple quotas |
| Sliding Log | High | O(n) | None | Strict limits |
| Sliding Counter | Medium | O(1) | Minimal | General use |
| Token Bucket | High | O(1) | Controlled | APIs |

## Rate Limit Headers

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100           # Max requests allowed
X-RateLimit-Remaining: 45        # Requests remaining
X-RateLimit-Reset: 1705320000    # Unix timestamp when limit resets

HTTP/1.1 429 Too Many Requests
Retry-After: 30                  # Seconds until can retry
```

---

# 7. KAFKA

## What Is Kafka?

Kafka is a message queue / event streaming platform.

Think of it as a super-powered log file:
- You write events to it
- Multiple consumers can read those events
- Events are stored durably
- Handles millions of events per second

## Why Does Kafka Exist?

### Problem: Direct Communication Doesn't Scale

```
Without Kafka:

┌─────────┐     ┌─────────┐     ┌─────────┐
│ Service │────▶│ Service │────▶│ Service │
│    A    │     │    B    │     │    C    │
└─────────┘     └─────────┘     └─────────┘

- A must wait for B to respond
- If B is down, A fails
- Adding new services = changing all connections
- Each service must know about all others
```

### Solution: Event Bus

```
With Kafka:

┌─────────┐     ┌───────────────────────┐     ┌─────────┐
│ Service │────▶│                       │────▶│ Service │
│    A    │     │        KAFKA          │     │    B    │
└─────────┘     │                       │     └─────────┘
                │  (stores all events)  │     ┌─────────┐
                │                       │────▶│ Service │
                └───────────────────────┘     │    C    │
                                              └─────────┘

- A publishes event and continues immediately
- If B is down, events wait in Kafka
- New services just subscribe to events
- Services don't know about each other
```

## Real-World Example: RateGuard

```
Without Kafka:

┌──────────────────────────────────────────────────────────┐
│                        PROXY                             │
│                                                          │
│  1. Receive request                                      │
│  2. Check rate limit       ←────── Redis                 │
│  3. Forward to upstream                                  │
│  4. Log to database        ←────── PostgreSQL (SLOW!)    │
│  5. Update analytics       ←────── ClickHouse (SLOW!)    │
│  6. Return response                                      │
│                                                          │
│  Total time: 200ms (logging slows everything down!)      │
└──────────────────────────────────────────────────────────┘
```

```
With Kafka:

┌──────────────────────────────────────────────────────────┐
│                        PROXY                             │
│                                                          │
│  1. Receive request                                      │
│  2. Check rate limit       ←────── Redis                 │
│  3. Forward to upstream                                  │
│  4. Send event to Kafka    ←────── Fire and forget!      │
│  5. Return response                                      │
│                                                          │
│  Total time: 50ms (logging is async!)                    │
└──────────────────────────────────────────────────────────┘

              │
              │ Event: {request_id, user_id, status, latency}
              ▼
        ┌───────────┐
        │   KAFKA   │
        └─────┬─────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌─────────┐       ┌───────────┐
│Analytics│       │  Alerting │
│Consumer │       │  Consumer │
└────┬────┘       └─────┬─────┘
     │                   │
     ▼                   ▼
┌──────────┐       ┌──────────┐
│ClickHouse│       │  PagerDuty│
└──────────┘       └──────────┘
```

## Kafka Concepts

### Topics

```
Topics are like channels/categories:

Topic: "api-events"
- {request_id: 1, status: 200, latency: 50}
- {request_id: 2, status: 429, latency: 5}
- {request_id: 3, status: 200, latency: 75}

Topic: "user-events"
- {user_id: 1, action: "login"}
- {user_id: 2, action: "signup"}

Publishers send to specific topics.
Consumers subscribe to topics they care about.
```

### Partitions

```
For parallelism, topics are split into partitions:

Topic: "api-events" (3 partitions)

Partition 0: [event1, event4, event7, ...]
Partition 1: [event2, event5, event8, ...]
Partition 2: [event3, event6, event9, ...]

Each partition is an ordered log.
Messages with same key go to same partition.
```

### Consumer Groups

```
Multiple consumers can share the work:

Consumer Group: "analytics-team"
├── Consumer 1 reads Partition 0
├── Consumer 2 reads Partition 1
└── Consumer 3 reads Partition 2

Each message is processed by ONE consumer in the group.
Multiple groups can each get ALL messages.
```

## Kafka in Node.js (Using KafkaJS)

### Producer (Sending Events)

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

async function main() {
  await producer.connect();
  
  // Send single message
  await producer.send({
    topic: 'api-events',
    messages: [
      { 
        key: 'user-123',  // Messages with same key go to same partition
        value: JSON.stringify({
          request_id: 'abc',
          status: 200,
          latency: 50,
          timestamp: Date.now()
        })
      }
    ]
  });
  
  // Send batch (more efficient)
  await producer.send({
    topic: 'api-events',
    messages: [
      { key: 'user-1', value: JSON.stringify({ event: 1 }) },
      { key: 'user-2', value: JSON.stringify({ event: 2 }) },
      { key: 'user-3', value: JSON.stringify({ event: 3 }) },
    ]
  });
  
  await producer.disconnect();
}
```

### Consumer (Receiving Events)

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'analytics-group' });

async function main() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'api-events', fromBeginning: false });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      console.log('Received:', event);
      
      // Process the event (save to database, etc.)
      await saveToDatabase(event);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await consumer.disconnect();
});
```

## Do You Need Kafka?

**You probably DON'T need Kafka if:**
- Less than 10,000 events/day
- Single application
- Okay with losing some events
- Simple use case

**Simpler alternatives:**
- Redis Pub/Sub (simple messaging)
- Redis Streams (durable, simpler than Kafka)
- PostgreSQL LISTEN/NOTIFY (already have Postgres)
- Bull/BullMQ (job queues)

**You need Kafka when:**
- Millions of events/day
- Multiple services consuming same events
- Need guaranteed delivery
- Need to replay old events
- Strict ordering requirements

## For RateGuard MVP: Skip Kafka

```javascript
// Instead of Kafka, just log directly:
async function logRequest(event) {
  // Simple version: log to database
  await prisma.requestLog.create({ data: event });
}

// Or use Redis Streams (simpler than Kafka):
await redis.xadd('api-events', '*', 
  'request_id', event.request_id,
  'status', event.status
);
```

---

# 8. CLICKHOUSE

## What Is ClickHouse?

ClickHouse is an analytics database optimized for:
- Billions of rows
- Aggregation queries (COUNT, SUM, AVG)
- Time-series data
- Read-heavy workloads

## Why ClickHouse Over PostgreSQL?

### PostgreSQL (Row-Oriented)

```
Stores data by ROW:
┌────────────────────────────────────────────────────────┐
│ Row 1: id=1, name="Usama", email="a@b.c", age=25, ... │
│ Row 2: id=2, name="Ahmed", email="d@e.f", age=30, ... │
│ Row 3: id=3, name="Sara", email="g@h.i", age=28, ...  │
└────────────────────────────────────────────────────────┘

Query: SELECT AVG(age) FROM users
→ Must read ENTIRE row to get just the age column
→ Reads: name, email, and all other columns (wasted!)
```

### ClickHouse (Column-Oriented)

```
Stores data by COLUMN:
┌──────────────────────┐
│ id: [1, 2, 3, ...]   │
├──────────────────────┤
│ name: ["Usama", ...] │
├──────────────────────┤
│ age: [25, 30, 28...] │  ← Only read this!
└──────────────────────┘

Query: SELECT AVG(age) FROM users
→ Only reads the age column
→ 10-100x faster for analytics!
```

## Speed Comparison

```
Query: SELECT COUNT(*), AVG(latency) FROM requests 
       WHERE timestamp > '2024-01-01'
       GROUP BY endpoint

Table size: 1 billion rows

PostgreSQL: 45 seconds
ClickHouse: 0.3 seconds (150x faster!)
```

## When to Use ClickHouse

**Use ClickHouse for:**
- Analytics dashboards
- Metrics/monitoring
- Log analysis
- Time-series data
- Reports with aggregations

**DON'T use ClickHouse for:**
- Primary data (use PostgreSQL)
- Frequent updates (ClickHouse is append-only)
- Transactions (no ACID)
- Small datasets (<1M rows, PostgreSQL is fine)

## ClickHouse Basics

### Creating Tables

```sql
CREATE TABLE api_events (
    event_id UUID,
    timestamp DateTime,
    workspace_id UUID,
    endpoint String,
    status_code UInt16,
    latency_ms UInt32,
    cost_cents UInt32
)
ENGINE = MergeTree()  -- Main storage engine
ORDER BY (workspace_id, timestamp)  -- Sorting key (critical for performance!)
PARTITION BY toYYYYMM(timestamp)  -- Monthly partitions
TTL timestamp + INTERVAL 90 DAY;  -- Auto-delete after 90 days
```

### Inserting Data

```sql
INSERT INTO api_events VALUES 
  ('abc-123', now(), 'ws-1', '/api/users', 200, 50, 10),
  ('abc-124', now(), 'ws-1', '/api/posts', 200, 75, 15);
```

### Querying

```sql
-- Count requests per endpoint
SELECT 
  endpoint,
  count() as requests,
  avg(latency_ms) as avg_latency
FROM api_events
WHERE timestamp > now() - INTERVAL 7 DAY
GROUP BY endpoint
ORDER BY requests DESC;

-- Hourly request count
SELECT 
  toStartOfHour(timestamp) as hour,
  count() as requests
FROM api_events
WHERE workspace_id = 'ws-1'
GROUP BY hour
ORDER BY hour;
```

## ClickHouse in Node.js

```javascript
const { createClient } = require('@clickhouse/client');

const client = createClient({
  host: 'http://localhost:8123',
  database: 'default',
});

// Insert data
await client.insert({
  table: 'api_events',
  values: [
    { event_id: 'abc', timestamp: new Date(), endpoint: '/api/users', latency_ms: 50 },
    { event_id: 'def', timestamp: new Date(), endpoint: '/api/posts', latency_ms: 75 },
  ],
  format: 'JSONEachRow',
});

// Query data
const result = await client.query({
  query: `
    SELECT endpoint, count() as count, avg(latency_ms) as avg_latency
    FROM api_events
    WHERE timestamp > now() - INTERVAL 1 HOUR
    GROUP BY endpoint
  `,
  format: 'JSONEachRow',
});

const rows = await result.json();
console.log(rows);
```

## For RateGuard MVP: Skip ClickHouse

PostgreSQL is fine for thousands of events:

```javascript
// Just use PostgreSQL with good indexes
await prisma.requestLog.create({
  data: { endpoint, status, latency, timestamp: new Date() }
});

// Analytics query (fast with proper indexes)
const stats = await prisma.requestLog.groupBy({
  by: ['endpoint'],
  _count: true,
  _avg: { latency: true },
  where: { timestamp: { gte: weekAgo } }
});
```

When you hit millions of events and queries slow down, THEN add ClickHouse.

---

# SUMMARY: What to Use When

## For RateGuard MVP (Start Simple)

| Need | Use | Skip |
|------|-----|------|
| Containers | Docker ✓ | |
| Fast storage | Redis ✓ | |
| Main database | PostgreSQL ✓ | |
| Web server | Express (you know it) | Fastify |
| Rate limiting | Simple counter in Redis | Complex Lua |
| Event logging | PostgreSQL | Kafka |
| Analytics | PostgreSQL | ClickHouse |

## Later (When You Scale)

| When You Have | Then Add |
|---------------|----------|
| Complex rate limits | Lua scripts |
| Need faster server | Fastify |
| 100k+ events/day | Kafka |
| 10M+ events | ClickHouse |

---

# Your Learning Order

1. **Week 1: Docker + Redis**
   - Run containers
   - Basic Redis commands
   - Simple rate limiter

2. **Week 2: PostgreSQL + Prisma**
   - SQL basics
   - Prisma CRUD
   - Design schemas

3. **Week 3: Build MVP**
   - Express API with rate limiting
   - Store data in PostgreSQL
   - Use Redis for limits

4. **Later: Advanced**
   - Fastify (when you need speed)
   - Lua (when you need atomicity)
   - Kafka (when you need async)
   - ClickHouse (when you need analytics speed)

---

# You Don't Need to Learn Everything

Start with:
- Docker (1 day)
- Redis (2 days)
- PostgreSQL (2 days)
- Rate limiting (1 day)

That's 6 days total.

Then build something simple.

THEN learn the advanced stuff.

**Good luck!** 🚀
