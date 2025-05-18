import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Thread } from '../../types/forum';
import { formatTimeAgo } from '../../utils/dateUtils';
import { translateCategory } from '../../utils/categories';
import './RedditThreadCard.css';

interface RedditThreadCardProps {
  thread: Thread;
}

const RedditThreadCard: React.FC<RedditThreadCardProps> = ({ thread }) => {
  const { t } = useTranslation();
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);
  const [voteCount, setVoteCount] = useState<number>(Math.floor(Math.random() * 100)); // Simulated vote count

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

  // Default user image path
  const userImagePath = "/user_default_image.png";
  
  return (
    <div className="reddit-thread-card">
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
          <Link to={`/forum/category/${thread.category}`} className="thread-category">
            r/{translateCategory(thread.category, t)}
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
          
          <div className="thread-action">
            <span className="thread-action-icon">💾</span>
            <span>{t('forum.action.save')}</span>
          </div>
          
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

export default RedditThreadCard;