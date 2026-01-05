# RateGuard: Complete Build Guide - Part 2

## Phases 5-8: Dashboard, Proxy, Analytics, Deployment
## Every File. Every Line. Complete.

---

# ═══════════════════════════════════════════════════════════════
# PHASE 5: Dashboard (Next.js)
# ═══════════════════════════════════════════════════════════════

## Branch 5.1: feat/nextjs-setup

### Step 1: Create Branch

```bash
git checkout -b feat/nextjs-setup
```

### Step 2: Create Next.js App

```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When prompted:
- Would you like to use Turbopack? → No

### Step 3: Update Package Name

Edit file: `apps/web/package.json`

Change the name field:
```json
{
  "name": "@rateguard/web",
  "version": "0.1.0",
  "private": true,
  ...
}
```

### Step 4: Install Dependencies

```bash
cd web
npm install axios
```

### Step 5: Create API Client

Create file: `apps/web/src/lib/api.ts`

```typescript
import axios from 'axios';

// ================================================
// API Client Configuration
// ================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================================================
// Request Interceptor
// Automatically adds auth token to requests
// ================================================

api.interceptors.request.use((config) => {
  // Only run on client side
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ================================================
// Response Interceptor
// Handles 401 errors by redirecting to login
// ================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ================================================
// Auth API Functions
// ================================================

export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ================================================
// Workspace API Functions
// ================================================

export const workspaceApi = {
  // Workspaces
  list: async () => {
    const response = await api.get('/workspaces');
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  },

  create: async (data: { name: string; slug: string }) => {
    const response = await api.post('/workspaces', data);
    return response.data;
  },

  // API Keys
  listApiKeys: async (workspaceId: string) => {
    const response = await api.get(`/workspaces/${workspaceId}/api-keys`);
    return response.data;
  },

  createApiKey: async (workspaceId: string, data: { name: string }) => {
    const response = await api.post(`/workspaces/${workspaceId}/api-keys`, data);
    return response.data;
  },

  revokeApiKey: async (workspaceId: string, keyId: string) => {
    const response = await api.delete(`/workspaces/${workspaceId}/api-keys/${keyId}`);
    return response.data;
  },

  // Rate Limit Rules
  listRules: async (workspaceId: string) => {
    const response = await api.get(`/workspaces/${workspaceId}/rules`);
    return response.data;
  },

  createRule: async (
    workspaceId: string,
    data: { name: string; limit: number; window: number }
  ) => {
    const response = await api.post(`/workspaces/${workspaceId}/rules`, data);
    return response.data;
  },

  deleteRule: async (workspaceId: string, ruleId: string) => {
    const response = await api.delete(`/workspaces/${workspaceId}/rules/${ruleId}`);
    return response.data;
  },

  // Analytics
  getAnalytics: async (workspaceId: string, hours: number = 24) => {
    const response = await api.get(`/workspaces/${workspaceId}/analytics?hours=${hours}`);
    return response.data;
  },

  // Upstreams
  listUpstreams: async (workspaceId: string) => {
    const response = await api.get(`/workspaces/${workspaceId}/upstreams`);
    return response.data;
  },

  createUpstream: async (
    workspaceId: string,
    data: {
      name: string;
      slug: string;
      baseUrl: string;
      authHeader?: string;
      authValue?: string;
    }
  ) => {
    const response = await api.post(`/workspaces/${workspaceId}/upstreams`, data);
    return response.data;
  },

  deleteUpstream: async (workspaceId: string, upstreamId: string) => {
    const response = await api.delete(`/workspaces/${workspaceId}/upstreams/${upstreamId}`);
    return response.data;
  },
};

// ================================================
// Analytics API Functions
// ================================================

export const analyticsApi = {
  getSummary: async (workspaceId: string, hours: number = 24) => {
    const response = await api.get(`/analytics/${workspaceId}/summary?hours=${hours}`);
    return response.data;
  },

  getTimeSeries: async (workspaceId: string, hours: number = 24) => {
    const response = await api.get(`/analytics/${workspaceId}/timeseries?hours=${hours}`);
    return response.data;
  },

  getTopEndpoints: async (workspaceId: string, limit: number = 10) => {
    const response = await api.get(`/analytics/${workspaceId}/endpoints?limit=${limit}`);
    return response.data;
  },
};
```

### Step 6: Create Auth Context

Create file: `apps/web/src/lib/auth-context.tsx`

```tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

// ================================================
// Types
// ================================================

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// ================================================
// Context
// ================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ================================================
// Provider Component
// ================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        // Invalid JSON, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ================================================
// Hook
// ================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Step 7: Create Environment File

Create file: `apps/web/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 8: Update Root Layout

Replace file: `apps/web/src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RateGuard - API Rate Limiting Gateway',
  description: 'Protect your APIs with rate limiting, authentication, and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Step 9: Create Home Page

Replace file: `apps/web/src/app/page.tsx`

```tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">RateGuard</div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            API Rate Limiting
            <br />
            <span className="text-blue-500">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10">
            Protect your APIs from abuse, manage API keys, and gain insights
            with powerful analytics. All in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-gray-700 text-white text-lg font-medium rounded-lg hover:bg-gray-600 transition"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="⚡"
            title="Rate Limiting"
            description="Token bucket algorithm with Redis for high-performance rate limiting at scale."
          />
          <FeatureCard
            icon="🔑"
            title="API Keys"
            description="Secure API key management with automatic hashing and easy revocation."
          />
          <FeatureCard
            icon="📊"
            title="Analytics"
            description="Real-time insights into your API usage, errors, and performance."
          />
          <FeatureCard
            icon="🔗"
            title="Proxy"
            description="Forward requests to any upstream API with automatic auth injection."
          />
          <FeatureCard
            icon="👥"
            title="Workspaces"
            description="Organize your projects with workspaces and team member roles."
          />
          <FeatureCard
            icon="🚀"
            title="Fast"
            description="Built with performance in mind. Sub-millisecond overhead."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
```

### Step 10: Test

```bash
cd apps/web
npm run dev
```

Open http://localhost:3001 — you should see the landing page.

### Step 11: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(web): add Next.js setup

- Create Next.js app with TypeScript and Tailwind
- Add API client with axios interceptors
- Add auth context for state management
- Add landing page with features"

git checkout main
git merge feat/nextjs-setup
```

---

## Branch 5.2: feat/auth-pages

### Step 1: Create Branch

```bash
git checkout -b feat/auth-pages
```

### Step 2: Create Login Page

Create file: `apps/web/src/app/login/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login({ email, password });
      login(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-gray-900">
            RateGuard
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Step 3: Create Register Page

Create file: `apps/web/src/app/register/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.register({ name, email, password });
      login(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-gray-900">
            RateGuard
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Start protecting your APIs in minutes
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
              />
              <p className="mt-2 text-sm text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Step 4: Commit & Merge

```bash
git add .
git commit -m "feat(web): add auth pages

- Add login page with form validation
- Add register page with password requirements
- Add loading states and error handling"

git checkout main
git merge feat/auth-pages
```

---

## Branch 5.3: feat/dashboard-layout

### Step 1: Create Branch

```bash
git checkout -b feat/dashboard-layout
```

### Step 2: Create Sidebar Component

Create file: `apps/web/src/components/Sidebar.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// ================================================
// Types
// ================================================

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  workspaceId: string;
}

// ================================================
// Sidebar Component
// ================================================

export function Sidebar({ workspaceId }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Navigation items
  const navItems: NavItem[] = [
    {
      href: `/dashboard/${workspaceId}`,
      label: 'Overview',
      icon: '📊',
    },
    {
      href: `/dashboard/${workspaceId}/api-keys`,
      label: 'API Keys',
      icon: '🔑',
    },
    {
      href: `/dashboard/${workspaceId}/rules`,
      label: 'Rate Limits',
      icon: '⏱️',
    },
    {
      href: `/dashboard/${workspaceId}/upstreams`,
      label: 'Upstreams',
      icon: '🔗',
    },
    {
      href: `/dashboard/${workspaceId}/analytics`,
      label: 'Analytics',
      icon: '📈',
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="text-xl font-bold">RateGuard</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/dashboard/${workspaceId}` &&
                pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Workspace Selector */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="text-xl">🔄</span>
          <span>Switch Workspace</span>
        </Link>
      </div>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{user?.name}</div>
            <div className="text-sm text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full mt-2 flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
```

### Step 3: Create Loading Component

Create file: `apps/web/src/components/Loading.tsx`

```tsx
export function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
```

### Step 4: Create Modal Component

Create file: `apps/web/src/components/Modal.tsx`

```tsx
'use client';

import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
```

### Step 5: Create Dashboard Layout

Create file: `apps/web/src/app/dashboard/[workspaceId]/layout.tsx`

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const workspaceId = params.workspaceId as string;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar workspaceId={workspaceId} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
```

### Step 6: Create Workspace Selection Page

Create file: `apps/web/src/app/dashboard/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { workspaceApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Modal } from '@/components/Modal';
import { Loading } from '@/components/Loading';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadWorkspaces();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadWorkspaces = async () => {
    try {
      const data = await workspaceApi.list();
      setWorkspaces(data);

      // Auto-redirect if only one workspace
      if (data.length === 1) {
        router.push(`/dashboard/${data[0].id}`);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const workspace = await workspaceApi.create({ name, slug });
      router.push(`/dashboard/${workspace.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create workspace');
      setCreating(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading message="Loading workspaces..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Workspaces</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Workspace
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-xl font-semibold mb-2">No workspaces yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first workspace to get started with RateGuard
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => router.push(`/dashboard/${ws.id}`)}
                className="bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold group-hover:text-blue-600 transition">
                      {ws.name}
                    </h2>
                    <p className="text-gray-500 mt-1">{ws.slug}</p>
                  </div>
                  {ws.role && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      {ws.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create Workspace"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="My Project"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                placeholder="my-project"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                URL-friendly identifier for your workspace
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
```

### Step 7: Create Workspace Overview Page

Create file: `apps/web/src/app/dashboard/[workspaceId]/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { workspaceApi } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface Stats {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  avgLatencyMs: number;
}

export default function WorkspaceOverview() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [stats, setStats] = useState<Stats | null>(null);
  const [apiKeyCount, setApiKeyCount] = useState(0);
  const [ruleCount, setRuleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      const [analyticsData, keysData, rulesData] = await Promise.all([
        workspaceApi.getAnalytics(workspaceId),
        workspaceApi.listApiKeys(workspaceId),
        workspaceApi.listRules(workspaceId),
      ]);

      setStats(analyticsData);
      setApiKeyCount(keysData.filter((k: any) => k.isActive).length);
      setRuleCount(rulesData.length);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  const successRate =
    stats?.totalRequests && stats.totalRequests > 0
      ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
      : 100;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon="📊"
          label="Total Requests"
          value={stats?.totalRequests || 0}
          subtitle="Last 24 hours"
        />
        <StatCard
          icon="✅"
          label="Success Rate"
          value={`${successRate}%`}
          subtitle={`${stats?.rateLimitedRequests || 0} rate limited`}
          status={successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'error'}
        />
        <StatCard
          icon="⚡"
          label="Avg Latency"
          value={`${stats?.avgLatencyMs || 0}ms`}
          subtitle="Response time"
        />
        <StatCard
          icon="🔑"
          label="Active Keys"
          value={apiKeyCount}
          subtitle={`${ruleCount} rate limit rules`}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            href={`/dashboard/${workspaceId}/api-keys`}
            icon="🔑"
            title="Create API Key"
            description="Generate a new API key for your application"
          />
          <QuickActionCard
            href={`/dashboard/${workspaceId}/rules`}
            icon="⏱️"
            title="Configure Rate Limits"
            description="Set up rate limiting rules for your API"
          />
          <QuickActionCard
            href={`/dashboard/${workspaceId}/upstreams`}
            icon="🔗"
            title="Add Upstream"
            description="Connect an external API to proxy requests"
          />
        </div>
      </div>

      {/* Usage Example */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
        <p className="text-gray-600 mb-4">
          Use your API key to make rate-limited requests:
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`curl -X GET "http://localhost:3000/v1/openai/chat/completions" \\
  -H "X-API-Key: rg_live_your_api_key_here" \\
  -H "Content-Type: application/json"`}</pre>
        </div>
      </div>
    </div>
  );
}

// ================================================
// Stat Card Component
// ================================================

function StatCard({
  icon,
  label,
  value,
  subtitle,
  status = 'default',
}: {
  icon: string;
  label: string;
  value: string | number;
  subtitle: string;
  status?: 'default' | 'success' | 'warning' | 'error';
}) {
  const statusColors = {
    default: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-gray-600 font-medium">{label}</span>
      </div>
      <div className={`text-4xl font-bold ${statusColors[status]}`}>{value}</div>
      <div className="text-gray-500 text-sm mt-1">{subtitle}</div>
    </div>
  );
}

// ================================================
// Quick Action Card Component
// ================================================

function QuickActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-semibold group-hover:text-blue-600 transition">
          {title}
        </div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </Link>
  );
}
```

### Step 8: Commit & Merge

```bash
git add .
git commit -m "feat(web): add dashboard layout

- Add sidebar navigation component
- Add loading and modal components
- Add workspace selection page
- Add workspace overview with stats"

git checkout main
git merge feat/dashboard-layout
```

---

## Branch 5.4: feat/api-keys-page

### Step 1: Create Branch

```bash
git checkout -b feat/api-keys-page
```

### Step 2: Create API Keys Page

Create file: `apps/web/src/app/dashboard/[workspaceId]/api-keys/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { workspaceApi } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Loading } from '@/components/Loading';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, [workspaceId]);

  const loadKeys = async () => {
    try {
      const data = await workspaceApi.listApiKeys(workspaceId);
      setKeys(data);
    } catch (error) {
      console.error('Failed to load keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const data = await workspaceApi.createApiKey(workspaceId, {
        name: newKeyName,
      });
      setCreatedKey(data.key);
      setNewKeyName('');
      loadKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string, keyName: string) => {
    if (
      !confirm(
        `Are you sure you want to revoke "${keyName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await workspaceApi.revokeApiKey(workspaceId, keyId);
      loadKeys();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to revoke key');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setCreatedKey(null);
    setNewKeyName('');
    setError('');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-gray-600 mt-1">
            Manage API keys for authenticating requests
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span>
          <span>Create Key</span>
        </button>
      </div>

      {/* Create / Created Key Modal */}
      <Modal
        isOpen={showCreate}
        onClose={closeCreateModal}
        title={createdKey ? '🔑 API Key Created' : 'Create API Key'}
        size={createdKey ? 'lg' : 'md'}
      >
        {createdKey ? (
          <div>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-6">
              <div className="font-semibold mb-1">⚠️ Important</div>
              <div className="text-sm">
                Copy this key now! For security reasons, it will not be shown
                again.
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your API Key
              </label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-100 p-4 rounded-lg font-mono text-sm break-all">
                  {createdKey}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(createdKey)}
                className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {copied ? (
                  <>
                    <span>✓</span>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
              <button
                onClick={closeCreateModal}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Production, Development, etc."
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                A descriptive name to help you identify this key
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Keys Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Key
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Last Used
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Created
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {keys.map((key) => (
              <tr key={key.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium">{key.name}</span>
                </td>
                <td className="px-6 py-4">
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {key.keyPrefix}
                  </code>
                </td>
                <td className="px-6 py-4">
                  {key.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Revoked
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  {key.isActive && (
                    <button
                      onClick={() => handleRevoke(key.id, key.name)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {keys.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No API keys yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first API key to start making requests
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create API Key
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Commit & Merge

```bash
git add .
git commit -m "feat(web): add API keys page

- Add key creation with secure display
- Add copy to clipboard functionality
- Add key listing with status
- Add key revocation with confirmation"

git checkout main
git merge feat/api-keys-page
```

---

## Branch 5.5: feat/rules-page

### Step 1: Create Branch

```bash
git checkout -b feat/rules-page
```

### Step 2: Create Rules Page

Create file: `apps/web/src/app/dashboard/[workspaceId]/rules/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { workspaceApi } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Loading } from '@/components/Loading';

interface Rule {
  id: string;
  name: string;
  algorithm: string;
  limit: number;
  window: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

export default function RulesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    limit: 100,
    window: 60,
  });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRules();
  }, [workspaceId]);

  const loadRules = async () => {
    try {
      const data = await workspaceApi.listRules(workspaceId);
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      await workspaceApi.createRule(workspaceId, form);
      setShowCreate(false);
      setForm({ name: '', limit: 100, window: 60 });
      loadRules();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create rule');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Delete rate limit rule "${ruleName}"?`)) {
      return;
    }

    try {
      await workspaceApi.deleteRule(workspaceId, ruleId);
      loadRules();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete rule');
    }
  };

  const closeModal = () => {
    setShowCreate(false);
    setForm({ name: '', limit: 100, window: 60 });
    setError('');
  };

  const formatWindow = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    return `${Math.round(seconds / 3600)} hours`;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Rate Limit Rules</h1>
          <p className="text-gray-600 mt-1">
            Configure how many requests are allowed per time window
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span>
          <span>Create Rule</span>
        </button>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={closeModal} title="Create Rate Limit Rule">
        <form onSubmit={handleCreate}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Default, Premium, Free Tier, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Limit
              </label>
              <input
                type="number"
                value={form.limit}
                onChange={(e) =>
                  setForm({ ...form, limit: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min={1}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum number of requests allowed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Window (seconds)
              </label>
              <input
                type="number"
                value={form.window}
                onChange={(e) =>
                  setForm({ ...form, window: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min={1}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Time period in seconds (60 = 1 minute, 3600 = 1 hour)
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>{form.limit}</strong> requests per{' '}
                <strong>{formatWindow(form.window)}</strong>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                ≈ {(form.limit / form.window).toFixed(2)} requests per second
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Rule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow text-center">
          <div className="text-4xl mb-4">⏱️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No rate limit rules yet
          </h3>
          <p className="text-gray-600 mb-4">
            Without rules, the default limit of 100 requests per 60 seconds
            applies.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Rule
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{rule.name}</h3>
                    {rule.isActive && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-6 text-gray-600">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {rule.limit}
                      </span>{' '}
                      requests
                    </div>
                    <div>
                      per{' '}
                      <span className="font-semibold text-gray-900">
                        {formatWindow(rule.window)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      Algorithm:{' '}
                      {rule.algorithm.replace('_', ' ').toLowerCase()}
                    </span>
                    <span>Priority: {rule.priority}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(rule.id, rule.name)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">
          💡 How Rate Limiting Works
        </h4>
        <p className="text-blue-800 text-sm">
          RateGuard uses the <strong>Token Bucket</strong> algorithm, which
          allows short bursts of traffic while maintaining an average rate. This
          provides a better user experience than strict fixed-window limiting.
        </p>
      </div>
    </div>
  );
}
```

### Step 3: Commit & Merge

```bash
git add .
git commit -m "feat(web): add rate limit rules page

- Add rule creation with preview
- Add rule listing with details
- Add rule deletion
- Add algorithm info"

git checkout main
git merge feat/rules-page
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 6: Real Proxy
# ═══════════════════════════════════════════════════════════════

## Branch 6.1: feat/upstream-config

### Step 1: Create Branch

```bash
git checkout -b feat/upstream-config
```

### Step 2: Create Upstream Service

Create file: `apps/server/src/services/upstream.service.ts`

```typescript
import { prisma, Upstream } from '@rateguard/db';

// ================================================
// Upstream Service
// ================================================

class UpstreamService {
  /**
   * Create a new upstream configuration
   */
  async create(
    workspaceId: string,
    data: {
      name: string;
      slug: string;
      baseUrl: string;
      authHeader?: string;
      authValue?: string;
    }
  ): Promise<Upstream> {
    // Validate URL
    try {
      new URL(data.baseUrl);
    } catch {
      throw new Error('Invalid base URL');
    }

    // Ensure slug is lowercase and URL-safe
    const slug = data.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-|-$/g, '');

    return prisma.upstream.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        slug,
        baseUrl: data.baseUrl.replace(/\/$/, ''), // Remove trailing slash
        authHeader: data.authHeader?.trim() || null,
        authValue: data.authValue || null,
      },
    });
  }

  /**
   * List all upstreams for a workspace
   */
  async listByWorkspace(workspaceId: string): Promise<Upstream[]> {
    return prisma.upstream.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get upstream by slug
   */
  async getBySlug(workspaceId: string, slug: string): Promise<Upstream | null> {
    return prisma.upstream.findUnique({
      where: {
        workspaceId_slug: { workspaceId, slug },
      },
    });
  }

  /**
   * Get upstream by ID
   */
  async getById(id: string, workspaceId: string): Promise<Upstream | null> {
    return prisma.upstream.findFirst({
      where: { id, workspaceId },
    });
  }

  /**
   * Update upstream
   */
  async update(
    id: string,
    workspaceId: string,
    data: {
      name?: string;
      baseUrl?: string;
      authHeader?: string;
      authValue?: string;
      isActive?: boolean;
    }
  ): Promise<Upstream> {
    return prisma.upstream.update({
      where: { id, workspaceId },
      data: {
        name: data.name?.trim(),
        baseUrl: data.baseUrl?.replace(/\/$/, ''),
        authHeader: data.authHeader?.trim(),
        authValue: data.authValue,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Delete upstream
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    await prisma.upstream.delete({
      where: { id, workspaceId },
    });
  }
}

export const upstreamService = new UpstreamService();
```

### Step 3: Add Upstream Routes to Workspace Routes

Update file: `apps/server/src/routes/workspace.routes.ts`

Add at the top with other imports:
```typescript
import { upstreamService } from '../services/upstream.service';
```

Add these routes at the end (before the export):

```typescript
// ================================================
// UPSTREAMS
// ================================================

// POST /workspaces/:id/upstreams - Create upstream
router.post('/:id/upstreams', async (req: Request, res: Response) => {
  try {
    const { name, slug, baseUrl, authHeader, authValue } = req.body;

    if (!name || !slug || !baseUrl) {
      return res.status(400).json({
        error: 'Missing required fields: name, slug, baseUrl',
      });
    }

    const workspace = await workspaceService.getByIdWithAccess(
      req.params.id,
      req.userId!
    );

    if (!workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const upstream = await upstreamService.create(workspace.id, {
      name,
      slug,
      baseUrl,
      authHeader,
      authValue,
    });

    res.status(201).json(upstream);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /workspaces/:id/upstreams - List upstreams
router.get('/:id/upstreams', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.id,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const upstreams = await upstreamService.listByWorkspace(workspace.id);

  // Hide auth values for security
  const safeUpstreams = upstreams.map((u) => ({
    ...u,
    authValue: u.authValue ? '********' : null,
  }));

  res.json(safeUpstreams);
});

// DELETE /workspaces/:id/upstreams/:upstreamId - Delete upstream
router.delete('/:id/upstreams/:upstreamId', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.id,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await upstreamService.delete(req.params.upstreamId, workspace.id);
  res.json({ message: 'Upstream deleted' });
});
```

### Step 4: Commit & Merge

```bash
git add .
git commit -m "feat(upstream): add upstream configuration service

- Add upstream CRUD operations
- Add routes for managing upstreams
- Hide auth values in API responses"

git checkout main
git merge feat/upstream-config
```

---

## Branch 6.2: feat/proxy-forward

### Step 1: Create Branch

```bash
git checkout -b feat/proxy-forward
```

### Step 2: Install Node Fetch

```bash
cd apps/server
npm install node-fetch@2
npm install -D @types/node-fetch
```

### Step 3: Update Proxy Routes

Replace file: `apps/server/src/routes/proxy.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import fetch, { Response as FetchResponse } from 'node-fetch';
import { prisma } from '@rateguard/db';
import { apiKeyService } from '../services/api-key.service';
import { rateLimitService } from '../services/rate-limit.service';
import { upstreamService } from '../services/upstream.service';

const router = Router();

// ================================================
// Helper: Log Request
// ================================================

async function logRequest(
  apiKeyId: string,
  upstreamId: string | null,
  method: string,
  path: string,
  statusCode: number,
  latencyMs: number,
  rateLimited: boolean
): Promise<void> {
  try {
    await prisma.requestLog.create({
      data: {
        apiKeyId,
        upstreamId,
        method,
        path,
        statusCode,
        latencyMs,
        rateLimited,
      },
    });
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}

// ================================================
// Helper: Set Rate Limit Headers
// ================================================

function setRateLimitHeaders(
  res: Response,
  rateLimit: { limit: number; remaining: number; resetInMs: number }
): void {
  res.set({
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(
      Math.ceil(Date.now() / 1000 + rateLimit.resetInMs / 1000)
    ),
  });
}

// ================================================
// Main Proxy Route: /v1/:upstream/*
// ================================================

router.all('/:upstream/*', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const upstreamSlug = req.params.upstream;
  const path = req.params[0] || '';
  const method = req.method;

  // 1. Validate API Key
  const apiKeyHeader = req.headers['x-api-key'] as string;

  if (!apiKeyHeader) {
    return res.status(401).json({
      error: 'Missing X-API-Key header',
      hint: 'Include your API key in the X-API-Key header',
    });
  }

  const apiKey = await apiKeyService.validate(apiKeyHeader);

  if (!apiKey) {
    return res.status(401).json({
      error: 'Invalid API key',
      hint: 'Check that your API key is correct and active',
    });
  }

  // 2. Get Upstream Configuration
  const upstream = await upstreamService.getBySlug(
    apiKey.workspaceId,
    upstreamSlug
  );

  if (!upstream) {
    return res.status(404).json({
      error: `Upstream '${upstreamSlug}' not found`,
      hint: 'Configure this upstream in your dashboard',
    });
  }

  if (!upstream.isActive) {
    return res.status(403).json({
      error: 'Upstream is disabled',
    });
  }

  // 3. Check Rate Limit
  const rateLimit = await rateLimitService.check(apiKey.id, apiKey.workspaceId);
  setRateLimitHeaders(res, rateLimit);

  if (!rateLimit.allowed) {
    const latency = Date.now() - startTime;
    await logRequest(apiKey.id, upstream.id, method, '/' + path, 429, latency, true);

    res.set('Retry-After', String(Math.ceil(rateLimit.resetInMs / 1000)));

    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit: rateLimit.limit,
      remaining: 0,
      retryAfter: Math.ceil(rateLimit.resetInMs / 1000),
    });
  }

  // 4. Forward Request to Upstream
  try {
    const upstreamUrl = `${upstream.baseUrl}/${path}`;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Accept': req.headers['accept'] || 'application/json',
      'User-Agent': 'RateGuard/1.0',
    };

    // Add upstream authentication
    if (upstream.authHeader && upstream.authValue) {
      headers[upstream.authHeader] = upstream.authValue;
    }

    // Forward query string
    const queryString = new URL(req.url, 'http://localhost').search;
    const fullUrl = upstreamUrl + queryString;

    // Make request
    const upstreamResponse = await fetch(fullUrl, {
      method,
      headers,
      body: ['GET', 'HEAD'].includes(method)
        ? undefined
        : JSON.stringify(req.body),
    });

    const latency = Date.now() - startTime;

    // Parse response
    const contentType = upstreamResponse.headers.get('content-type') || '';
    let responseData: any;

    if (contentType.includes('application/json')) {
      try {
        responseData = await upstreamResponse.json();
      } catch {
        responseData = { raw: await upstreamResponse.text() };
      }
    } else {
      responseData = { raw: await upstreamResponse.text() };
    }

    // Log request
    await logRequest(
      apiKey.id,
      upstream.id,
      method,
      '/' + path,
      upstreamResponse.status,
      latency,
      false
    );

    // Add latency header
    res.set('X-Upstream-Latency', String(latency));

    // Forward response
    res.status(upstreamResponse.status).json(responseData);

  } catch (error: any) {
    const latency = Date.now() - startTime;

    await logRequest(apiKey.id, upstream.id, method, '/' + path, 502, latency, false);

    console.error('Upstream request failed:', error.message);

    res.status(502).json({
      error: 'Failed to reach upstream',
      message: error.message,
      upstream: upstreamSlug,
    });
  }
});

// ================================================
// Fallback Route: /v1/* (no upstream specified)
// ================================================

router.all('/*', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const path = req.path;
  const method = req.method;

  // Validate API Key
  const apiKeyHeader = req.headers['x-api-key'] as string;

  if (!apiKeyHeader) {
    return res.status(401).json({
      error: 'Missing X-API-Key header',
    });
  }

  const apiKey = await apiKeyService.validate(apiKeyHeader);

  if (!apiKey) {
    return res.status(401).json({
      error: 'Invalid API key',
    });
  }

  // Check Rate Limit
  const rateLimit = await rateLimitService.check(apiKey.id, apiKey.workspaceId);
  setRateLimitHeaders(res, rateLimit);

  if (!rateLimit.allowed) {
    const latency = Date.now() - startTime;
    await logRequest(apiKey.id, null, method, path, 429, latency, true);

    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(rateLimit.resetInMs / 1000),
    });
  }

  // Log request
  const latency = Date.now() - startTime;
  await logRequest(apiKey.id, null, method, path, 200, latency, false);

  // Return info about how to use the proxy
  res.json({
    success: true,
    message: 'No upstream specified',
    hint: 'Use /v1/{upstream-slug}/path to proxy to a configured upstream',
    method,
    path,
    rateLimit: {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
    },
  });
});

export { router as proxyRoutes };
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(proxy): add request forwarding to upstream APIs

- Add upstream routing with slug-based lookup
- Add request forwarding with node-fetch
- Add auth header injection for upstream APIs
- Add query string forwarding
- Add detailed error responses"

git checkout main
git merge feat/proxy-forward
```

---

## Branch 6.3: feat/upstreams-page

### Step 1: Create Branch

```bash
git checkout -b feat/upstreams-page
```

### Step 2: Create Upstreams Page

Create file: `apps/web/src/app/dashboard/[workspaceId]/upstreams/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { workspaceApi } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Loading } from '@/components/Loading';

interface Upstream {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  authHeader: string | null;
  authValue: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function UpstreamsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [upstreams, setUpstreams] = useState<Upstream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    baseUrl: '',
    authHeader: '',
    authValue: '',
  });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUpstreams();
  }, [workspaceId]);

  const loadUpstreams = async () => {
    try {
      const data = await workspaceApi.listUpstreams(workspaceId);
      setUpstreams(data);
    } catch (error) {
      console.error('Failed to load upstreams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    setForm({
      ...form,
      name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      await workspaceApi.createUpstream(workspaceId, {
        name: form.name,
        slug: form.slug,
        baseUrl: form.baseUrl,
        authHeader: form.authHeader || undefined,
        authValue: form.authValue || undefined,
      });
      closeModal();
      loadUpstreams();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create upstream');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (upstreamId: string, upstreamName: string) => {
    if (!confirm(`Delete upstream "${upstreamName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await workspaceApi.deleteUpstream(workspaceId, upstreamId);
      loadUpstreams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete upstream');
    }
  };

  const closeModal = () => {
    setShowCreate(false);
    setForm({ name: '', slug: '', baseUrl: '', authHeader: '', authValue: '' });
    setError('');
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Upstreams</h1>
          <p className="text-gray-600 mt-1">
            Configure external APIs to proxy requests to
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span>
          <span>Add Upstream</span>
        </button>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={closeModal} title="Add Upstream API" size="lg">
        <form onSubmit={handleCreate}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="OpenAI, Anthropic, Stripe, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                placeholder="openai"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Endpoint: <code>/v1/{form.slug || 'slug'}/*</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <input
                type="url"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://api.openai.com/v1"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                The base URL of the upstream API (without trailing slash)
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Authentication (Optional)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Name
                  </label>
                  <input
                    type="text"
                    value={form.authHeader}
                    onChange={(e) => setForm({ ...form, authHeader: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Authorization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Value
                  </label>
                  <input
                    type="password"
                    value={form.authValue}
                    onChange={(e) => setForm({ ...form, authValue: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Bearer sk-..."
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                RateGuard will inject this header when forwarding requests to the
                upstream API
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Add Upstream'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upstreams List */}
      {upstreams.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No upstreams configured
          </h3>
          <p className="text-gray-600 mb-4">
            Add an upstream to start proxying requests to external APIs
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Upstream
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {upstreams.map((upstream) => (
            <div
              key={upstream.id}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{upstream.name}</h3>
                    {upstream.isActive ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-gray-600">
                      <span className="text-gray-400">Base URL:</span>{' '}
                      <code className="text-sm">{upstream.baseUrl}</code>
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-400">Endpoint:</span>{' '}
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                        /v1/{upstream.slug}/*
                      </code>
                    </p>
                    {upstream.authHeader && (
                      <p className="text-gray-600">
                        <span className="text-gray-400">Auth:</span>{' '}
                        <code className="text-sm">
                          {upstream.authHeader}: ********
                        </code>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(upstream.id, upstream.name)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Example */}
      {upstreams.length > 0 && (
        <div className="mt-8 p-4 bg-gray-900 rounded-lg">
          <h4 className="text-gray-400 text-sm font-medium mb-3">
            Example Request
          </h4>
          <code className="text-green-400 text-sm">
            curl -X POST "http://localhost:3000/v1/{upstreams[0].slug}/chat/completions" \
            <br />
            &nbsp;&nbsp;-H "X-API-Key: rg_live_your_key" \
            <br />
            &nbsp;&nbsp;-H "Content-Type: application/json" \
            <br />
            &nbsp;&nbsp;-d '{`{"model": "gpt-4", "messages": [...]}`}'
          </code>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Commit & Merge

```bash
git add .
git commit -m "feat(web): add upstreams management page

- Add upstream creation form
- Add upstream listing
- Add upstream deletion
- Add usage example"

git checkout main
git merge feat/upstreams-page
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 7: Analytics
# ═══════════════════════════════════════════════════════════════

## Branch 7.1: feat/analytics-service

### Step 1: Create Branch

```bash
git checkout -b feat/analytics-service
```

### Step 2: Create Analytics Service

Create file: `apps/server/src/services/analytics.service.ts`

```typescript
import { prisma } from '@rateguard/db';

// ================================================
// Types
// ================================================

interface AnalyticsSummary {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  errorRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

interface TimeSeriesPoint {
  timestamp: string;
  requests: number;
  errors: number;
  rateLimited: number;
  avgLatency: number;
}

interface TopEndpoint {
  path: string;
  method: string;
  count: number;
  avgLatency: number;
  errorRate: number;
}

// ================================================
// Analytics Service
// ================================================

class AnalyticsService {
  /**
   * Get summary statistics for a workspace
   */
  async getSummary(workspaceId: string, hours: number = 24): Promise<AnalyticsSummary> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get API keys for this workspace
    const apiKeys = await prisma.apiKey.findMany({
      where: { workspaceId },
      select: { id: true },
    });

    const apiKeyIds = apiKeys.map((k) => k.id);

    if (apiKeyIds.length === 0) {
      return this.emptySummary();
    }

    // Run all queries in parallel
    const [total, successful, rateLimited, latencyStats, p95Data] = await Promise.all([
      // Total requests
      prisma.requestLog.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          createdAt: { gte: since },
        },
      }),

      // Successful requests (2xx, 3xx)
      prisma.requestLog.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          createdAt: { gte: since },
          statusCode: { lt: 400 },
        },
      }),

      // Rate limited requests
      prisma.requestLog.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          createdAt: { gte: since },
          rateLimited: true,
        },
      }),

      // Average latency
      prisma.requestLog.aggregate({
        where: {
          apiKeyId: { in: apiKeyIds },
          createdAt: { gte: since },
        },
        _avg: { latencyMs: true },
      }),

      // P95 latency (approximate)
      this.getP95Latency(apiKeyIds, since),
    ]);

    return {
      totalRequests: total,
      successfulRequests: successful,
      rateLimitedRequests: rateLimited,
      errorRequests: total - successful,
      avgLatencyMs: Math.round(latencyStats._avg.latencyMs || 0),
      p95LatencyMs: p95Data,
    };
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(
    workspaceId: string,
    hours: number = 24,
    bucketMinutes: number = 60
  ): Promise<TimeSeriesPoint[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const apiKeys = await prisma.apiKey.findMany({
      where: { workspaceId },
      select: { id: true },
    });

    const apiKeyIds = apiKeys.map((k) => k.id);

    if (apiKeyIds.length === 0) {
      return [];
    }

    // Get all logs
    const logs = await prisma.requestLog.findMany({
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        statusCode: true,
        latencyMs: true,
        rateLimited: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Bucket the data
    const bucketMs = bucketMinutes * 60 * 1000;
    const buckets = new Map<
      string,
      {
        requests: number;
        errors: number;
        rateLimited: number;
        totalLatency: number;
      }
    >();

    for (const log of logs) {
      const bucketTime = new Date(
        Math.floor(log.createdAt.getTime() / bucketMs) * bucketMs
      );
      const key = bucketTime.toISOString();

      if (!buckets.has(key)) {
        buckets.set(key, {
          requests: 0,
          errors: 0,
          rateLimited: 0,
          totalLatency: 0,
        });
      }

      const bucket = buckets.get(key)!;
      bucket.requests++;
      if (log.statusCode >= 400) bucket.errors++;
      if (log.rateLimited) bucket.rateLimited++;
      bucket.totalLatency += log.latencyMs;
    }

    // Convert to array
    return Array.from(buckets.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        requests: data.requests,
        errors: data.errors,
        rateLimited: data.rateLimited,
        avgLatency: Math.round(data.totalLatency / data.requests),
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Get top endpoints by request count
   */
  async getTopEndpoints(
    workspaceId: string,
    limit: number = 10
  ): Promise<TopEndpoint[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const apiKeys = await prisma.apiKey.findMany({
      where: { workspaceId },
      select: { id: true },
    });

    const apiKeyIds = apiKeys.map((k) => k.id);

    if (apiKeyIds.length === 0) {
      return [];
    }

    // Group by path and method
    const grouped = await prisma.requestLog.groupBy({
      by: ['path', 'method'],
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { gte: since },
      },
      _count: { id: true },
      _avg: { latencyMs: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    // Get error counts for each endpoint
    const results: TopEndpoint[] = [];

    for (const group of grouped) {
      const errorCount = await prisma.requestLog.count({
        where: {
          apiKeyId: { in: apiKeyIds },
          createdAt: { gte: since },
          path: group.path,
          method: group.method,
          statusCode: { gte: 400 },
        },
      });

      results.push({
        path: group.path,
        method: group.method,
        count: group._count.id,
        avgLatency: Math.round(group._avg.latencyMs || 0),
        errorRate: Math.round((errorCount / group._count.id) * 100),
      });
    }

    return results;
  }

  // ================================================
  // Private Helpers
  // ================================================

  private emptySummary(): AnalyticsSummary {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitedRequests: 0,
      errorRequests: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
    };
  }

  private async getP95Latency(apiKeyIds: string[], since: Date): Promise<number> {
    const count = await prisma.requestLog.count({
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { gte: since },
      },
    });

    if (count === 0) return 0;

    const p95Index = Math.floor(count * 0.95);

    const p95Record = await prisma.requestLog.findMany({
      where: {
        apiKeyId: { in: apiKeyIds },
        createdAt: { gte: since },
      },
      orderBy: { latencyMs: 'asc' },
      skip: Math.max(0, p95Index - 1),
      take: 1,
      select: { latencyMs: true },
    });

    return p95Record[0]?.latencyMs || 0;
  }
}

export const analyticsService = new AnalyticsService();
```

### Step 3: Commit & Merge

```bash
git add .
git commit -m "feat(analytics): add analytics service

- Add summary statistics (total, success, errors, latency)
- Add time series data for charts
- Add top endpoints by request count
- Add P95 latency calculation"

git checkout main
git merge feat/analytics-service
```

---

## Branch 7.2: feat/analytics-routes

### Step 1: Create Branch

```bash
git checkout -b feat/analytics-routes
```

### Step 2: Create Analytics Routes

Create file: `apps/server/src/routes/analytics.routes.ts`

```typescript
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { workspaceService } from '../services/workspace.service';
import { analyticsService } from '../services/analytics.service';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

// ================================================
// GET /analytics/:workspaceId/summary
// ================================================

router.get('/:workspaceId/summary', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.workspaceId,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const hours = Math.min(Number(req.query.hours) || 24, 168); // Max 7 days
  const summary = await analyticsService.getSummary(workspace.id, hours);

  res.json(summary);
});

// ================================================
// GET /analytics/:workspaceId/timeseries
// ================================================

router.get('/:workspaceId/timeseries', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.workspaceId,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const hours = Math.min(Number(req.query.hours) || 24, 168);

  // Adjust bucket size based on time range
  let bucketMinutes = 60; // 1 hour buckets by default
  if (hours <= 6) bucketMinutes = 10;
  else if (hours <= 24) bucketMinutes = 30;
  else if (hours <= 72) bucketMinutes = 60;
  else bucketMinutes = 360; // 6 hour buckets for week view

  const data = await analyticsService.getTimeSeries(workspace.id, hours, bucketMinutes);

  res.json(data);
});

// ================================================
// GET /analytics/:workspaceId/endpoints
// ================================================

router.get('/:workspaceId/endpoints', async (req: Request, res: Response) => {
  const workspace = await workspaceService.getByIdWithAccess(
    req.params.workspaceId,
    req.userId!
  );

  if (!workspace) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const data = await analyticsService.getTopEndpoints(workspace.id, limit);

  res.json(data);
});

export { router as analyticsRoutes };
```

### Step 3: Update Server to Include Analytics Routes

Update file: `apps/server/src/server.ts`

Add import:
```typescript
import { analyticsRoutes } from './routes/analytics.routes';
```

Add route:
```typescript
app.use('/analytics', analyticsRoutes);
```

### Step 4: Commit & Merge

```bash
git add .
git commit -m "feat(analytics): add analytics API routes

- Add summary endpoint
- Add time series endpoint
- Add top endpoints endpoint
- Add dynamic bucket sizing"

git checkout main
git merge feat/analytics-routes
```

---

## Branch 7.3: feat/analytics-dashboard

### Step 1: Create Branch

```bash
git checkout -b feat/analytics-dashboard
```

### Step 2: Install Recharts

```bash
cd apps/web
npm install recharts
```

### Step 3: Create Analytics Page

Create file: `apps/web/src/app/dashboard/[workspaceId]/analytics/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { analyticsApi } from '@/lib/api';
import { Loading } from '@/components/Loading';

interface Summary {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  errorRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

interface TimeSeriesPoint {
  timestamp: string;
  requests: number;
  errors: number;
  rateLimited: number;
  avgLatency: number;
}

interface TopEndpoint {
  path: string;
  method: string;
  count: number;
  avgLatency: number;
  errorRate: number;
}

export default function AnalyticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [endpoints, setEndpoints] = useState<TopEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);

  useEffect(() => {
    loadData();
  }, [workspaceId, hours]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, timeSeriesData, endpointsData] = await Promise.all([
        analyticsApi.getSummary(workspaceId, hours),
        analyticsApi.getTimeSeries(workspaceId, hours),
        analyticsApi.getTopEndpoints(workspaceId, 10),
      ]);

      setSummary(summaryData);
      setTimeSeries(timeSeriesData);
      setEndpoints(endpointsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (hours <= 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <Loading />;
  }

  const successRate =
    summary && summary.totalRequests > 0
      ? Math.round((summary.successfulRequests / summary.totalRequests) * 100)
      : 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Monitor your API performance and usage
          </p>
        </div>

        <select
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value={1}>Last hour</option>
          <option value={6}>Last 6 hours</option>
          <option value={24}>Last 24 hours</option>
          <option value={72}>Last 3 days</option>
          <option value={168}>Last 7 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Total Requests"
          value={summary?.totalRequests.toLocaleString() || '0'}
          icon="📊"
        />
        <SummaryCard
          label="Success Rate"
          value={`${successRate}%`}
          icon="✅"
          status={successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'error'}
        />
        <SummaryCard
          label="Avg Latency"
          value={`${summary?.avgLatencyMs || 0}ms`}
          icon="⚡"
        />
        <SummaryCard
          label="P95 Latency"
          value={`${summary?.p95LatencyMs || 0}ms`}
          icon="📈"
        />
      </div>

      {/* Request Rate Chart */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Request Volume</h2>
        {timeSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="requests"
                name="Requests"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="errors"
                name="Errors"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="rateLimited"
                name="Rate Limited"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No data available for this time period
          </div>
        )}
      </div>

      {/* Latency Chart */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Response Latency</h2>
        {timeSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis stroke="#9ca3af" fontSize={12} unit="ms" />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="avgLatency"
                name="Avg Latency (ms)"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            No data available for this time period
          </div>
        )}
      </div>

      {/* Top Endpoints */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Top Endpoints</h2>
        {endpoints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium text-gray-600">Endpoint</th>
                  <th className="pb-3 font-medium text-gray-600 text-right">Requests</th>
                  <th className="pb-3 font-medium text-gray-600 text-right">Avg Latency</th>
                  <th className="pb-3 font-medium text-gray-600 text-right">Error Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {endpoints.map((endpoint, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded mr-2">
                        {endpoint.method}
                      </span>
                      <code className="text-sm">{endpoint.path}</code>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {endpoint.count.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      {endpoint.avgLatency}ms
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`${
                          endpoint.errorRate > 10
                            ? 'text-red-600'
                            : endpoint.errorRate > 5
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {endpoint.errorRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No endpoint data available
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================
// Summary Card Component
// ================================================

function SummaryCard({
  label,
  value,
  icon,
  status = 'default',
}: {
  label: string;
  value: string;
  icon: string;
  status?: 'default' | 'success' | 'warning' | 'error';
}) {
  const statusColors = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex items-center gap-2 text-gray-600 mb-2">
        <span>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${statusColors[status]}`}>{value}</div>
    </div>
  );
}
```

### Step 4: Commit & Merge

```bash
cd ../..
git add .
git commit -m "feat(web): add analytics dashboard

- Add summary cards with key metrics
- Add request volume chart with area chart
- Add latency chart with line chart
- Add top endpoints table"

git checkout main
git merge feat/analytics-dashboard
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 8: Deployment
# ═══════════════════════════════════════════════════════════════

## Branch 8.1: feat/docker-production

### Step 1: Create Branch

```bash
git checkout -b feat/docker-production
```

### Step 2: Create Server Dockerfile

Create file: `apps/server/Dockerfile`

```dockerfile
# ================================================
# RateGuard Server - Production Dockerfile
# ================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/db/package*.json ./packages/db/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/db ./packages/db
COPY apps/server ./apps/server

# Generate Prisma client
RUN cd packages/db && npx prisma generate

# Build packages
RUN npm run build --workspace=@rateguard/db
RUN npm run build --workspace=@rateguard/server

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "apps/server/dist/index.js"]
```

### Step 3: Create Web Dockerfile

Create file: `apps/web/Dockerfile`

```dockerfile
# ================================================
# RateGuard Web - Production Dockerfile
# ================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/web ./apps/web

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@rateguard/web

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "apps/web/server.js"]
```

### Step 4: Update Next.js Config for Standalone Output

Update file: `apps/web/next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

### Step 5: Create Production Docker Compose

Create file: `docker/compose.prod.yml`

```yaml
# ================================================
# RateGuard - Production Docker Compose
# ================================================
# Usage: docker compose -f docker/compose.prod.yml up -d

services:
  # ================================================
  # PostgreSQL Database
  # ================================================
  postgres:
    image: postgres:16-alpine
    container_name: rateguard-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-rateguard}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Database password required}
      POSTGRES_DB: ${POSTGRES_DB:-rateguard}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-rateguard}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - rateguard

  # ================================================
  # Redis Cache
  # ================================================
  redis:
    image: redis:7-alpine
    container_name: rateguard-redis
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - rateguard

  # ================================================
  # RateGuard Server
  # ================================================
  server:
    build:
      context: ..
      dockerfile: apps/server/Dockerfile
    container_name: rateguard-server
    restart: always
    ports:
      - "${SERVER_PORT:-3000}:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-rateguard}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-rateguard}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:?JWT secret required}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - rateguard

  # ================================================
  # RateGuard Web Dashboard
  # ================================================
  web:
    build:
      context: ..
      dockerfile: apps/web/Dockerfile
    container_name: rateguard-web
    restart: always
    ports:
      - "${WEB_PORT:-3001}:3001"
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL:-http://localhost:3000}
    depends_on:
      - server
    networks:
      - rateguard

volumes:
  postgres_data:
  redis_data:

networks:
  rateguard:
    driver: bridge
```

### Step 6: Commit & Merge

```bash
git add .
git commit -m "feat(deploy): add production Docker configuration

- Add server Dockerfile with multi-stage build
- Add web Dockerfile with standalone output
- Add production compose file
- Add health checks"

git checkout main
git merge feat/docker-production
```

---

## Branch 8.2: feat/environment-config

### Step 1: Create Branch

```bash
git checkout -b feat/environment-config
```

### Step 2: Create Production Environment Template

Create file: `docker/.env.prod.example`

```bash
# ================================================
# RateGuard Production Environment Variables
# ================================================
# Copy this file to .env.prod and fill in your values
# NEVER commit .env.prod to version control!

# Database Configuration
POSTGRES_USER=rateguard
POSTGRES_PASSWORD=your-secure-password-here  # CHANGE THIS!
POSTGRES_DB=rateguard

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters  # CHANGE THIS!

# Server Configuration
SERVER_PORT=3000
WEB_PORT=3001

# Public API URL (used by the web dashboard)
API_URL=https://api.yourdomain.com
```

### Step 3: Create Deployment Documentation

Create file: `DEPLOYMENT.md`

```markdown
# RateGuard Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- A domain with SSL (for production)
- At least 1GB RAM, 10GB storage

## Quick Start

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/your-username/rateguard.git
cd rateguard
\`\`\`

### 2. Create environment file

\`\`\`bash
cp docker/.env.prod.example docker/.env.prod
\`\`\`

Edit \`docker/.env.prod\` and set:
- \`POSTGRES_PASSWORD\`: A strong database password
- \`JWT_SECRET\`: A random string of at least 32 characters
- \`API_URL\`: Your public API URL

### 3. Build and start services

\`\`\`bash
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d --build
\`\`\`

### 4. Run database migrations

\`\`\`bash
docker exec rateguard-server npx prisma db push --schema=packages/db/prisma/schema.prisma
\`\`\`

### 5. Verify deployment

\`\`\`bash
# Check health endpoint
curl http://localhost:3000/health

# Check all containers are running
docker ps
\`\`\`

## Accessing the Services

| Service | URL |
|---------|-----|
| API Server | http://localhost:3000 |
| Web Dashboard | http://localhost:3001 |
| Health Check | http://localhost:3000/health |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| POSTGRES_PASSWORD | PostgreSQL password | Yes |
| JWT_SECRET | JWT signing secret (32+ chars) | Yes |
| API_URL | Public API URL | Yes |
| POSTGRES_USER | PostgreSQL user | No (default: rateguard) |
| POSTGRES_DB | PostgreSQL database | No (default: rateguard) |
| SERVER_PORT | API server port | No (default: 3000) |
| WEB_PORT | Web dashboard port | No (default: 3001) |

## Production Checklist

- [ ] Set strong POSTGRES_PASSWORD
- [ ] Generate random JWT_SECRET
- [ ] Configure SSL/TLS
- [ ] Set up reverse proxy (nginx/caddy)
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test disaster recovery

## Backup

\`\`\`bash
# Database backup
docker exec rateguard-postgres pg_dump -U rateguard rateguard > backup-$(date +%Y%m%d).sql

# Restore from backup
cat backup.sql | docker exec -i rateguard-postgres psql -U rateguard rateguard
\`\`\`

## Logs

\`\`\`bash
# All services
docker compose -f docker/compose.prod.yml logs -f

# Specific service
docker logs -f rateguard-server
\`\`\`

## Updating

\`\`\`bash
git pull
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d --build
docker exec rateguard-server npx prisma db push --schema=packages/db/prisma/schema.prisma
\`\`\`
```

### Step 4: Commit & Merge

```bash
git add .
git commit -m "feat(deploy): add deployment documentation

- Add production environment template
- Add comprehensive deployment guide
- Add backup and restore instructions"

git checkout main
git merge feat/environment-config
```

---

# ✅ BUILD COMPLETE!

## Summary: What You Built

| Component | Status |
|-----------|--------|
| PostgreSQL Database | ✅ |
| Redis Cache | ✅ |
| User Authentication (JWT) | ✅ |
| Workspaces (Multi-tenant) | ✅ |
| API Key Management | ✅ |
| Token Bucket Rate Limiting | ✅ |
| Upstream Proxy | ✅ |
| Request Logging | ✅ |
| Analytics Dashboard | ✅ |
| Next.js Dashboard | ✅ |
| Docker Production | ✅ |

## All 27 Branches

```
Phase 1: Foundation
  1. feat/project-setup
  2. feat/docker-setup
  3. feat/database-schema

Phase 2: Core Services
  4. feat/crypto-utils
  5. feat/auth-service
  6. feat/workspace-service
  7. feat/api-key-service

Phase 3: Rate Limiting
  8. feat/redis-client
  9. feat/rate-limiter
  10. feat/rate-limit-service

Phase 4: HTTP Server
  11. feat/express-setup
  12. feat/auth-routes
  13. feat/workspace-routes
  14. feat/proxy-endpoint

Phase 5: Dashboard
  15. feat/nextjs-setup
  16. feat/auth-pages
  17. feat/dashboard-layout
  18. feat/api-keys-page
  19. feat/rules-page

Phase 6: Real Proxy
  20. feat/upstream-config
  21. feat/proxy-forward
  22. feat/upstreams-page

Phase 7: Analytics
  23. feat/analytics-service
  24. feat/analytics-routes
  25. feat/analytics-dashboard

Phase 8: Deployment
  26. feat/docker-production
  27. feat/environment-config
```

## Start Building!

```bash
mkdir rateguard
cd rateguard
git init
git branch -M main
git checkout -b feat/project-setup
```

**Follow Part 1, then Part 2. One branch at a time. You got this!** 🚀
