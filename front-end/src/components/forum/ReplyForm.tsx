import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Post } from '../../types/forum';
import { postAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './ReplyForm.css';

interface ReplyFormProps {
  threadId: number;
  replyingTo: number[];
  posts: Post[];
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({
  threadId,
  replyingTo,
  posts,
  onSubmitSuccess,
  onCancel
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [nickname, setNickname] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Try to get the nickname from localStorage or previous post
  useEffect(() => {
    const savedNickname = localStorage.getItem('forumNickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (isAnonymous && !nickname.trim()) {
      setError(t('forum.reply.errorNickname'));
      return;
    }

    if (!content.trim()) {
      setError(t('forum.reply.errorContent'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Save nickname for future use if anonymous
      if (isAnonymous && nickname) {
        localStorage.setItem('forumNickname', nickname);
      }
      
      const postData = {
        // Use a default nickname if not anonymous or nickname is empty
        nickname: isAnonymous ? nickname : "Anonymous User",
        content,
        thread: threadId,
        replying_to: replyingTo.length > 0 ? replyingTo : [],
        is_anonymous: isAnonymous
      };
      
      console.log('Submitting post data:', postData);
      
      await postAPI.create(postData);
      
      // Clear form and notify parent
      setContent('');
      onSubmitSuccess();
    } catch (err) {
      console.error('Error creating reply:', err);
      if (err instanceof Error) {
        setError(`${t('forum.reply.errorSubmit')}: ${err.message}`);
      } else {
        setError(t('forum.reply.errorSubmit'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the posts being replied to
  const replyingToPosts = posts.filter(post => replyingTo.includes(post.id));

  return (
    <div className="reply-form-container">
      {replyingToPosts.length > 0 && (
        <div className="replying-to-info">
          <h4>{t('forum.reply.replyingTo')}</h4>
          <div className="replying-to-posts">
            {replyingToPosts.map(post => (
              <div key={post.id} className="replying-to-post">
                <div className="replying-to-author">{post.nickname}:</div>
                <div className="replying-to-content">
                  {post.content.length > 100
                    ? `${post.content.substring(0, 100)}...`
                    : post.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="reply-form">
        <h3 className="reply-form-title">
          {replyingTo.length > 0 
            ? t('forum.reply.title.withReplies', { count: replyingTo.length }) 
            : t('forum.reply.title.newPost')}
        </h3>
        
        <div className="form-group">
          <div className="form-check">
            <input
              id="reply-anonymous"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="form-check-input"
              disabled={isSubmitting}
            />
            <label className="form-check-label" htmlFor="reply-anonymous">
              {t('forum.reply.postAnonymously')}
            </label>
            <small className="form-text text-muted">
              {currentUser ? t('forum.reply.anonymousDescription') : t('forum.reply.anonymousRequired')}
            </small>
          </div>
        </div>
        
        {isAnonymous && (
          <div className="form-group">
            <label htmlFor="reply-nickname">{t('forum.reply.nickname')}</label>
            <input
              id="reply-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('forum.reply.nicknamePlaceholder')}
              className="reply-input"
              disabled={isSubmitting}
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="reply-content">{t('forum.reply.content')}</label>
          <textarea
            id="reply-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('forum.reply.contentPlaceholder')}
            rows={5}
            className="reply-textarea"
            disabled={isSubmitting}
          />
        </div>

        {error && <div className="reply-error">{error}</div>}

        <div className="reply-form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('forum.reply.cancel')}
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? t('forum.reply.submitting') 
              : t('forum.reply.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReplyForm;