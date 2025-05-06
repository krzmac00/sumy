// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  link: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Main navigation items
  const mainNavItems: SidebarItem[] = [
    { id: 'home', label: t('sidebar.home'), icon: '🏠', link: '/home' },
    { id: 'forum', label: t('sidebar.forum'), icon: '💬', link: '/forum' },
  ];
  
  // Forum navigation items (only shown when in forum section)
  const forumNavItems: SidebarItem[] = [
    { id: 'allThreads', label: t('sidebar.forum.allThreads'), icon: '📚', link: '/forum' },
    { id: 'createThread', label: t('sidebar.forum.createThread'), icon: '➕', link: '/forum/create-thread' },
  ];

  // Utility navigation items
  const utilityItems: SidebarItem[] = [
    { id: 'settings', label: t('sidebar.settings'), icon: '⚙️', link: '#settings' },
  ];
  
  // Check if current route is in the forum section
  const isForumSection = location.pathname.startsWith('/forum');

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>{t('sidebar.title')}</h3>
      </div>
      
      {/* Main Navigation */}
      <div className="sidebar-section">
        <ul className="sidebar-menu">
          {mainNavItems.map(item => (
            <li key={item.id} className={`sidebar-item ${location.pathname === item.link ? 'active' : ''}`}>
              <Link to={item.link} className="sidebar-link">
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Forum Navigation (conditional) */}
      {isForumSection && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('sidebar.forum.title')}</div>
          <ul className="sidebar-menu">
            {forumNavItems.map(item => (
              <li key={item.id} className={`sidebar-item ${location.pathname === item.link ? 'active' : ''}`}>
                <Link to={item.link} className="sidebar-link">
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Utility Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">{t('sidebar.utilities')}</div>
        <ul className="sidebar-menu">
          {utilityItems.map(item => (
            <li key={item.id} className="sidebar-item">
              <Link to={item.link} className="sidebar-link">
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;