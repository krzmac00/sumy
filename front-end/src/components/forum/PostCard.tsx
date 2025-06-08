import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Post } from '../../types/forum';
import { postAPI, voteAPI } from '../../services/api';
import { formatTimeAgo } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  isOriginalPost?: boolean;
  replyingToPosts?: Post[];
  allPosts: Post[];
  onReply: (postId: number) => void;
  onReplyMultiple: (selectedPostIds: number[]) => void;
  onRefresh: () => void;
  onVoteUpdate?: (postId: number, newVoteCount: number, userVote: 'upvote' | 'downvote' | null) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  isOriginalPost = false,
  replyingToPosts = [],
  allPosts,
  onReply,
  // onReplyMultiple,
  onRefresh,
  onVoteUpdate
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>(post.content);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [voteStatus, setVoteStatus] = useState<'upvote' | 'downvote' | null>(post.user_vote);
  const [voteCount, setVoteCount] = useState<number>(post.vote_count);
  const [voting, setVoting] = useState<boolean>(false);

  // Check if current user is the post creator
  const isPostCreator = currentUser && post.user === currentUser.id;

  // Default user image path
  const userImagePath = "/user_default_image.png";

  const handleVote = async (voteType: 'upvote' | 'downvote', e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError(t('forum.error.loginRequired'));
      return;
    }

    if (!post.can_vote) {
      setError(t('forum.error.cannotVoteOwnPost'));
      return;
    }

    if (voting) return;

    try {
      setVoting(true);
      setError(null);
      
      const response = await voteAPI.votePost(post.id, voteType);
      
      setVoteCount(response.vote_count);
      setVoteStatus(response.user_vote);
      
      // Notify parent component of vote update
      onVoteUpdate?.(post.id, response.vote_count, response.user_vote);
      
    } catch (err) {
      console.error('Error voting on post:', err);
      setError(err instanceof Error ? err.message : t('forum.error.voteGeneric'));
    } finally {
      setVoting(false);
    }
  };

  const handleUpvote = (e: React.MouseEvent) => handleVote('upvote', e);
  const handleDownvote = (e: React.MouseEvent) => handleVote('downvote', e);

  const handleEditSubmit = async () => {
    if (!editContent.trim()) {
      setError(t('forum.post.errorEmptyContent'));
      return;
    }

    try {
      await postAPI.update(post.id, { content: editContent });
      setIsEditing(false);
      setError(null);
      onRefresh(); // Refresh thread data
    } catch (err) {
      console.error('Error updating post:', err);
      setError(t('forum.post.errorUpdate'));
    }
  };

  const handleDelete = async () => {
    try {
      await postAPI.delete(post.id);
      onRefresh(); // Refresh thread data
      setConfirmingDelete(false);
    } catch (err) {
      console.error('Error deleting post:', err);
      // Show the error message from the API if available
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('forum.post.errorDelete'));
      }
      setConfirmingDelete(false);
    }
  };

  // Find posts this post is replying to
  const repliedToPosts = allPosts.filter(p => post.replying_to.includes(p.id));

  return (
    <div className={`thread-card ${isOriginalPost ? 'original-post' : ''}`}>
      <div className="vote-section">
        <button 
          className={`upvote-button ${voteStatus === 'upvote' ? 'upvote-active' : ''} ${!post.can_vote || voting ? 'vote-disabled' : ''}`}
          onClick={handleUpvote}
          disabled={!post.can_vote || voting}
          aria-label={t('forum.action.upvote')}
        >
          ▲
        </button>
        <span className="vote-count">{voteCount}</span>
        <button 
          className={`downvote-button ${voteStatus === 'downvote' ? 'downvote-active' : ''} ${!post.can_vote || voting ? 'vote-disabled' : ''}`}
          onClick={handleDownvote}
          disabled={!post.can_vote || voting}
          aria-label={t('forum.action.downvote')}
        >
          ▼
        </button>
      </div>
      
      <div className="thread-content">
      {/* Replied to post references */}
      {repliedToPosts.length > 0 && (
        <div className="replied-to-container">
          <div className="replied-to-label">{t('forum.post.repliesTo')}</div>
          <div className="replied-to-posts">
            {repliedToPosts.map(repliedPost => (
              <div key={repliedPost.id} className="replied-to-post">
                <span className="replied-to-author">
                  {repliedPost.user_display_name || repliedPost.nickname}
                  {repliedPost.is_anonymous && <span className="anonymous-badge">{t('forum.anonymous')}</span>}
                </span>
                <span className="replied-to-preview">
                  {repliedPost.content.length > 50
                    ? `${repliedPost.content.substring(0, 50)}...`
                    : repliedPost.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply reference arrows for posts replying to this post */}
      {replyingToPosts.length > 0 && (
        <div className="replying-posts-info">
          <span className="replies-count">
            {replyingToPosts.length} {replyingToPosts.length === 1
              ? t('forum.post.reply')
              : t('forum.post.replies')}
          </span>
        </div>
      )}

        <div className="thread-header">
          <img src={userImagePath} alt="User" className="thread-author-image" />
          <span className="thread-author">
            {post.user_display_name || post.nickname}
            {post.is_anonymous && <span className="anonymous-badge">{t('forum.anonymous')}</span>}
          </span>
          <span className="thread-separator">•</span>
          <span className="thread-time">{formatTimeAgo(post.date, t)}</span>
          {post.was_edited && (
            <>
              <span className="thread-separator">•</span>
              <span className="post-edited">{t('forum.post.edited')}</span>
            </>
          )}
        </div>

      <div className="post-content">
        {isEditing ? (
          <div className="post-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              className="post-edit-textarea"
            />
            {error && <div className="post-edit-error">{error}</div>}
            <div className="post-edit-actions">
              <button
                className="post-edit-cancel"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(post.content);
                  setError(null);
                }}
              >
                {t('forum.post.cancelEdit')}
              </button>
              <button
                className="post-edit-save"
                onClick={handleEditSubmit}
              >
                {t('forum.post.saveEdit')}
              </button>
            </div>
          </div>
        ) : (
          post.content
        )}
      </div>

        <div className="thread-footer">
          {error && <div className="post-error">{error}</div>}

          <div className="thread-action" onClick={() => onReply(post.id)}>
            <span className="thread-action-icon">💬</span>
            <span>{t('forum.post.reply')}</span>
          </div>

          {/* Only show edit option for post creator */}
          {isPostCreator && (
            <div className="thread-action" onClick={() => setIsEditing(true)}>
              <span className="thread-action-icon">✏️</span>
              <span>{t('forum.post.edit')}</span>
            </div>
          )}

          {/* Only show delete option for post creator */}
          {isPostCreator && !confirmingDelete ? (
            <div className="thread-action" onClick={() => setConfirmingDelete(true)}>
              <span className="thread-action-icon">🗑️</span>
              <span>{t('forum.post.delete')}</span>
            </div>
          ) : isPostCreator && confirmingDelete ? (
            <div className="delete-confirmation">
              <span>{t('forum.post.confirmDelete')}</span>
              <button
                className="confirm-delete-yes"
                onClick={handleDelete}
              >
                {t('forum.post.confirmYes')}
              </button>
              <button
                className="confirm-delete-no"
                onClick={() => setConfirmingDelete(false)}
              >
                {t('forum.post.confirmNo')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PostCard;