import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pinnedThreadService, PinnedThread } from '../../services/pinnedThreadService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { translateCategory } from '../../utils/categories';
import { getMediaUrl } from '../../utils/mediaUrl';
import './PinnedThreads.css';

const PinnedThreads: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pinnedThreads, setPinnedThreads] = useState<PinnedThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPinnedThreads();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPinnedThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const threads = await pinnedThreadService.getPinnedThreads();
      setPinnedThreads(threads);
    } catch (err) {
      console.error('Error loading pinned threads:', err);
      setError(t('pinnedThreads.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = async (pinnedThread: PinnedThread) => {
    // Mark thread as viewed
    try {
      await pinnedThreadService.markThreadAsViewed(pinnedThread.thread);
      // Update local state to reset unread count
      setPinnedThreads(prev => 
        prev.map(pt => 
          pt.id === pinnedThread.id 
            ? { ...pt, unread_count: 0, last_viewed: new Date().toISOString() }
            : pt
        )
      );
    } catch (err) {
      console.error('Error marking thread as viewed:', err);
    }
    
    // Navigate to thread
    navigate(`/forum/threads/${pinnedThread.thread}`);
  };

  const handleUnpin = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await pinnedThreadService.pinThread(threadId);
      // Remove from list
      setPinnedThreads(prev => prev.filter(pt => pt.thread !== threadId));
    } catch (err) {
      console.error('Error unpinning thread:', err);
      setError(t('pinnedThreads.error.unpinFailed'));
    }
  };

  if (loading) {
    return (
      <div className="pinned-threads-container">
        <div className="pinned-threads-loading">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pinned-threads-container">
        <div className="pinned-threads-error">
          <p>{error}</p>
          <button onClick={loadPinnedThreads} className="retry-button">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (pinnedThreads.length === 0) {
    return (
      <div className="pinned-threads-container">
        <div className="pinned-threads-empty">
          <div className="empty-icon">📌</div>
          <h3>{t('pinnedThreads.empty.title')}</h3>
          <p>{t('pinnedThreads.empty.description')}</p>
          <Link to="/forum" className="browse-threads-button">
            {t('pinnedThreads.empty.browseThreads')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pinned-threads-container">
      <div className="pinned-threads-list">
        {pinnedThreads.map((pinnedThread) => {
          const thread = pinnedThread.thread_data;
          const userImagePath = thread.author_profile_thumbnail 
            ? getMediaUrl(thread.author_profile_thumbnail) || "/user_default_image.png"
            : "/user_default_image.png";

          return (
            <div 
              key={pinnedThread.id} 
              className="pinned-thread-card"
              onClick={() => handleThreadClick(pinnedThread)}
            >
              <div className="pinned-thread-header">
                <div className="pinned-thread-meta">
                  <Link 
                    to={`/forum?category=${thread.category}`} 
                    className="pinned-thread-category"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {translateCategory(thread.category, t)}
                  </Link>
                  <span className="meta-separator">•</span>
                  <img src={userImagePath} alt="User" className="pinned-thread-author-image" />
                  <span className="pinned-thread-author">
                    {thread.is_anonymous ? (
                      <>
                        {thread.author_display_name || thread.nickname}
                        <span className="anonymous-badge">{t('forum.anonymous')}</span>
                      </>
                    ) : (
                      <Link 
                        to={`/profile/${thread.user}`} 
                        className="author-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {thread.author_display_name || thread.nickname}
                      </Link>
                    )}
                  </span>
                </div>
                <button 
                  className="unpin-button"
                  onClick={(e) => handleUnpin(pinnedThread.thread, e)}
                  title={t('pinnedThreads.unpin')}
                >
                  📌
                </button>
              </div>

              <h3 className="pinned-thread-title">{thread.title}</h3>
              
              <div className="pinned-thread-content">
                {thread.content.length > 150 
                  ? `${thread.content.substring(0, 150)}...` 
                  : thread.content}
              </div>

              <div className="pinned-thread-footer">
                <div className="pinned-thread-stats">
                  <span className="stat-item">
                    <span className="stat-icon">💬</span>
                    {thread.posts.length} {t('forum.threadList.posts')}
                  </span>
                  <span className="stat-item">
                    <span className="stat-icon">🔥</span>
                    {thread.vote_count} {t('forum.threadList.votes')}
                  </span>
                  {pinnedThread.unread_count > 0 && (
                    <span className="stat-item unread-count">
                      <span className="stat-icon">🔴</span>
                      {pinnedThread.unread_count} {t('pinnedThreads.unread')}
                    </span>
                  )}
                </div>
                <div className="pinned-thread-time">
                  {t('pinnedThreads.lastActivity')}: {formatTimeAgo(thread.last_activity_date, t)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PinnedThreads;