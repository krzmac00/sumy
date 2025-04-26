import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      newErrors.username = t('validation.required', { field: t('login.username') });
    }
    
    if (!password) {
      newErrors.password = t('validation.required', { field: t('login.password') });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (validate()) {
      onLogin(username, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="username">{t('login.username')}</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('login.username.placeholder')}
          className={errors.username ? 'error' : ''}
        />
        {errors.username && <span className="error-message">{errors.username}</span>}
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
        />
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>
      
      <button type="submit" className="submit-button">{t('login.button')}</button>
      
      <div className="form-footer">
        <p>{t('login.noAccount')} <button type="button" onClick={onSwitchToRegister}>{t('app.switchToRegister')}</button></p>
      </div>
    </form>
  );
};

export default Login;