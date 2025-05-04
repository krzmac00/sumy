// App.tsx with routing
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import './App.css';
import MapPage from './pages/MapPage';

const AuthLayout: React.FC = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>('');
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [users, setUsers] = useState<Array<{
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }>>([]);

  const handleLogin = (username: string, password: string): void => {
    const user = users.find(user => 
      user.email.split('@')[0] === username && 
      user.password === password
    );
    
    if (user) {
      setMessage(t('message.loginSuccess', { name: `${user.firstName} ${user.lastName}` }));
      // In a real app, you would set authentication state and redirect
      localStorage.setItem('isAuthenticated', 'true');
      window.location.href = '/home';
    } else {
      setMessage(t('message.loginError'));
    }
  };

  const handleRegister = (userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }): void => {
    // Check if user already exists
    if (users.some(user => user.email === userData.email)) {
      setMessage(t('message.emailExists'));
      return;
    }

    // Add new user
    setUsers([...users, userData]);
    setMessage(t('message.registerSuccess'));
    setIsLoginView(true);
  };

  return (
    <div className="app-container">
      <div className="auth-container" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="auth-header">
          <h1>{isLoginView ? t('login.title') : t('register.title')}</h1>
          <div className="tab-switcher">
            <button 
              className={isLoginView ? 'active' : ''} 
              onClick={() => setIsLoginView(true)}
            >
              {t('app.switchToLogin')}
            </button>
            <button 
              className={!isLoginView ? 'active' : ''} 
              onClick={() => setIsLoginView(false)}
            >
              {t('app.switchToRegister')}
            </button>
          </div>
        </div>
        
        {message && <div className="message">{message}</div>}
        
        {isLoginView ? (
          <Login 
            onLogin={handleLogin} 
            onSwitchToRegister={() => setIsLoginView(false)} 
          />
        ) : (
          <Register 
            onRegister={handleRegister} 
            onSwitchToLogin={() => setIsLoginView(true)} 
          />
        )}
      </div>
    </div>
  );
};

// Protected route component
const ProtectedRoute: React.FC<{element: React.ReactNode}> = ({ element }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  return isAuthenticated ? (
    <>{element}</>
  ) : (
    <Navigate to="/auth" replace />
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthLayout />} />
        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/map" element={<ProtectedRoute element={<MapPage />} />} />
      </Routes>
    </Router>
  );
};

export default App;