import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RateLimit {
  id: number;
  algorithm: 'Token Bucket' | 'Sliding Window' | 'Fixed Window' | 'Leaky Bucket';
  scope: 'Per Key' | 'Per Workspace' | 'Per IP' | 'Global';
  api: string;
  description: string;
  pattern: string;
  enabled: boolean;
}

interface RateLimitsState {
  rateLimits: RateLimit[];
  isLoading: boolean;
  
  // Actions
  addRateLimit: (rateLimit: Omit<RateLimit, 'id'>) => void;
  updateRateLimit: (id: number, updates: Partial<RateLimit>) => void;
  deleteRateLimit: (id: number) => void;
  toggleRateLimit: (id: number) => void;
}

const initialRateLimits: RateLimit[] = [
  { id: 1, algorithm: 'Token Bucket', scope: 'Per Key', api: 'OpenAI', description: '100 burst, 10/sec sustained', pattern: '/v1/chat/completions', enabled: true },
  { id: 2, algorithm: 'Sliding Window', scope: 'Per Workspace', api: 'All', description: '10,000 requests per hour', pattern: 'All endpoints', enabled: true },
];

export const useRateLimitsStore = create<RateLimitsState>()(
  persist(
    (set) => ({
      rateLimits: initialRateLimits,
      isLoading: false,

      addRateLimit: (rateLimit) => set((state) => ({
        rateLimits: [...state.rateLimits, { ...rateLimit, id: Math.max(...state.rateLimits.map(r => r.id), 0) + 1 }]
      })),

      updateRateLimit: (id, updates) => set((state) => ({
        rateLimits: state.rateLimits.map(rule => rule.id === id ? { ...rule, ...updates } : rule)
      })),

      deleteRateLimit: (id) => set((state) => ({
        rateLimits: state.rateLimits.filter(rule => rule.id !== id)
      })),

      toggleRateLimit: (id) => set((state) => ({
        rateLimits: state.rateLimits.map(rule => 
          rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
        )
      })),
    }),
    {
      name: 'rate-limits-storage',
    }
  )
);

