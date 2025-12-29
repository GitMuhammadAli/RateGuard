# RateGuard - API Rate Limiting Dashboard

A modern API rate limiting and monitoring dashboard built with Next.js 15, TypeScript, Tailwind CSS, and Zustand for state management.

## Features

- **Dashboard Overview** - Monitor API usage and performance metrics
- **API Management** - Configure and manage upstream API configurations
- **API Keys** - Create and manage authentication keys
- **Rate Limits** - Configure flexible rate limiting rules
- **Analytics** - Detailed insights into API usage
- **Cost Tracking** - Track and manage API spending
- **Alerts** - Configure alert rules and notifications
- **Settings** - Manage workspace and preferences

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand with persist middleware
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── alerts/            # Alerts page
│   ├── analytics/         # Analytics page
│   ├── apis/              # APIs management page
│   ├── costs/             # Costs tracking page
│   ├── dashboard/         # Dashboard overview page
│   ├── keys/              # API keys page
│   ├── limits/            # Rate limits page
│   ├── login/             # Login page
│   ├── settings/          # Settings page
│   ├── signup/            # Signup page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── store/                 # Zustand stores
│   ├── alerts-store.ts
│   ├── api-keys-store.ts
│   ├── apis-store.ts
│   ├── auth-store.ts
│   ├── dashboard-store.ts
│   ├── rate-limits-store.ts
│   ├── settings-store.ts
│   └── index.ts
└── public/                # Static assets
```

## State Management

The application uses Zustand for state management with persistence. All data is stored locally and can be connected to a backend API later.

### Available Stores

- **authStore** - User authentication state
- **apisStore** - API configurations
- **apiKeysStore** - API keys management
- **rateLimitsStore** - Rate limiting rules
- **alertsStore** - Alert configurations
- **dashboardStore** - Dashboard settings and data
- **settingsStore** - Application settings

## Static Mode

All forms, inputs, and buttons work statically with Zustand, making it easy to:

1. Test the UI without a backend
2. Connect to your own backend APIs later
3. Persist data locally between sessions

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
