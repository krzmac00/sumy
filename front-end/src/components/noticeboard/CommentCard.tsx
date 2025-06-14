import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Globe, Edit2, Trash2, User } from 'lucide-react';
import { Comment } from '../../types/noticeboard';
import { commentAPI, formatDate } from '../../services/noticeboardAPI';
import { useAuth } from '../../contexts/AuthContext';
import './CommentCard.css';

interface CommentCardProps {
  comment: Comment;
  isAdvertisementOwner: boolean;
  onUpdate: (comment: Comment) => void;
  onDelete: (commentId: number) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ 
  comment, 
  isAdvertisementOwner, 
  onUpdate, 
  onDelete 
}) => {
  const { t } = useTranslation();
  const { currentUser: user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user?.id === comment.author.id;
  const canEdit = comment.can_edit && isOwner;
  const canToggleVisibility = isOwner;

  const handleSaveEdit = async () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updated = await commentAPI.update(comment.id, { content: editContent.trim() });
      onUpdate(updated);
      setIsEditing(false);
    } catch (err) {
      setError(t('noticeboard.errors.updateFailed'));
      console.error('Error updating comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('noticeboard.confirmDeleteComment'))) return;

    try {
      setLoading(true);
      await commentAPI.delete(comment.id);
      onDelete(comment.id);
    } catch (err) {
      setError(t('noticeboard.errors.deleteFailed'));
      console.error('Error deleting comment:', err);
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      setLoading(true);
      setError(null);
      const updated = await commentAPI.toggleVisibility(comment.id);
      onUpdate(updated);
    } catch (err) {
      setError(t('noticeboard.errors.updateFailed'));
      console.error('Error toggling visibility:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-card">
      <div className="comment-header">
        <div className="comment-author">
          <User size={16} />
          <span className="author-name">
            {comment.author.first_name && comment.author.last_name
              ? `${comment.author.first_name} ${comment.author.last_name}`
              : comment.author.login}
          </span>
          {isAdvertisementOwner && !isOwner && (
            <span className="owner-badge">{t('noticeboard.advertisementOwner')}</span>
          )}
        </div>
        
        <div className="comment-meta">
          <span className="comment-date">{formatDate(comment.created_date)}</span>
          {comment.was_edited && (
            <span className="edited-badge">{t('common.edited')}</span>
          )}
          <button
            className={`visibility-badge ${comment.is_public ? 'public' : 'private'}`}
            onClick={canToggleVisibility ? handleToggleVisibility : undefined}
            disabled={!canToggleVisibility || loading}
            title={canToggleVisibility ? t('noticeboard.toggleVisibility') : ''}
          >
            {comment.is_public ? <Globe size={14} /> : <Lock size={14} />}
            {comment.is_public ? t('noticeboard.public') : t('noticeboard.private')}
          </button>
        </div>
      </div>

      <div className="comment-body">
        {isEditing ? (
          <div className="edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder={t('noticeboard.commentPlaceholder')}
              disabled={loading}
            />
            <div className="edit-actions">
              <button 
                className="cancel-button" 
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                  setError(null);
                }}
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button 
                className="save-button" 
                onClick={handleSaveEdit}
                disabled={loading || !editContent.trim()}
              >
                {loading ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-content">{comment.content}</p>
        )}
      </div>

      {error && (
        <div className="comment-error">{error}</div>
      )}

      {canEdit && !isEditing && (
        <div className="comment-actions">
          <button 
            className="edit-button" 
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            <Edit2 size={14} />
            {t('common.edit')}
          </button>
          <button 
            className="delete-button" 
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 size={14} />
            {t('common.delete')}
          </button>
        </div>
      )}

      {!comment.is_public && isAdvertisementOwner && !isOwner && (
        <div className="private-comment-notice">
          {t('noticeboard.privateCommentNotice')}
        </div>
      )}
    </div>
  );
};

export default CommentCard;