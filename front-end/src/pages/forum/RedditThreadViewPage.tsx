import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import RedditPostCard from '../../components/forum/RedditPostCard';
import ReplyForm from '../../components/forum/ReplyForm';
import { Thread, Post } from '../../types/forum';
import { threadAPI } from '../../services/api';
import { formatTimeAgo } from '../../utils/dateUtils';
import './ThreadViewPage.css';

const RedditThreadViewPage: React.FC = () => {
  const { t } = useTranslation();
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number[]>([]);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);
  const [voteCount, setVoteCount] = useState<number>(Math.floor(Math.random() * 100)); // Simulated vote count

  // Default user image path
  const userImagePath = "/user_default_image.png";

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    if (!threadId) return;
    
    try {
      setLoading(true);
      setError(null);
      const threadData = await threadAPI.getOne(parseInt(threadId));
      setThread(threadData);
    } catch (err) {
      console.error('Error fetching thread:', err);
      setError(t('forum.error.fetchThread'));
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (postId: number) => {
    setReplyingTo([postId]);
    setShowReplyForm(true);
    setMultiSelectMode(false);
    setSelectedPosts([]);
    // Scroll to reply form
    window.setTimeout(() => {
      const replyForm = document.getElementById('reply-form');
      replyForm?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleMultipleReply = () => {
    if (selectedPosts.length > 0) {
      setReplyingTo(selectedPosts);
      setShowReplyForm(true);
      setMultiSelectMode(false);
      // Scroll to reply form
      window.setTimeout(() => {
        const replyForm = document.getElementById('reply-form');
        replyForm?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const togglePostSelection = (postId: number) => {
    setSelectedPosts(prevSelected => {
      if (prevSelected.includes(postId)) {
        return prevSelected.filter(id => id !== postId);
      } else {
        return [...prevSelected, postId];
      }
    });
  };

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    setReplyingTo([]);
    fetchThread(); // Refresh thread data
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyingTo([]);
  };

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

  if (loading) {
    return (
      <MainLayout>
        <div className="thread-view-loading">
          {t('forum.loading')}
        </div>
      </MainLayout>
    );
  }

  if (error || !thread) {
    return (
      <MainLayout>
        <div className="thread-view-error">
          <h2>{t('forum.error.title')}</h2>
          <p>{error || t('forum.error.threadNotFound')}</p>
          <Link to="/forum" className="back-to-forum-link">
            {t('forum.backToList')}
          </Link>
        </div>
      </MainLayout>
    );
  }

  // All posts in the thread are replies
  const replies = thread.posts;

  // Count how many posts are replying to each post
  const postReplyCounts = new Map<number, Post[]>();
  thread.posts.forEach(post => {
    if (post.replying_to && post.replying_to.length > 0) {
      post.replying_to.forEach(replyToId => {
        if (!postReplyCounts.has(replyToId)) {
          postReplyCounts.set(replyToId, []);
        }
        postReplyCounts.get(replyToId)!.push(post);
      });
    }
  });

  return (
    <MainLayout>
      <div className="thread-view-container reddit-style">
        <div className="thread-navigation">
          <Link to="/forum" className="back-to-forum-link">
            ← {t('forum.backToList')}
          </Link>
          <div className="thread-category">{thread.category}</div>
        </div>
        
        {/* Original Post as Reddit Card */}
        <div className="reddit-thread-card original-post">
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
                r/{thread.category}
              </Link>
              <span className="thread-separator">•</span>
              <img src={userImagePath} alt="User" className="thread-author-image" />
              <span className="thread-author">
                {t('forum.threadList.by')} {thread.author_display_name || thread.nickname}
                {thread.is_anonymous && <span className="anonymous-badge">{t('forum.anonymous')}</span>}
              </span>
              <span className="thread-separator">•</span>
              <span className="thread-time">{formatTimeAgo(thread.last_activity_date, t)}</span>
              
              {thread.visible_for_teachers && (
                <>
                  <span className="thread-separator">•</span>
                  <span className="thread-visibility-badge teacher">
                    {t('forum.thread.visibleForTeachers')}
                  </span>
                </>
              )}
              
              {thread.can_be_answered && (
                <>
                  <span className="thread-separator">•</span>
                  <span className="thread-visibility-badge answerable">
                    {t('forum.thread.canBeAnswered')}
                  </span>
                </>
              )}
            </div>
            
            <h1 className="thread-title">{thread.title}</h1>
            
            <div className="post-content">
              {thread.content}
            </div>

            <div className="thread-footer">
              <div className="thread-action">
                <span className="thread-action-icon">💬</span>
                <span>
                  {replies.length} {replies.length === 1 
                    ? t('forum.thread.reply') 
                    : t('forum.thread.replies')}
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
            </div>
          </div>
        </div>

        <div className="thread-reply-actions">
          <button
            className="new-reply-button"
            onClick={() => {
              setReplyingTo([]);
              setShowReplyForm(true);
              setMultiSelectMode(false);
              setSelectedPosts([]);
            }}
          >
            {t('forum.thread.newReply')}
          </button>
          
          {!multiSelectMode ? (
            <button
              className="multi-reply-button"
              onClick={() => setMultiSelectMode(true)}
            >
              {t('forum.thread.replyToMultiple')}
            </button>
          ) : (
            <div className="multi-select-mode">
              <span className="multi-select-info">
                {selectedPosts.length} {t('forum.thread.postsSelected')}
              </span>
              <button
                className="cancel-multi-select"
                onClick={() => {
                  setMultiSelectMode(false);
                  setSelectedPosts([]);
                }}
              >
                {t('forum.thread.cancelSelection')}
              </button>
              <button
                className="reply-to-selected"
                onClick={handleMultipleReply}
                disabled={selectedPosts.length === 0}
              >
                {t('forum.thread.replyToSelected')}
              </button>
            </div>
          )}
        </div>

        <div className="thread-content">
          {/* Replies */}
          {replies.length > 0 ? (
            <div className="thread-replies">
              <h3 className="replies-heading">
                {replies.length} {replies.length === 1 
                  ? t('forum.thread.reply') 
                  : t('forum.thread.replies')}
              </h3>

              {replies.map(post => (
                <div key={post.id} className={multiSelectMode ? 'selectable-post' : ''}>
                  {multiSelectMode && (
                    <label className="post-select-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                      />
                      {t('forum.thread.selectPost')}
                    </label>
                  )}
                  <RedditPostCard
                    post={post}
                    replyingToPosts={postReplyCounts.get(post.id) || []}
                    allPosts={thread.posts}
                    onReply={handleReply}
                    onReplyMultiple={() => {}}
                    onRefresh={fetchThread}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-replies">
              {t('forum.thread.noReplies')}
            </div>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div id="reply-form">
            <ReplyForm
              threadId={parseInt(threadId || '0')}
              replyingTo={replyingTo}
              posts={thread.posts}
              onSubmitSuccess={handleReplySuccess}
              onCancel={handleCancelReply}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RedditThreadViewPage;