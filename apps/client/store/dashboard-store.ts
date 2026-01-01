import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimeRange = '24h' | '7d' | '30d' | '90d';

export interface DashboardStats {
  totalRequests: string;
  mtdCost: string;
  errorRate: string;
  avgLatency: string;
  p95Latency: string;
}

export interface CostData {
  name: string;
  cost: number;
  percentage: number;
}

export interface EndpointData {
  path: string;
  api: string;
  requests: string;
  avgLatency: string;
  errorRate: string;
}

interface DashboardState {
  timeRange: TimeRange;
  stats: DashboardStats;
  costData: CostData[];
  endpoints: EndpointData[];
  budget: number;
  currentSpend: number;
  
  // Actions
  setTimeRange: (range: TimeRange) => void;
  setBudget: (budget: number) => void;
}

const initialStats: DashboardStats = {
  totalRequests: '1.23M',
  mtdCost: '$456',
  errorRate: '0.42%',
  avgLatency: '145ms',
  p95Latency: '892ms',
};

const initialCostData: CostData[] = [
  { name: 'OpenAI', cost: 234.56, percentage: 58 },
  { name: 'Anthropic', cost: 89.12, percentage: 22 },
  { name: 'Cohere', cost: 45.00, percentage: 11 },
  { name: 'Other', cost: 35.00, percentage: 9 },
];

const initialEndpoints: EndpointData[] = [
  { path: '/v1/chat/completions', api: 'OpenAI', requests: '892,145', avgLatency: '234ms', errorRate: '0.12%' },
  { path: '/v1/messages', api: 'Anthropic', requests: '234,567', avgLatency: '456ms', errorRate: '0.34%' },
  { path: '/v1/embeddings', api: 'OpenAI', requests: '567,890', avgLatency: '89ms', errorRate: '0.08%' },
  { path: '/v1/generate', api: 'Cohere', requests: '123,456', avgLatency: '312ms', errorRate: '0.21%' },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      timeRange: '24h',
      stats: initialStats,
      costData: initialCostData,
      endpoints: initialEndpoints,
      budget: 1000,
      currentSpend: 456.78,

      setTimeRange: (range) => set({ timeRange: range }),
      setBudget: (budget) => set({ budget }),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({ timeRange: state.timeRange, budget: state.budget }),
    }
  )
);

