import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSwitchToRegister: () => void;
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onLoginSuccess }) => {
  const { t } = useTranslation();
  const { login, error: authError } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = t('validation.required', { field: t('login.email') });
    }
    
    if (!password) {
      newErrors.password = t('validation.required', { field: t('login.password') });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (validate()) {
      setIsLoading(true);
      setError(null);
      
      try {
        await login({ email, password });
        // Wait a moment to ensure token is stored before redirect
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            // Redirect to home if no success callback
            window.location.href = '/home';
          }
        }, 100);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);
        
        // Clear password field on authentication error
        if (errorMessage.includes('Invalid email or password')) {
          setPassword('');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {(error || authError) && (
        <div className="error-alert">
          {error || authError}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="email">{t('login.email')}</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('login.email.placeholder')}
          className={errors.email ? 'error' : ''}
          disabled={isLoading}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="password">{t('login.password')}</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('login.password.placeholder')}
          className={errors.password ? 'error' : ''}
          disabled={isLoading}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>
      
      <button 
        type="submit" 
        className="submit-button-auth"
        disabled={isLoading}
      >
        {isLoading ? t('login.loading') : t('login.button')}
      </button>
      
      <div className="form-footer">
        <p>{t('login.noAccount')} <button type="button" onClick={onSwitchToRegister} disabled={isLoading}>{t('app.switchToRegister')}</button></p>
      </div>
    </form>
  );
};

export default Login;