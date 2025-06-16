import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Lock, Globe } from 'lucide-react';
import { Comment, CommentCreateData } from '../../types/noticeboard';
import { advertisementAPI } from '../../services/noticeboardAPI';
import './CommentForm.css';

interface CommentFormProps {
  advertisementId: number;
  onCommentAdded: (comment: Comment) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ advertisementId, onCommentAdded }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const data: CommentCreateData = {
        content: content.trim(),
        is_public: isPublic,
      };
      
      const comment = await advertisementAPI.createComment(advertisementId, data);
      onCommentAdded(comment);
      
      // Reset form
      setContent('');
      setIsPublic(false);
    } catch (err) {
      setError(t('noticeboard.errors.commentFailed'));
      console.error('Error creating comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>{t('noticeboard.addComment')}</h3>
        <div className="visibility-info">
          {isPublic ? (
            <>
              <Globe size={16} />
              <span>{t('noticeboard.commentVisibleToAll')}</span>
            </>
          ) : (
            <>
              <Lock size={16} />
              <span>{t('noticeboard.commentVisibleToOwner')}</span>
            </>
          )}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('noticeboard.commentPlaceholder')}
        disabled={loading}
        required
      />

      {error && (
        <div className="form-error">{error}</div>
      )}

      <div className="form-actions">
        <div className="visibility-toggle">
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={loading}
            />
            <span>{t('noticeboard.makeCommentPublic')}</span>
          </label>
          <div className="visibility-hint">
            {t('noticeboard.privateByDefault')}
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-button-comment"
          disabled={loading || !content.trim()}
        >
          <Send size={18} />
          {loading ? t('common.sending') : t('common.send')}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;