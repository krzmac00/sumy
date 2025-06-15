import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NewsItem } from '../../types/news';
import { formatTimeAgo } from '../../utils/dateUtils';
import './NewsCard.css';

interface NewsCardProps {
  newsItem: NewsItem;
  onClick?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ newsItem, onClick }) => {
  const { t } = useTranslation();

  const getCategoryBadgeClass = (categoryType: string) => {
    switch (categoryType) {
      case 'university':
        return 'category-university';
      case 'faculty':
        return 'category-faculty';
      case 'announcement':
        return 'category-announcement';
      case 'event':
        return 'category-event';
      default:
        return '';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="news-card" onClick={handleCardClick}>
      <div className="news-content">
        <div className="news-header">
          <div className="news-categories">
            {newsItem.categories.map((category) => (
              <span 
                key={category.id} 
                className={`news-category ${getCategoryBadgeClass(category.category_type)}`}
              >
                {t(`news.categories.${category.slug}`, category.name)}
              </span>
            ))}
          </div>
          <span className="news-separator">•</span>
          <span className="news-author">
            {t('common.by')} 
            <Link 
              to={`/profile/${newsItem.author.id}`}
              className="news-author-link"
              onClick={(e) => e.stopPropagation()}
            >
              {newsItem.author.display_name}
            </Link>
          </span>
          <span className="news-separator">•</span>
          <span className="news-time">{formatTimeAgo(newsItem.created_at, t)}</span>
        </div>
        
        <h3 className="news-title">{newsItem.title}</h3>
        
        <div className="news-description">
          {newsItem.content.length > 300 
            ? `${newsItem.content.substring(0, 300)}...` 
            : newsItem.content}
        </div>

        {newsItem.event_date && (
          <div className="news-event-info">
            <span className="event-icon">📅</span>
            <span className="event-date">
              {new Date(newsItem.event_date).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {newsItem.event_location && (
              <>
                <span className="news-separator">•</span>
                <span className="event-icon">📍</span>
                <span className="event-location">{newsItem.event_location}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCard;