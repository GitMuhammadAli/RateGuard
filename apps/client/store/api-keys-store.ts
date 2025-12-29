import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  fullKey?: string;
  status: 'active' | 'revoked';
  lastUsed: string;
  createdAt: string;
}

interface ApiKeysState {
  apiKeys: ApiKey[];
  isLoading: boolean;
  
  // Actions
  createKey: (name: string) => ApiKey;
  revokeKey: (id: number) => void;
  deleteKey: (id: number) => void;
  updateKeyName: (id: number, name: string) => void;
}

const generateKey = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

const initialApiKeys: ApiKey[] = [
  { id: 1, name: 'Production Key', prefix: 'rg_live_****', status: 'active', lastUsed: '5 min ago', createdAt: '2024-01-15' },
  { id: 2, name: 'Development Key', prefix: 'rg_dev_****', status: 'active', lastUsed: 'Never', createdAt: '2024-02-20' },
];

export const useApiKeysStore = create<ApiKeysState>()(
  persist(
    (set, get) => ({
      apiKeys: initialApiKeys,
      isLoading: false,

      createKey: (name: string) => {
        const fullKey = `rg_live_${generateKey()}`;
        const newKey: ApiKey = {
          id: Math.max(...get().apiKeys.map(k => k.id), 0) + 1,
          name,
          prefix: `${fullKey.substring(0, 12)}****`,
          fullKey,
          status: 'active',
          lastUsed: 'Never',
          createdAt: new Date().toISOString().split('T')[0],
        };
        
        set((state) => ({
          apiKeys: [...state.apiKeys, newKey]
        }));
        
        return newKey;
      },

      revokeKey: (id) => set((state) => ({
        apiKeys: state.apiKeys.map(key => 
          key.id === id ? { ...key, status: 'revoked' } : key
        )
      })),

      deleteKey: (id) => set((state) => ({
        apiKeys: state.apiKeys.filter(key => key.id !== id)
      })),

      updateKeyName: (id, name) => set((state) => ({
        apiKeys: state.apiKeys.map(key => 
          key.id === id ? { ...key, name } : key
        )
      })),
    }),
    {
      name: 'api-keys-storage',
    }
  )
);

