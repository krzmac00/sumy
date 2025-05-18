import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService, setupAuthInterceptor } from '../services/authService';
import { User, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  error: string | null;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Setup auth interceptor
  useEffect(() => {
    setupAuthInterceptor();
    
    // Setup a token refresh interval 
    const tokenRefreshInterval = setInterval(() => {
      // Skip background refresh on auth pages
      const isAuthPage = window.location.pathname.includes('/auth');
      
      if (!isAuthPage && authService.isAuthenticated() && authService.shouldRefreshToken()) {
        authService.refreshToken()
          .catch(error => {
            console.error('Token refresh error in interval:', error);
            // If token refresh fails in the background, logout
            authService.logout();
            setCurrentUser(null);
          });
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(tokenRefreshInterval);
  }, []);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      // Skip loading on auth pages to prevent token refresh loops
      const isAuthPage = window.location.pathname.includes('/auth');
      
      if (authService.isAuthenticated() && !isAuthPage) {
        try {
          const userData = await authService.getUserData();
          setCurrentUser(userData);
        } catch (err) {
          console.error('Failed to load user data:', err);
          // Clear auth state on error
          await authService.logout();
          setCurrentUser(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // If not authenticated or on auth page, just set loading false
        setCurrentUser(null);
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.login(credentials);
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(data);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

   const updateUser = (user: User) => {
    setCurrentUser(user);
  };

  const value = {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    error,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};