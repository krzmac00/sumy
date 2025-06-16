import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Trash2, Clock, MapPin, DollarSign, User, Phone, Mail, Calendar, RefreshCw, CheckCircle } from 'lucide-react';
import { AdvertisementDetail, Comment } from '../../types/noticeboard';
import { advertisementAPI, formatDate, formatPrice } from '../../services/noticeboardAPI';
import { useAuth } from '../../contexts/AuthContext';
import CommentCard from '../../components/noticeboard/CommentCard';
import CommentForm from '../../components/noticeboard/CommentForm';
import RenewDialog from '../../components/noticeboard/RenewDialog';
import { CATEGORY_COLORS } from '../../types/noticeboard';
import MainLayout from '../../layouts/MainLayout';
import './AdvertisementViewPage.css';

const AdvertisementViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser: user } = useAuth();
  const [advertisement, setAdvertisement] = useState<AdvertisementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAdvertisement();
    }
  }, [id]);

  const fetchAdvertisement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await advertisementAPI.get(parseInt(id!));
      setAdvertisement(data);
    } catch (err) {
      setError(t('noticeboard.errors.fetchFailed'));
      console.error('Error fetching advertisement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!advertisement) return;

    try {
      await advertisementAPI.delete(advertisement.id);
      navigate('/noticeboard');
    } catch (err) {
      setError(t('noticeboard.errors.deleteFailed'));
      console.error('Error deleting advertisement:', err);
    }
  };

  const handleRenew = async (days: number) => {
    if (!advertisement) return;

    try {
      setIsRenewing(true);
      const renewed = await advertisementAPI.renew(advertisement.id, days);
      setAdvertisement({ ...advertisement, ...renewed });
      setShowRenewDialog(false);
      setRenewSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setRenewSuccess(false);
      }, 3000);
    } catch (err) {
      setError(t('noticeboard.errors.renewFailed'));
      console.error('Error renewing advertisement:', err);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCommentAdded = (comment: Comment) => {
    if (advertisement) {
      setAdvertisement({
        ...advertisement,
        comments: [...advertisement.comments, comment],
        comments_count: advertisement.comments_count + 1,
      });
    }
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    if (advertisement) {
      setAdvertisement({
        ...advertisement,
        comments: advertisement.comments.map(c => 
          c.id === updatedComment.id ? updatedComment : c
        ),
      });
    }
  };

  const handleCommentDeleted = (commentId: number) => {
    if (advertisement) {
      setAdvertisement({
        ...advertisement,
        comments: advertisement.comments.filter(c => c.id !== commentId),
        comments_count: advertisement.comments_count - 1,
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-state">{t('common.loading')}</div>
      </MainLayout>
    );
  }

  if (error || !advertisement) {
    return (
      <MainLayout>
        <div className="error-state">
          <p>{error || t('noticeboard.errors.notFound')}</p>
          <button onClick={() => navigate('/noticeboard')}>{t('common.back')}</button>
        </div>
      </MainLayout>
    );
  }

  const isOwner = user?.id === advertisement.author.id;
  const canShowContact = user !== null;

  return (
    <MainLayout>
      <div className="advertisement-view-page">
      <div className="page-header">
        <button className="back-button-advertisment" onClick={() => navigate('/noticeboard')}>
          <ArrowLeft size={20} />
          {t('common.back')}
        </button>
        
        {isOwner && (
          <div className="owner-actions">
            <button className="edit-button" onClick={() => navigate(`/noticeboard/${id}/edit`)}>
              <Edit size={18} />
              {t('common.edit')}
            </button>
            <button className="delete-button" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={18} />
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>

      <div className="advertisement-detail">
        <div className="detail-header">
          <span 
            className="category-badge"
            style={{ backgroundColor: CATEGORY_COLORS[advertisement.category] }}
          >
            {t(`noticeboard.categories.${advertisement.category}`)}
          </span>
          {advertisement.is_expired && (
            <span className="expired-badge">{t('noticeboard.expired')}</span>
          )}
        </div>

        <h1 className="detail-title">{advertisement.title}</h1>

        <div className="detail-meta">
          <div className="meta-item">
            <User size={18} />
            <span>
              {advertisement.author.first_name && advertisement.author.last_name
                ? `${advertisement.author.first_name} ${advertisement.author.last_name}`
                : advertisement.author.login}
            </span>
          </div>
          <div className="meta-item">
            <Calendar size={18} />
            <span>{formatDate(advertisement.created_date)}</span>
          </div>
          {advertisement.location && (
            <div className="meta-item">
              <MapPin size={18} />
              <span>{advertisement.location}</span>
            </div>
          )}
          {advertisement.price !== null && (
            <div className="meta-item">
              <DollarSign size={18} />
              <span>{formatPrice(advertisement.price)}</span>
            </div>
          )}
        </div>

        <div className="detail-content">
          <p>{advertisement.content}</p>
        </div>

        {canShowContact && advertisement.contact_info && (
          <div className="contact-section">
            <h3>{t('noticeboard.contactInfo')}</h3>
            <div className="contact-info">
              {advertisement.contact_info}
            </div>
          </div>
        )}

        {advertisement.expires_at && (
          <div className={`expiration-section ${renewSuccess ? 'renew-success' : ''}`}>
            {renewSuccess ? (
              <>
                <CheckCircle size={18} className="success-icon" />
                <span className="success-text">{t('noticeboard.renewSuccess')}</span>
              </>
            ) : (
              <>
                <Clock size={18} />
                {advertisement.is_expired ? (
                  <span className="expired-text">{t('noticeboard.expiredOn')} {new Date(advertisement.expires_at).toLocaleDateString('pl-PL')}</span>
                ) : (
                  <span>{t('noticeboard.expiresOn')} {new Date(advertisement.expires_at).toLocaleDateString('pl-PL')}</span>
                )}
                {isOwner && !advertisement.is_expired && (
                  <button className="renew-button" onClick={() => setShowRenewDialog(true)}>
                    <RefreshCw size={16} />
                    {t('noticeboard.renew')}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="comments-section">
        <h2>{t('noticeboard.comments')} ({advertisement.comments_count})</h2>
        
        {user && (
          <CommentForm
            advertisementId={advertisement.id}
            onCommentAdded={handleCommentAdded}
          />
        )}

        <div className="comments-list">
          {advertisement.comments.length === 0 ? (
            <p className="no-comments">{t('noticeboard.noComments')}</p>
          ) : (
            advertisement.comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isAdvertisementOwner={isOwner}
                onUpdate={handleCommentUpdated}
                onDelete={handleCommentDeleted}
              />
            ))
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('noticeboard.confirmDelete')}</h3>
            <p>{t('noticeboard.deleteWarning')}</p>
            <div className="dialog-actions">
              <button className="cancel-button-advertisment" onClick={() => setShowDeleteConfirm(false)}>
                {t('common.cancel')}
              </button>
              <button className="confirm-delete-button" onClick={handleDelete}>
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <RenewDialog
        isOpen={showRenewDialog}
        onClose={() => setShowRenewDialog(false)}
        onConfirm={handleRenew}
        currentExpiration={advertisement?.expires_at || ''}
        isRenewing={isRenewing}
      />
    </div>
    </MainLayout>
  );
};

export default AdvertisementViewPage;