import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Thread } from '../../types/forum';
import { formatTimeAgo } from '../../utils/dateUtils';
import { translateCategory } from '../../utils/categories';
import { useAuth } from '../../contexts/AuthContext';
import { threadAPI } from '../../services/api';
import './ThreadCard.css';

interface ThreadCardProps {
  thread: Thread;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ thread }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);
  const [voteCount, setVoteCount] = useState<number>(Math.floor(Math.random() * 100)); // Simulated vote count
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);

  // Check if current user is the thread creator
  const isThreadCreator = currentUser && thread.user === currentUser.id;

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (voteStatus === 'up') {
      setVoteStatus(null);
      setVoteCount(prev => prev - 1);
    } else {
      setVoteStatus('up');
      setVoteCount(prev => prev + (voteStatus === 'down' ? 2 : 1));
    }
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (voteStatus === 'down') {
      setVoteStatus(null);
      setVoteCount(prev => prev + 1);
    } else {
      setVoteStatus('down');
      setVoteCount(prev => prev - (voteStatus === 'up' ? 2 : 1));
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/forum/threads/${thread.post}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await threadAPI.delete(thread.post);
      navigate('/forum');
    } catch (err) {
      console.error('Error deleting thread:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('forum.thread.errorDelete'));
      }
      setConfirmingDelete(false);
    }
  };

  // Default user image path
  const userImagePath = "/user_default_image.png";
  
  return (
    <div className="thread-card">
      <div className="vote-section">
        <button 
          className={`upvote-button ${voteStatus === 'up' ? 'upvote-active' : ''}`}
          onClick={handleUpvote}
          aria-label={t('forum.action.upvote')}
        >
          ▲
        </button>
        <span className="vote-count">{voteCount}</span>
        <button 
          className={`downvote-button ${voteStatus === 'down' ? 'downvote-active' : ''}`}
          onClick={handleDownvote}
          aria-label={t('forum.action.downvote')}
        >
          ▼
        </button>
      </div>
      
      <div className="thread-content">
        <div className="thread-header">
          <Link to={`/forum?category=${thread.category}`} className="thread-category">
            {translateCategory(thread.category, t)}
          </Link>
          <span className="thread-separator">•</span>
          <img src={userImagePath} alt="User" className="thread-author-image" />
          <span className="thread-author">
            {t('forum.threadList.by')} {thread.author_display_name || thread.nickname}
            {thread.is_anonymous && <span className="anonymous-badge">{t('forum.anonymous')}</span>}
          </span>
          <span className="thread-separator">•</span>
          <span className="thread-time">{formatTimeAgo(thread.last_activity_date, t)}</span>
        </div>
        
        <h3 className="thread-title">
          <Link to={`/forum/threads/${thread.post}`}>{thread.title}</Link>
        </h3>
        
        <div className="thread-description">
          {thread.content.length > 300 
            ? `${thread.content.substring(0, 300)}...` 
            : thread.content}
        </div>
        
        <div className="thread-footer">
          {error && <div className="thread-error">{error}</div>}

          <div className="thread-action">
            <span className="thread-action-icon">💬</span>
            <span>
              {thread.posts.length} {thread.posts.length === 1
                ? t('forum.threadList.post')
                : t('forum.threadList.posts')}
            </span>
          </div>

          <div className="thread-action">
            <span className="thread-action-icon">🔄</span>
            <span>{t('forum.action.share')}</span>
          </div>

          {/* Only show edit option for thread creator */}
          {isThreadCreator && (
            <div className="thread-action" onClick={handleEdit}>
              <span className="thread-action-icon">✏️</span>
              <span>{t('forum.thread.edit')}</span>
            </div>
          )}

          {/* Only show delete option for thread creator */}
          {isThreadCreator && !confirmingDelete ? (
            <div className="thread-action" onClick={(e) => {
              e.preventDefault();
              setConfirmingDelete(true);
            }}>
              <span className="thread-action-icon">🗑️</span>
              <span>{t('forum.thread.delete')}</span>
            </div>
          ) : isThreadCreator && confirmingDelete ? (
            <div className="delete-confirmation">
              <span>{t('forum.thread.confirmDelete')}</span>
              <button
                className="confirm-delete-yes"
                onClick={handleDelete}
              >
                {t('forum.thread.confirmYes')}
              </button>
              <button
                className="confirm-delete-no"
                onClick={(e) => {
                  e.preventDefault();
                  setConfirmingDelete(false);
                }}
              >
                {t('forum.thread.confirmNo')}
              </button>
            </div>
          ) : null}

          <div className="thread-action">
            <span className="thread-action-icon">ℹ️</span>
            <span>{t('forum.action.info')}</span>
          </div>
        </div>
      </div>
      
      {/* Optional thumbnail - can be used for posts with images */}
      {/*
      <div 
        className="thread-thumbnail" 
        style={{ backgroundImage: `url(${thread.thumbnail || ''})` }}
      />
      */}
    </div>
  );
};

export default ThreadCard;