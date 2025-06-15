import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, MessageCircle, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Advertisement, CATEGORY_COLORS } from '../../types/noticeboard';
import { formatDate, formatPrice } from '../../services/noticeboardAPI';
import './AdvertisementCard.css';

interface AdvertisementCardProps {
  advertisement: Advertisement;
  onClick: () => void;
}

const AdvertisementCard: React.FC<AdvertisementCardProps> = ({ advertisement, onClick }) => {
  const { t } = useTranslation();


  const isExpiringSoon = () => {
    if (!advertisement.expires_at) return false;
    const expiresDate = new Date(advertisement.expires_at);
    const now = new Date();
    const diffDays = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  // Safety check for missing data
  if (!advertisement) {
    return null;
  }

  // Additional safety checks
  if (!advertisement.title || !advertisement.author) {
    // Missing required fields
  }

  return (
    <div 
      className={`advertisement-card ${advertisement.is_expired ? 'expired' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <span 
          className="category-badge"
          style={{ backgroundColor: CATEGORY_COLORS[advertisement.category] }}
        >
          {t(`noticeboard.categories.${advertisement.category}`)}
        </span>
        {advertisement.is_expired && (
          <span className="expired-badge">
            <AlertCircle size={16} />
            {t('noticeboard.expired')}
          </span>
        )}
        {isExpiringSoon() && !advertisement.is_expired && (
          <span className="expiring-badge">
            <Clock size={16} />
            {t('noticeboard.expiringSoon')}
          </span>
        )}
      </div>

      <h3 className="card-title">{advertisement.title}</h3>
      
      <p className="card-content">{advertisement.content}</p>

      <div className="card-meta">
        {advertisement.price !== null && (
          <div className="meta-item">
            <DollarSign size={16} />
            <span>{formatPrice(advertisement.price)}</span>
          </div>
        )}
        
        {advertisement.location && (
          <div className="meta-item">
            <MapPin size={16} />
            <span>{advertisement.location}</span>
          </div>
        )}
        
        <div className="meta-item">
          <Calendar size={16} />
          <span>{formatDate(advertisement.created_date)}</span>
        </div>
        
        <div className="meta-item">
          <MessageCircle size={16} />
          <span>{advertisement.comments_count}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="author-info">
          <span className="author-label">{t('common.by')}</span>
          <span className="author-name">
            {advertisement.author.first_name && advertisement.author.last_name
              ? `${advertisement.author.first_name} ${advertisement.author.last_name}`
              : advertisement.author.login}
          </span>
        </div>
        
        {advertisement.expires_at && !advertisement.is_expired && (
          <div className="expires-info">
            <span>{t('noticeboard.expiresOn')}: {new Date(advertisement.expires_at).toLocaleDateString('pl-PL')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertisementCard;