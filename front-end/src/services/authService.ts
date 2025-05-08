import { 
  User, 
  AuthTokens, 
  LoginCredentials, 
  RegisterData,
  PasswordChangeData,
  MessageResponse,
  ErrorResponse
} from '../types/auth';

/**
 * Base API URL
 */
const API_BASE = 'http://localhost:8000';
const AUTH_BASE = `${API_BASE}/api/accounts`;

/**
 * Headers for JSON requests
 */
const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Get auth token from local storage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Get headers with authorization token
 */
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  if (token) {
    return {
      ...JSON_HEADERS,
      'Authorization': `Bearer ${token}`
    };
  }
  return JSON_HEADERS;
};

/**
 * Set auth token in local storage
 */
const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

/**
 * Authentication service
 */
export const authService = {
  /**
   * Login user and get tokens
   */
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    try {
      const response = await fetch(`${AUTH_BASE}/token/`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        }
        
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.detail || 'Failed to login');
      }

      const tokens = await response.json();
      
      // Store tokens
      localStorage.setItem('auth_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Set token expiration time (default 30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); 
      localStorage.setItem('token_expires_at', expiresAt.toISOString());
      
      return tokens;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<MessageResponse> => {
    const response = await fetch(`${AUTH_BASE}/register/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      const errorMessage = Object.values(errorData).flat().join(', ');
      throw new Error(errorMessage || 'Registration failed');
    }

    return response.json();
  },

  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await fetch(`${AUTH_BASE}/me/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get user information');
    }

    return response.json();
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    const token = getAuthToken();
    
    try {
      // Only attempt to blacklist token if we have both tokens
      if (refreshToken && token) {
        const response = await fetch(`${AUTH_BASE}/logout/`, {
          method: 'POST',
          headers: {
            ...JSON_HEADERS,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        
        if (!response.ok) {
          console.warn('Failed to blacklist token, status:', response.status);
        }
      }
    } catch (error) {
      console.error('Error during logout API call:', error);
    } finally {
      // Clear storage regardless of API response
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user_data');
      localStorage.removeItem('token_expires_at');
    }
  },

  /**
   * Refresh the access token
   */
  refreshToken: async (): Promise<AuthTokens> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${AUTH_BASE}/token/refresh/`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        // If refresh fails, logout user
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token_expires_at');
        localStorage.removeItem('user_data');
        throw new Error('Token refresh failed');
      }

      const tokens = await response.json();
      localStorage.setItem('auth_token', tokens.access);
      
      // Set new expiration time (default 30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      localStorage.setItem('token_expires_at', expiresAt.toISOString());
      
      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },
  
  /**
   * Check if token needs refresh
   */
  shouldRefreshToken: (): boolean => {
    const expiresAtStr = localStorage.getItem('token_expires_at');
    if (!expiresAtStr) return false;
    
    // Add a buffer of 1 minute to refresh before expiration
    const currentTime = new Date();
    const expiresAt = new Date(expiresAtStr);
    
    // Return true if token expires in less than 1 minute
    const oneMinuteBuffer = 60 * 1000; // 1 minute in milliseconds
    return (expiresAt.getTime() - currentTime.getTime()) < oneMinuteBuffer;
  },

  /**
   * Change user password
   */
  changePassword: async (data: PasswordChangeData): Promise<MessageResponse> => {
    const response = await fetch(`${AUTH_BASE}/change-password/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = Object.values(errorData).flat().join(', ');
      throw new Error(errorMessage || 'Password change failed');
    }

    return response.json();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return localStorage.getItem('isAuthenticated') === 'true' && 
           !!localStorage.getItem('auth_token');
  },

  /**
   * Get stored user data or fetch it if not available
   */
  getUserData: async (): Promise<User | null> => {
    // Try to get from localStorage first
    const userData = localStorage.getItem('user_data');
    
    if (userData) {
      return JSON.parse(userData);
    }
    
    // If not in localStorage and user is authenticated, fetch from API
    if (authService.isAuthenticated()) {
      try {
        const user = await authService.getCurrentUser();
        localStorage.setItem('user_data', JSON.stringify(user));
        return user;
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    }
    
    return null;
  }
};

/**
 * Set up fetch interceptor for token refresh
 */
export const setupAuthInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Check if we need to refresh the token before making any request
    if (authService.isAuthenticated() && authService.shouldRefreshToken()) {
      try {
        // Proactively refresh the token
        await authService.refreshToken();
      } catch (error) {
        // If refresh fails, logout and redirect
        console.error('Token refresh failed:', error);
        authService.logout();
        window.location.href = '/auth';
        return originalFetch(input, init); // Continue with original request
      }
    }
    
    // Add auth token to request if it's an API call and token exists
    const token = getAuthToken();
    if (token && typeof input === 'string' && input.includes(API_BASE)) {
      // Create new headers with auth token
      const newInit: RequestInit = { ...(init || {}) };
      newInit.headers = {
        ...(newInit.headers || {}),
        'Authorization': `Bearer ${token}`
      };
      init = newInit;
    }
    
    // Make the actual request
    let response = await originalFetch(input, init);
    
    // If response is 401 Unauthorized, try to refresh the token
    if (response.status === 401 && authService.isAuthenticated()) {
      try {
        // Refresh the token
        await authService.refreshToken();
        
        // Retry the original request with the new token
        const newToken = getAuthToken();
        if (newToken) {
          const newInit: RequestInit = { ...(init || {}) };
          newInit.headers = {
            ...(newInit.headers || {}),
            'Authorization': `Bearer ${newToken}`
          };
          
          // Retry the request with the new token
          return originalFetch(input, newInit);
        }
      } catch (error) {
        // If refresh fails, logout
        console.error('Token refresh failed during retry:', error);
        authService.logout();
        window.location.href = '/auth';
      }
    }
    
    return response;
  };
};