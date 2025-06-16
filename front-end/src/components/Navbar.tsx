// src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMediaUrl } from '../utils/mediaUrl';
import './Navbar.css';
import pcLogo from '../assets/pc-logo.svg';

interface NavbarProps {
  toggleSidebar: () => void;
}

interface UserSuggestion {
  id: number;
  first_name: string;
  last_name: string;
  index_number: string;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number>(null);

  // Ustawienie wyświetlanej nazwy
  useEffect(() => {
    if (currentUser) {
      setDisplayName(`${currentUser.first_name} ${currentUser.last_name}`);
    }
  }, [currentUser]);

  // Obsługa kliknięcia poza wyszukiwarką
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Funkcja wykonująca zapytanie debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    debounceRef.current = window.setTimeout(() => {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      fetch(`http://localhost:8000/api/accounts/users/search/?q=${encodeURIComponent(query)}`, {
        headers
      })
        .then(res => res.json())
        .then((data: UserSuggestion[]) => {
          setSuggestions(data);
          setShowDropdown(true);
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 300);
  }, [query]);

  const onSelect = (user: UserSuggestion) => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    navigate(`/profile/${user.id}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Język i menu użytkownika (bez zmian)
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

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {/* <button className="sidebar-toggle" onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button> */}
       
        
        <div className="brand">
          <img src={pcLogo} alt="Policonnect Logo" className="logo" />
          <h1 className="brand-name">PoliConnect</h1>
        </div>
      </div>

      <div className="navbar-center">
        <ul className="nav-tabs">
          <li className="nav-item"><a href="/home">{t('nav.home')}</a></li>
          <li className="nav-item"><a href="/forum">{t('nav.forum')}</a></li>
          <li className="nav-item"><a href="/noticeboard">{t('nav.noticeboard')}</a></li>
          <li className="nav-item"><a href="/map">{t('nav.map')}</a></li>
          <li className="nav-item"><a href="/calendar">{t('nav.calendar')}</a></li>
          {/* pokaże timetable tylko dla admina */}
          {currentUser?.role === 'admin' && (
            <li className="nav-item">
              <a href="/timetable">{t('nav.timetable')}</a>
            </li>
          )}
        </ul>
      </div>

      <div className="navbar-right">
        {/* Pole wyszukiwarki */}
        <div className="user-search" ref={searchRef}>
          <input
            type="text"
            className="search-input"
            placeholder={t('nav.search') || 'Szukaj...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query && setShowDropdown(true)}
            onKeyDown={e => {
            if (e.key === 'Enter' && suggestions.length > 0) {
              e.preventDefault();
              onSelect(suggestions[0]);
            }
          }}
          />
          {isSearching && <div className="loader-spinner" />}
          {showDropdown && suggestions.length > 0 && (
            <ul className="search-dropdown">
              {suggestions.map(user => (
                <li
                  key={user.id}
                  className="search-item"
                  onClick={() => onSelect(user)}
                >
                  {user.first_name} {user.last_name} ({user.index_number})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Wybór języka */}
        <div className="language-selector">
          <button onClick={toggleLanguageDropdown} className="language-button">
            {currentLanguage}
          </button>
          {isLanguageDropdownOpen && (
            <div className="dropdown-menu language-dropdown">
              <button
                onClick={() => changeLanguage('en')}
                className={currentLanguage === 'EN' ? 'active' : ''}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('pl')}
                className={currentLanguage === 'PL' ? 'active' : ''}
              >
                Polski
              </button>
            </div>
          )}
        </div>

        {/* Menu użytkownika */}
        <div className="user-menu">
          <button onClick={toggleUserDropdown} className="user-button">
            <span className="user-icon">
              {currentUser?.profile_thumbnail_url ? (
                <img 
                  src={getMediaUrl(currentUser.profile_thumbnail_url) || ''} 
                  alt={`${currentUser.first_name} ${currentUser.last_name}`}
                  className="user-avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('d-none');
                  }}
                />
              ) : null}
              <i className={`fas fa-user-circle ${currentUser?.profile_thumbnail_url ? 'd-none' : ''}`}></i>
            </span>
            <span className="username">
              {currentUser ? displayName : 'User'}
            </span>
          </button>
          {isUserDropdownOpen && (
            <div className="dropdown-menu user-dropdown">
              <a href="/profile">{t('user.profile')}</a>
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
