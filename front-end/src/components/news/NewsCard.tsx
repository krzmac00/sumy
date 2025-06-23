import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NewsItem } from '../../types/news';
import { formatTimeAgo } from '../../utils/dateUtils';
import { eventAPI } from '../../services/api';
import { CategoryKey } from '../../enums/CategoryKey';
import { RepeatType } from '../../enums/RepeatType';
import { useAuth } from '../../contexts/AuthContext';
import './NewsCard.css';

interface NewsCardProps {
  newsItem: NewsItem;
  onClick?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ newsItem, onClick }) => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventCreated, setEventCreated] = useState(false);
  
  // Check if an event was already created from this news item
  useEffect(() => {
    const createdEvents = localStorage.getItem('createdEventsFromNews');
    if (createdEvents) {
      const parsed = JSON.parse(createdEvents);
      if (parsed.includes(newsItem.id)) {
        setEventCreated(true);
      }
    }
  }, [newsItem.id]);

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
  
  const createEventFromNews = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!newsItem.event_date || !currentUser) return;
    
    setIsCreatingEvent(true);
    
    try {
      const eventData = {
        title: newsItem.title,
        description: newsItem.event_description || newsItem.content.substring(0, 500),
        category: CategoryKey.Private,
        color: '#8b0002',
        repeatType: RepeatType.None,
        start: new Date(newsItem.event_date),
        end: new Date(newsItem.event_end_date || newsItem.event_date),
        schedule_plan: null,
        room: newsItem.event_room || newsItem.event_location || null,
        teacher: newsItem.event_teacher || null
      };
      
      await eventAPI.create(eventData);
      
      // Mark as created in localStorage
      const createdEvents = localStorage.getItem('createdEventsFromNews');
      const parsed = createdEvents ? JSON.parse(createdEvents) : [];
      parsed.push(newsItem.id);
      localStorage.setItem('createdEventsFromNews', JSON.stringify(parsed));
      
      setEventCreated(true);
    } catch (error) {
      console.error('Failed to create event:', error);
      alert(t('news.errors.createEventFailed', 'Failed to create event'));
    } finally {
      setIsCreatingEvent(false);
    }
  };
  
  const hasEventCategory = newsItem.categories.some(cat => cat.category_type === 'event');

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
            <div className="event-details">
              <span className="event-icon">📅</span>
              <span className="event-date">
                {new Date(newsItem.event_date).toLocaleDateString(
                  i18n.language === 'pl' ? 'pl-PL' : 'en-US', 
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }
                )}
              </span>
              {newsItem.event_location && (
                <>
                  <span className="news-separator">•</span>
                  <span className="event-icon">📍</span>
                  <span className="event-location">{newsItem.event_location}</span>
                </>
              )}
            </div>
            
            {hasEventCategory && currentUser && (
              <button
                className={`create-event-button ${eventCreated ? 'event-created' : ''}`}
                onClick={createEventFromNews}
                disabled={isCreatingEvent || eventCreated}
                title={eventCreated ? t('news.eventAlreadyCreated') : t('news.createPrivateEvent')}
              >
                {isCreatingEvent ? (
                  <span className="loading-dots">...</span>
                ) : eventCreated ? (
                  <>✓ {t('news.eventCreated')}</>
                ) : (
                  <>+ {t('news.addToCalendar')}</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCard;