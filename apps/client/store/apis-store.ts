import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Api {
  id: number;
  name: string;
  slug: string;
  baseUrl: string;
  status: 'active' | 'paused';
  rules: number;
}

interface ApisState {
  apis: Api[];
  isLoading: boolean;
  
  // Actions
  addApi: (api: Omit<Api, 'id'>) => void;
  updateApi: (id: number, updates: Partial<Api>) => void;
  deleteApi: (id: number) => void;
  toggleApiStatus: (id: number) => void;
}

const initialApis: Api[] = [
  { id: 1, name: 'OpenAI', slug: 'openai', baseUrl: 'https://api.openai.com', status: 'active', rules: 3 },
  { id: 2, name: 'Anthropic', slug: 'anthropic', baseUrl: 'https://api.anthropic.com', status: 'active', rules: 2 },
  { id: 3, name: 'Stripe', slug: 'stripe', baseUrl: 'https://api.stripe.com', status: 'paused', rules: 1 },
];

export const useApisStore = create<ApisState>()(
  persist(
    (set) => ({
      apis: initialApis,
      isLoading: false,

      addApi: (api) => set((state) => ({
        apis: [...state.apis, { ...api, id: Math.max(...state.apis.map(a => a.id), 0) + 1 }]
      })),

      updateApi: (id, updates) => set((state) => ({
        apis: state.apis.map(api => api.id === id ? { ...api, ...updates } : api)
      })),

      deleteApi: (id) => set((state) => ({
        apis: state.apis.filter(api => api.id !== id)
      })),

      toggleApiStatus: (id) => set((state) => ({
        apis: state.apis.map(api => 
          api.id === id 
            ? { ...api, status: api.status === 'active' ? 'paused' : 'active' } 
            : api
        )
      })),
    }),
    {
      name: 'apis-storage',
    }
  )
);

