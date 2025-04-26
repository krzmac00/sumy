// components/Register.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RegisterProps {
  onRegister: (userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<{
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateEmail = (email: string): boolean => {
    // Validate email format: XXXXXX@edu.p.lodz.pl where X is a number
    const regex = /^(\d{6})@edu\.p\.lodz\.pl$/;
    return regex.test(email);
  };

  const validate = (): boolean => {
    const newErrors: {
      email?: string;
      firstName?: string;
      lastName?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('validation.required', { field: t('register.email') });
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('validation.email.format');
    }
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.required', { field: t('register.firstName') });
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.required', { field: t('register.lastName') });
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = t('validation.required', { field: t('register.password') });
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.password.length');
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.password.match');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (validate()) {
      const { confirmPassword, ...userData } = formData;
      onRegister(userData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
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
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="firstName">{t('register.firstName')}</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder={t('register.firstName.placeholder')}
          className={errors.firstName ? 'error' : ''}
        />
        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="lastName">{t('register.lastName')}</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder={t('register.lastName.placeholder')}
          className={errors.lastName ? 'error' : ''}
        />
        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
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
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder={t('register.confirmPassword.placeholder')}
          className={errors.confirmPassword ? 'error' : ''}
        />
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>
      
      <button type="submit" className="submit-button">{t('register.button')}</button>
      
      <div className="form-footer">
        <p>{t('register.haveAccount')} <button type="button" onClick={onSwitchToLogin}>{t('app.switchToLogin')}</button></p>
      </div>
    </form>
  );
};

export default Register;