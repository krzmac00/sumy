import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Post } from '../../types/forum';
import { postAPI } from '../../services/api';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  isOriginalPost?: boolean;
  replyingToPosts?: Post[];
  allPosts: Post[];
  onReply: (postId: number) => void;
  onReplyMultiple: (selectedPostIds: number[]) => void;
  onRefresh: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  isOriginalPost = false,
  replyingToPosts = [],
  allPosts,
  onReply,
  onReplyMultiple,
  onRefresh
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>(post.content);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(t('forum.post.errorDelete'));
    }
  };

  // Find posts this post is replying to
  const repliedToPosts = allPosts.filter(p => post.replying_to.includes(p.id));

  return (
    <div className={`post-card ${isOriginalPost ? 'original-post' : ''}`}>
      {/* Replied to post references */}
      {repliedToPosts.length > 0 && (
        <div className="replied-to-container">
          <div className="replied-to-label">{t('forum.post.repliesTo')}</div>
          <div className="replied-to-posts">
            {repliedToPosts.map(repliedPost => (
              <div key={repliedPost.id} className="replied-to-post">
                <span className="replied-to-author">{repliedPost.nickname}</span>
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

      <div className="post-header">
        <div className="post-author">{post.nickname}</div>
        <div className="post-meta">
          <div className="post-date">{formatDate(post.date)}</div>
          {post.was_edited && (
            <div className="post-edited">{t('forum.post.edited')}</div>
          )}
        </div>
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

      <div className="post-actions">
        <button
          className="post-action-button"
          onClick={() => onReply(post.id)}
        >
          {t('forum.post.reply')}
        </button>
        <button
          className="post-action-button"
          onClick={() => setIsEditing(true)}
        >
          {t('forum.post.edit')}
        </button>
        
        {!confirmingDelete ? (
          <button
            className="post-action-button delete"
            onClick={() => setConfirmingDelete(true)}
          >
            {t('forum.post.delete')}
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default PostCard;