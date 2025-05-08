/**
 * User model interface
 */
export interface User {
  id: number;
  login: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'lecturer' | 'admin';
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  access: string;
  refresh: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
}

/**
 * Password change data
 */
export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  new_password2: string;
}

/**
 * API response with message
 */
export interface MessageResponse {
  message: string;
  [key: string]: any; // Allow for additional properties
}

/**
 * Error response
 */
export interface ErrorResponse {
  detail?: string;
  [key: string]: any; // For field-specific errors
}