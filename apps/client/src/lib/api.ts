const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: data?.message || 'An error occurred',
        status: response.status,
      };
    }

    return { data, status: response.status };
  } catch (error) {
    return {
      error: 'Network error. Please check your connection.',
      status: 0,
    };
  }
}

export const api = {
  // Auth endpoints
  auth: {
    register: (data: {
      email: string;
      password: string;
      fullName: string;
      company?: string;
    }) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (data: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    logout: (refreshToken?: string) =>
      request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    refresh: (refreshToken: string) =>
      request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    me: () => request('/auth/me'),

    forgotPassword: (email: string) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, newPassword: string) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      }),

    changePassword: (currentPassword: string, newPassword: string) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },
};

