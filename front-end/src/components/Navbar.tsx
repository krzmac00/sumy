// src/components/Navbar.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';
import pcLogo from '../assets/pc-logo.svg';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const currentLanguage = i18n.language.substring(0, 2).toUpperCase();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLanguageDropdownOpen(false);
  };

  const toggleLanguageDropdown = () => {
    setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
    if (isUserDropdownOpen) setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    if (isLanguageDropdownOpen) setIsLanguageDropdownOpen(false);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div className="brand">
          <img src={pcLogo} alt="Policonnect Logo" className="logo" />
          <h1 className="brand-name">Policonnect</h1>
        </div>
      </div>
      
      <div className="navbar-center">
        <ul className="nav-tabs">
          <li className="nav-item"><a href="/home">{t('nav.home')}</a></li>
          <li className="nav-item"><a href="/forum">{t('nav.newsfeed')}</a></li>
          <li className="nav-item"><a href="/map">{t('nav.map')}</a></li>
          <li className="nav-item"><a href="/calendar">{t('nav.calendar')}</a></li>
          <li className="nav-item"><a href="/calendar">{t('nav.timetable')}</a></li>
        </ul>
      </div>
      
      <div className="navbar-right">
        <div className="language-selector">
          <button onClick={toggleLanguageDropdown} className="language-button">
            {currentLanguage}
          </button>
          {isLanguageDropdownOpen && (
            <div className="dropdown-menu language-dropdown">
              <button onClick={() => changeLanguage('en')} className={currentLanguage === 'EN' ? 'active' : ''}>
                English
              </button>
              <button onClick={() => changeLanguage('pl')} className={currentLanguage === 'PL' ? 'active' : ''}>
                Polski
              </button>
            </div>
          )}
        </div>
        
        <div className="user-menu">
          <button onClick={toggleUserDropdown} className="user-button">
            <span className="user-icon">👤</span>
            <span className="username">
              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'User'}
            </span>
          </button>
          {isUserDropdownOpen && (
            <div className="dropdown-menu user-dropdown">
              <a href="/profile">{t('user.profile')}</a>
              <a href="#settings">{t('user.settings')}</a>
              <button onClick={handleLogout} className="dropdown-button">
                {t('user.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;