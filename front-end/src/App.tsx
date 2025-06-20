// App.tsx with routing
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Login from './components/Login';
import Register from './components/Register';
import ActivateAccount from './components/ActivateAccount';
import Home from './pages/Home';
import ForumPage from './pages/forum/ForumPage';
import ThreadViewPage from './pages/forum/ThreadViewPage';
import ThreadCreatePage from './pages/forum/ThreadCreatePage';
import ThreadEditPage from './pages/forum/ThreadEditPage';
import NoticeboardPage from './pages/noticeboard/NoticeboardPage';
import AdvertisementViewPage from './pages/noticeboard/AdvertisementViewPage';
import AdvertisementCreatePage from './pages/noticeboard/AdvertisementCreatePage';
import AdvertisementEditPage from './pages/noticeboard/AdvertisementEditPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Calendar from './pages/Calendar';
import './App.css';
import MapPage from './pages/MapPage';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import UserProfile from './components/UserProfile';
import CreateNewsPage from './pages/news/CreateNewsPage';
import TimetablePage from './pages/TimetablePage';
import PublicProfile from "@/pages/PublicProfile.tsx";

const AuthLayout: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState<string>('');
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  
  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  
  const handleRegisterSuccess = (successMessage: string) => {
    setMessage(successMessage || t('register.accountCreated'));
    setIsLoginView(true);
  };

  return (
    <div className="app-container">
      <div className="auth-container">
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
            onSwitchToRegister={() => setIsLoginView(false)} 
          />
        ) : (
          <Register 
            onSwitchToLogin={() => setIsLoginView(true)} 
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}
      </div>
    </div>
  );
};

// Protected route component
const ProtectedRoute: React.FC<{element: React.ReactNode, requiredRole?: string}> = ({ element, requiredRole }) => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    return <Navigate to="/home" replace />;
  }

  return <>{element}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />} />
      <Route path="/activate/:token" element={<ActivateAccount />} />
      
      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
      
      {/* Forum Routes */}
      <Route path="/forum" element={<ProtectedRoute element={<ForumPage />} />} />
      <Route path="/forum/threads/:threadId" element={<ProtectedRoute element={<ThreadViewPage />} />} />
      <Route path="/forum/threads/:threadId/edit" element={<ProtectedRoute element={<ThreadEditPage />} />} />
      <Route path="/forum/create-thread" element={<ProtectedRoute element={<ThreadCreatePage />} />} />

      <Route path="/calendar" element={<ProtectedRoute element={<Calendar />} />} />
      <Route path="/timetable" element={<ProtectedRoute element={<TimetablePage />} requiredRole="admin" />} />
      <Route path="/map" element={<ProtectedRoute element={<MapPage />} />} />
      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
      <Route path="/profile/edit" element={<ProtectedRoute element={<EditProfile />} />} />
      <Route path="/profile/:userId" element={<ProtectedRoute element={<UserProfile />} />} />
      
      {/* News Routes */}
      <Route path="/news/create" element={<ProtectedRoute element={<CreateNewsPage />} />} />
      
      {/* Noticeboard Routes */}
      <Route path="/noticeboard" element={<ProtectedRoute element={<NoticeboardPage />} />} />
      <Route path="/noticeboard/create" element={<ProtectedRoute element={<AdvertisementCreatePage />} />} />
      <Route path="/noticeboard/:id" element={<ProtectedRoute element={<AdvertisementViewPage />} />} />
      <Route path="/noticeboard/:id/edit" element={<ProtectedRoute element={<AdvertisementEditPage />} />} />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
    </AuthProvider>
  );
};

export default App;