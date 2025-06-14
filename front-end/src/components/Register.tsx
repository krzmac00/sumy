// components/Register.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: (message: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: ''
  });
  
  const [errors, setErrors] = useState<{
    email?: string;
    first_name?: string;
    last_name?: string;
    password?: string;
    password2?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateEmail = (email: string): boolean => {
    // Updated validation for both student and lecturer emails
    // Student: XXXXXX@edu.p.lodz.pl where X is a number
    // Lecturer: firstname.lastname@p.lodz.pl
    const username = email.split('@')[0];
    
    if (email.endsWith('@edu.p.lodz.pl')) {
      // Student email validation
      return username.match(/^\d{6}$/) !== null;
    } else if (email.endsWith('@p.lodz.pl')) {
      // Lecturer email validation
      return username.match(/^[A-Za-z]+\.[A-Za-z]+$/) !== null;
    }
    
    return false;
  };

  const validate = (): boolean => {
    const newErrors: {
      email?: string;
      first_name?: string;
      last_name?: string;
      password?: string;
      password2?: string;
    } = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('validation.required', { field: t('register.email') });
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('validation.email.format');
    }
    
    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = t('validation.required', { field: t('register.firstName') });
    }
    
    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('validation.required', { field: t('register.lastName') });
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = t('validation.required', { field: t('register.password') });
    } else if (formData.password.length < 8) {
      newErrors.password = t('validation.password.length');
    }
    
    // Confirm password validation
    if (formData.password !== formData.password2) {
      newErrors.password2 = t('validation.password.match');
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
        const response = await register(formData);
        
        if (onRegisterSuccess) {
          onRegisterSuccess(response.message);
        } else {
          onSwitchToLogin();
        }
      } catch (err) {
        console.error('Registration error:', err);
        setError(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="email">{t('register.email')}</label>
        <input
          type="text"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={t('register.email.placeholder')}
          className={errors.email ? 'error' : ''}
          disabled={isLoading}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
        <small className="help-text">
          {t('register.emailHelp')}
        </small>
      </div>
      
      <div className="form-group">
        <label htmlFor="first_name">{t('register.firstName')}</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder={t('register.firstName.placeholder')}
          className={errors.first_name ? 'error' : ''}
          disabled={isLoading}
        />
        {errors.first_name && <span className="error-message">{errors.first_name}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="last_name">{t('register.lastName')}</label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder={t('register.lastName.placeholder')}
          className={errors.last_name ? 'error' : ''}
          disabled={isLoading}
        />
        {errors.last_name && <span className="error-message">{errors.last_name}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="password">{t('register.password')}</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={t('register.password.placeholder')}
          className={errors.password ? 'error' : ''}
          disabled={isLoading}
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="password2">{t('register.confirmPassword')}</label>
        <input
          type="password"
          id="password2"
          name="password2"
          value={formData.password2}
          onChange={handleChange}
          placeholder={t('register.confirmPassword.placeholder')}
          className={errors.password2 ? 'error' : ''}
          disabled={isLoading}
        />
        {errors.password2 && <span className="error-message">{errors.password2}</span>}
      </div>
      
      <button 
        type="submit" 
        className="submit-button-auth"
        disabled={isLoading}
      >
        {isLoading ? t('register.registering') : t('register.button')}
      </button>
      
      <div className="form-footer">
        <p>{t('register.haveAccount')} <button type="button" onClick={onSwitchToLogin} disabled={isLoading}>{t('app.switchToLogin')}</button></p>
      </div>
    </form>
  );
};

export default Register;