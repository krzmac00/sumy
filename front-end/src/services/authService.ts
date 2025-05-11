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
    
    // First clean up all auth-related local storage to prevent further API calls
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_expires_at');
    
    // Then blacklist token on the server if available
    if (refreshToken && token) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${AUTH_BASE}/logout/`, {
          method: 'POST',
          headers: {
            ...JSON_HEADERS,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn('Failed to blacklist token, status:', response.status);
        }
      } catch (error) {
        // Don't let API errors prevent logout completion
        if (error instanceof Error) {
          console.error('Error during logout API call:', error.message);
        }
      }
    }
  },

  /**
   * Refresh the access token
   */
  refreshToken: async (): Promise<AuthTokens> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        // Clear any remaining tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token_expires_at');
        localStorage.removeItem('user_data');
        throw new Error('No refresh token available');
      }
      
      // Use AbortController to set timeout for refresh requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${AUTH_BASE}/token/refresh/`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ refresh: refreshToken }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Clean up tokens when refresh fails
        await authService.logout();
        throw new Error('Token refresh failed');
      }

      const tokens = await response.json();
      
      // Only set tokens if we actually got them
      if (tokens && tokens.access) {
        localStorage.setItem('auth_token', tokens.access);
        
        // Set new expiration time (default 30 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        localStorage.setItem('token_expires_at', expiresAt.toISOString());
        
        return tokens;
      } else {
        // If response doesn't contain expected tokens, logout
        await authService.logout();
        throw new Error('Invalid token response');
      }
    } catch (error) {
      // Any errors during refresh should result in logout
      if (error instanceof Error) {
        console.error('Token refresh error:', error.message);
      } else {
        console.error('Unknown token refresh error');
      }
      
      // Make sure tokens are cleared on any error
      await authService.logout();
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
    // Check both token and isAuthenticated flag
    const hasToken = !!localStorage.getItem('auth_token');
    const hasRefreshToken = !!localStorage.getItem('refresh_token');
    const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true';
    
    // All three conditions must be true
    return isAuthFlag && hasToken && hasRefreshToken;
  },

  /**
   * Get stored user data or fetch it if not available
   */
  getUserData: async (): Promise<User | null> => {
    // Try to get from localStorage first
    const userData = localStorage.getItem('user_data');
    
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user_data');
      }
    }
    
    // If not in localStorage and user is authenticated, fetch from API
    if (authService.isAuthenticated()) {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          localStorage.setItem('user_data', JSON.stringify(user));
          return user;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If API call fails, don't try additional calls
        if (error instanceof Error && error.message.includes('Failed to get user information')) {
          authService.logout();
        }
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
    const url = typeof input === 'string' ? input : input.url;
    const isAuthPage = url.includes('/auth') || window.location.pathname.includes('/auth');
    
    // Skip token refresh logic for auth-related pages to prevent infinite loops
    if (!isAuthPage && authService.isAuthenticated() && authService.shouldRefreshToken()) {
      try {
        // Proactively refresh the token
        await authService.refreshToken();
      } catch (error) {
        // If refresh fails, logout but don't redirect if we're already on auth page
        console.error('Token refresh failed:', error);
        await authService.logout();
        
        // Only redirect if we're not already on the auth page and this isn't an auth request
        if (!isAuthPage) {
          window.location.href = '/auth';
        }
        
        // For auth-related requests, continue without redirecting
        return originalFetch(input, init);
      }
    }
    
    // Add auth token to request if it's an API call, token exists, and not auth-related
    const token = getAuthToken();
    if (token && typeof url === 'string' && url.includes(API_BASE) && !url.includes('/token/')) {
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
    
    // Handle 401 Unauthorized, but avoid infinite loops on auth pages
    if (response.status === 401 && authService.isAuthenticated() && !isAuthPage) {
      // Skip retry for token-related endpoints to prevent loops
      const isTokenEndpoint = typeof url === 'string' && 
        (url.includes('/token/') || url.includes('/logout/'));
      
      if (!isTokenEndpoint) {
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
          // If refresh fails, logout but only redirect if not on auth page
          console.error('Token refresh failed during retry:', error);
          await authService.logout();
          
          if (!isAuthPage) {
            window.location.href = '/auth';
          }
        }
      }
    }
    
    return response;
  };
};