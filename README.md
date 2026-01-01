# RateGuard

API Rate Limiting Gateway

## What is RateGuard?

RateGuard is a gateway that sits between your clients and your APIs to:
- **Rate limit** requests (prevent abuse)
- **Authenticate** with API keys
- **Log** all requests for analytics
- **Proxy** requests to upstream APIs

## Quick Start

```bash
# Install dependencies
npm install

# Start Docker (PostgreSQL + Redis)
npm run docker:up

# Push database schema
npm run db:push

# Start development server
npm run dev:server
```

## Project Structure

```
rateguard/
├── apps/
│   ├── server/     # Backend API (Express)
│   └── web/        # Dashboard (Next.js)
├── packages/
│   └── db/         # Database (Prisma)
└── docker/         # Docker configs
```

## Tech Stack

- **Backend:** Node.js, Nest.js, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Cache:** Redis
- **Frontend:** Next.js, React, Tailwind CSS

