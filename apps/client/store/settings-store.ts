import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  slack: boolean;
}

export interface WorkspaceSettings {
  name: string;
  timezone: string;
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  workspace: WorkspaceSettings;
  twoFactorEnabled: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  updateWorkspace: (updates: Partial<WorkspaceSettings>) => void;
  setTwoFactor: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      notifications: {
        email: true,
        inApp: true,
        slack: false,
      },
      workspace: {
        name: 'My Workspace',
        timezone: 'America/Los_Angeles',
      },
      twoFactorEnabled: false,

      setTheme: (theme) => set({ theme }),
      updateNotifications: (updates) => set((state) => ({
        notifications: { ...state.notifications, ...updates }
      })),
      updateWorkspace: (updates) => set((state) => ({
        workspace: { ...state.workspace, ...updates }
      })),
      setTwoFactor: (enabled) => set({ twoFactorEnabled: enabled }),
    }),
    {
      name: 'settings-storage',
    }
  )
);

