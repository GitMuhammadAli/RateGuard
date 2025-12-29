/**
 * API Client for RateGuard Backend
 * Handles all HTTP requests to the backend server with token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'rateguard_access_token';
const REFRESH_TOKEN_KEY = 'rateguard_refresh_token';

// Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: AuthUser;
  tokens: AuthTokens;
  message: string;
}

// Token Management
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setTokens: (tokens: AuthTokens): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  
  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  hasTokens: (): boolean => {
    return !!tokenStorage.getAccessToken();
  }
};

// Core fetch wrapper with automatic token handling
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  // Add auth header if we have a token
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });
    
    // If unauthorized, try to refresh the token
    if (response.status === 401 && tokenStorage.getRefreshToken()) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${tokenStorage.getAccessToken()}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, clear tokens
        tokenStorage.clearTokens();
        return { error: 'Session expired. Please log in again.', statusCode: 401 };
      }
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.message || 'An error occurred',
        statusCode: response.status,
      };
    }
    
    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Network error. Please check your connection.' };
  }
}

// Refresh tokens
async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    tokenStorage.setTokens(data);
    return true;
  } catch {
    return false;
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string, rememberMe = false): Promise<ApiResponse<LoginResponse>> => {
    const result = await fetchWithAuth<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    
    if (result.data?.tokens) {
      tokenStorage.setTokens(result.data.tokens);
    }
    
    return result;
  },
  
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<ApiResponse<RegisterResponse>> => {
    const result = await fetchWithAuth<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (result.data?.tokens) {
      tokenStorage.setTokens(result.data.tokens);
    }
    
    return result;
  },
  
  logout: async (): Promise<ApiResponse<void>> => {
    const result = await fetchWithAuth<void>('/auth/logout', {
      method: 'POST',
    });
    tokenStorage.clearTokens();
    return result;
  },
  
  logoutAll: async (): Promise<ApiResponse<void>> => {
    const result = await fetchWithAuth<void>('/auth/logout-all', {
      method: 'POST',
    });
    tokenStorage.clearTokens();
    return result;
  },
  
  getMe: async (): Promise<ApiResponse<AuthUser>> => {
    return fetchWithAuth<AuthUser>('/auth/me');
  },
  
  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return fetchWithAuth<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    return fetchWithAuth<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
  
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    return fetchWithAuth<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  
  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    return fetchWithAuth<{ message: string }>(`/auth/verify-email?token=${token}`);
  },
  
  resendVerification: async (): Promise<ApiResponse<{ message: string }>> => {
    return fetchWithAuth<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
    });
  },
};

// Generic API helper
export const api = {
  get: <T>(endpoint: string) => fetchWithAuth<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) => fetchWithAuth<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: <T>(endpoint: string, data: unknown) => fetchWithAuth<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: <T>(endpoint: string, data: unknown) => fetchWithAuth<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: <T>(endpoint: string) => fetchWithAuth<T>(endpoint, {
    method: 'DELETE',
  }),
};

export default api;

