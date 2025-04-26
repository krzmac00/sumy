// src/components/Sidebar.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();
  
  // This will be filled with actual routes based on the current page
  const sidebarItems = [
    { id: 'item1', label: t('sidebar.item1'), icon: '📄', link: '#item1' },
    { id: 'item2', label: t('sidebar.item2'), icon: '📊', link: '#item2' },
    { id: 'item3', label: t('sidebar.item3'), icon: '🔍', link: '#item3' },
    { id: 'item4', label: t('sidebar.item4'), icon: '⚙️', link: '#item4' },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>{t('sidebar.title')}</h3>
      </div>
      
      <ul className="sidebar-menu">
        {sidebarItems.map(item => (
          <li key={item.id} className="sidebar-item">
            <a href={item.link} className="sidebar-link">
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-text">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;