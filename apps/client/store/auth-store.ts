import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, tokenStorage, type AuthUser } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  company?: string;
  avatar?: string;
  emailVerified?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    company?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
}

// Helper to convert API user to store user
function mapApiUserToUser(apiUser: AuthUser): User {
  const nameParts = apiUser.fullName.split(' ');
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    fullName: apiUser.fullName,
    emailVerified: apiUser.emailVerified,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      rememberMe: false,
      error: null,

      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await authApi.login(email, password, rememberMe);
          
          if (result.error) {
            set({ isLoading: false, error: result.error });
            return false;
          }
          
          if (result.data?.user) {
            const user = mapApiUserToUser(result.data.user);
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              rememberMe,
              error: null,
            });
            return true;
          }
          
          set({ isLoading: false, error: 'Login failed' });
          return false;
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false, error: 'An unexpected error occurred' });
          return false;
        }
      },

      signup: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          const fullName = `${data.firstName} ${data.lastName}`.trim();
          
          const result = await authApi.register({
            email: data.email,
            password: data.password,
            fullName,
          });
          
          if (result.error) {
            set({ isLoading: false, error: result.error });
            return false;
          }
          
          if (result.data?.user) {
            const user = mapApiUserToUser(result.data.user);
            user.company = data.company;
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null,
            });
            return true;
          }
          
          set({ isLoading: false, error: 'Registration failed' });
          return false;
        } catch (error) {
          console.error('Signup error:', error);
          set({ isLoading: false, error: 'An unexpected error occurred' });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          tokenStorage.clearTokens();
          set({ 
            user: null, 
            isAuthenticated: false,
            rememberMe: false,
            isLoading: false,
            error: null,
          });
        }
      },

      logoutAll: async () => {
        set({ isLoading: true });
        try {
          await authApi.logoutAll();
        } catch (error) {
          console.error('Logout all error:', error);
        } finally {
          tokenStorage.clearTokens();
          set({ 
            user: null, 
            isAuthenticated: false,
            rememberMe: false,
            isLoading: false,
            error: null,
          });
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true, error: null });
      },

      checkAuth: async () => {
        // Check if we have tokens
        if (!tokenStorage.hasTokens()) {
          set({ isAuthenticated: false, user: null });
          return false;
        }
        
        set({ isLoading: true });
        
        try {
          const result = await authApi.getMe();
          
          if (result.error || !result.data) {
            tokenStorage.clearTokens();
            set({ isAuthenticated: false, user: null, isLoading: false });
            return false;
          }
          
          const user = mapApiUserToUser(result.data);
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          console.error('Auth check error:', error);
          tokenStorage.clearTokens();
          set({ isAuthenticated: false, user: null, isLoading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await authApi.forgotPassword(email);
          
          if (result.error) {
            set({ isLoading: false, error: result.error });
            return false;
          }
          
          set({ isLoading: false });
          return true;
        } catch (error) {
          console.error('Forgot password error:', error);
          set({ isLoading: false, error: 'An unexpected error occurred' });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => 
        state.rememberMe 
          ? { user: state.user, isAuthenticated: state.isAuthenticated, rememberMe: state.rememberMe }
          : { rememberMe: state.rememberMe },
    }
  )
);
