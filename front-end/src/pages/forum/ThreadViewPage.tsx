import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import PostCard from '../../components/forum/PostCard';
import ReplyForm from '../../components/forum/ReplyForm';
import { Thread, Post } from '../../types/forum';
import { threadAPI, voteAPI } from '../../services/api';
import { formatTimeAgo } from '../../utils/dateUtils';
import { translateCategory } from '../../utils/categories';
import './ThreadViewPage.css';

const ThreadViewPage: React.FC = () => {
  const { t } = useTranslation();
  const { threadId } = useParams<{ threadId: string }>();
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number[]>([]);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [voteStatus, setVoteStatus] = useState<'upvote' | 'downvote' | null>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [voting, setVoting] = useState<boolean>(false);

  // Default user image path
  const userImagePath = "/user_default_image.png";

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    if (!threadId) {
      setError(t('forum.error.invalidThreadId'));
      setLoading(false);
      return;
    }
    
    // Validate that threadId is a valid number
    const threadIdNum = parseInt(threadId);
    if (isNaN(threadIdNum) || threadIdNum <= 0) {
      setError(t('forum.error.invalidThreadId'));
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const threadData = await threadAPI.getOne(threadIdNum);
      setThread(threadData);
      
      // Initialize voting state from thread data
      setVoteCount(threadData.vote_count || 0);
      setVoteStatus(threadData.user_vote || null);
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

  const handleThreadVote = async (voteType: 'upvote' | 'downvote', e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!thread) return;
    
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
      
    } catch (err) {
      console.error('Error voting on thread:', err);
      setError(err instanceof Error ? err.message : t('forum.error.voteGeneric'));
    } finally {
      setVoting(false);
    }
  };

  const handleUpvote = (e: React.MouseEvent) => handleThreadVote('upvote', e);
  const handleDownvote = (e: React.MouseEvent) => handleThreadVote('downvote', e);

  const handlePostVoteUpdate = (postId: number, newVoteCount: number, userVote: 'upvote' | 'downvote' | null) => {
    // Optionally update local state or just let the PostCard handle its own state
    // This callback can be used for any global state management if needed
    console.log(`Post ${postId} vote updated: ${newVoteCount} (${userVote})`);
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
      <div className="thread-view-container">
        <div className="thread-navigation">
          <Link to="/forum" className="back-to-forum-link">
            ← {t('forum.backToList')}
          </Link>
          <Link to={`/forum?category=${thread.category}`} className="thread-category">
            {translateCategory(thread.category, t)}
          </Link>
        </div>
        
        {/* Original Post as Thread Card */}
        <div className="thread-card original-post">
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
                  <PostCard
                    post={post}
                    replyingToPosts={postReplyCounts.get(post.id) || []}
                    allPosts={thread.posts}
                    onReply={handleReply}
                    onReplyMultiple={() => {}}
                    onRefresh={fetchThread}
                    onVoteUpdate={handlePostVoteUpdate}
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

export default ThreadViewPage;