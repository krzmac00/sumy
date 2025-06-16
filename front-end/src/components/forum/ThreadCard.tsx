import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Thread } from '../../types/forum';
import { formatTimeAgo } from '../../utils/dateUtils';
import { translateCategory } from '../../utils/categories';
import { useAuth } from '../../contexts/AuthContext';
import { threadAPI, voteAPI } from '../../services/api';
import { getMediaUrl } from '../../utils/mediaUrl';
import { pinnedThreadService } from '../../services/pinnedThreadService';
import './ThreadCard.css';

interface ThreadCardProps {
  thread: Thread;
  onVoteUpdate?: (threadId: number, newVoteCount: number, userVote: 'upvote' | 'downvote' | null) => void;
  onThreadDeleted?: () => void;
  onPinStatusChange?: (threadId: number, isPinned: boolean) => void;
  initialPinStatus?: boolean;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ thread, onVoteUpdate, onThreadDeleted, onPinStatusChange, initialPinStatus }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [voteStatus, setVoteStatus] = useState<'upvote' | 'downvote' | null>(thread.user_vote);
  const [voteCount, setVoteCount] = useState<number>(thread.vote_count);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [voting, setVoting] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(initialPinStatus || false);
  const [pinning, setPinning] = useState<boolean>(false);

  // Check if current user is the thread creator
  const isThreadCreator = currentUser && thread.user === currentUser.id;

  // Load pin status on component mount only if not provided
  React.useEffect(() => {
    const loadPinStatus = async () => {
      if (currentUser && initialPinStatus === undefined) {
        try {
          const pinned = await pinnedThreadService.getPinStatus(thread.id);
          setIsPinned(pinned);
        } catch (err) {
          // Ignore errors - assume not pinned
        }
      }
    };
    loadPinStatus();
  }, [thread.id, currentUser, initialPinStatus]);

  // Update local state when initialPinStatus changes
  React.useEffect(() => {
    if (initialPinStatus !== undefined) {
      setIsPinned(initialPinStatus);
    }
  }, [initialPinStatus]);

  const handleVote = async (voteType: 'upvote' | 'downvote', e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError(t('forum.error.loginRequired'));
      return;
    }

    if (!thread.can_vote) {
      setError(t('forum.error.cannotVoteOwnThread'));
      return;
    }

    if (voting) return;

    try {
      setVoting(true);
      setError(null);
      
      const response = await voteAPI.voteThread(thread.id, voteType);
      
      setVoteCount(response.vote_count);
      setVoteStatus(response.user_vote);
      
      // Notify parent component of vote update
      onVoteUpdate?.(thread.id, response.vote_count, response.user_vote);
      
    } catch (err) {
      console.error('Error voting on thread:', err);
      setError(err instanceof Error ? err.message : t('forum.error.voteGeneric'));
    } finally {
      setVoting(false);
    }
  };

  const handleUpvote = (e: React.MouseEvent) => handleVote('upvote', e);
  const handleDownvote = (e: React.MouseEvent) => handleVote('downvote', e);

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/forum/threads/${thread.id}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await threadAPI.delete(thread.id);
      // Call the refresh function if provided
      if (onThreadDeleted) {
        onThreadDeleted();
      }
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

  const handlePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError(t('forum.error.loginRequired'));
      return;
    }

    if (pinning) return;

    try {
      setPinning(true);
      setError(null);
      
      const response = await pinnedThreadService.pinThread(thread.id);
      const newPinStatus = response.status === 'pinned';
      setIsPinned(newPinStatus);
      
      // Notify parent component of pin status change
      onPinStatusChange?.(thread.id, newPinStatus);
      
    } catch (err) {
      console.error('Error pinning thread:', err);
      setError(err instanceof Error ? err.message : t('forum.error.pinGeneric'));
    } finally {
      setPinning(false);
    }
  };

  // Get user image path - use profile thumbnail if available, otherwise default
  const userImagePath = thread.author_profile_thumbnail 
    ? getMediaUrl(thread.author_profile_thumbnail) || "/user_default_image.png"
    : "/user_default_image.png";
  
  return (
    <div className="thread-card">
      <div className="vote-section">
        <button 
          className={`upvote-button ${voteStatus === 'upvote' ? 'upvote-active' : ''} ${!thread.can_vote || voting ? 'vote-disabled' : ''}`}
          onClick={handleUpvote}
          disabled={!thread.can_vote || voting}
          aria-label={t('forum.action.upvote')}
        >
          ▲
        </button>
        <span className="vote-count">{voteCount}</span>
        <button 
          className={`downvote-button ${voteStatus === 'downvote' ? 'downvote-active' : ''} ${!thread.can_vote || voting ? 'vote-disabled' : ''}`}
          onClick={handleDownvote}
          disabled={!thread.can_vote || voting}
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
            {t('forum.threadList.by')} {thread.is_anonymous ? (
              <>
                {thread.author_display_name || thread.nickname}
                <span className="anonymous-badge">{t('forum.anonymous')}</span>
              </>
            ) : (
              <Link 
                to={`/profile/${thread.user}`} 
                className="thread-author-link"
                onClick={(e) => e.stopPropagation()}
              >
                {thread.author_display_name || thread.nickname}
              </Link>
            )}
          </span>
          <span className="thread-separator">•</span>
          <span className="thread-time">{formatTimeAgo(thread.last_activity_date, t)}</span>
        </div>
        
        <h3 className="thread-title">
          <Link to={`/forum/threads/${thread.id}`}>{thread.title}</Link>
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

          <div className="thread-action" onClick={handlePin}>
            <span className="thread-action-icon">{isPinned ? '📍' : '📌'}</span>
            <span>{isPinned ? t('forum.action.unpin') : t('forum.action.pin')}</span>
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