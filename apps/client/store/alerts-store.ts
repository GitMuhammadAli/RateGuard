import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AlertType = 'budget' | 'rate_limit' | 'error' | 'latency';
export type AlertIcon = 'TrendingUp' | 'AlertTriangle' | 'Zap';

export interface Alert {
  id: number;
  name: string;
  description: string;
  icon: AlertIcon;
  type: AlertType;
  enabled: boolean;
  lastTriggered: string;
  threshold?: number;
}

interface AlertsState {
  alerts: Alert[];
  isLoading: boolean;
  
  // Actions
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  updateAlert: (id: number, updates: Partial<Alert>) => void;
  deleteAlert: (id: number) => void;
  toggleAlert: (id: number) => void;
}

const initialAlerts: Alert[] = [
  { id: 1, name: 'Budget Warning', description: 'Trigger when budget exceeds 80%', icon: 'TrendingUp', type: 'budget', enabled: true, lastTriggered: '5 min ago', threshold: 80 },
  { id: 2, name: 'Rate Limit Breach', description: 'Trigger when rate limits are hit', icon: 'AlertTriangle', type: 'rate_limit', enabled: true, lastTriggered: '12 min ago' },
  { id: 3, name: 'Error Spike', description: 'Trigger when error rate exceeds 5%', icon: 'Zap', type: 'error', enabled: false, lastTriggered: 'Never', threshold: 5 },
];

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: initialAlerts,
      isLoading: false,

      addAlert: (alert) => set((state) => ({
        alerts: [...state.alerts, { ...alert, id: Math.max(...state.alerts.map(a => a.id), 0) + 1 }]
      })),

      updateAlert: (id, updates) => set((state) => ({
        alerts: state.alerts.map(alert => alert.id === id ? { ...alert, ...updates } : alert)
      })),

      deleteAlert: (id) => set((state) => ({
        alerts: state.alerts.filter(alert => alert.id !== id)
      })),

      toggleAlert: (id) => set((state) => ({
        alerts: state.alerts.map(alert => 
          alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
        )
      })),
    }),
    {
      name: 'alerts-storage',
    }
  )
);

