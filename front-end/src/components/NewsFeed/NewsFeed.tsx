import React from 'react';
import { useTranslation } from 'react-i18next';
import './NewsFeed.css';

const NewsFeed: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="news-feed">
      <div className="news-feed-header">
        <h2>{t('home.newsFeed.title', 'Aktualności')}</h2>
      </div>
      <div className="news-feed-content">
        <div className="empty-state">
          <svg 
            className="empty-state-icon" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" 
            />
          </svg>
          <p className="empty-state-text">
            {t('home.newsFeed.empty', 'Brak aktualności do wyświetlenia')}
          </p>
          <p className="empty-state-subtext">
            {t('home.newsFeed.checkBack', 'Sprawdź ponownie później')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsFeed;