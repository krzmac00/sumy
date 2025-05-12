import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import { threadAPI } from '../../services/api';
import { ThreadCreateData } from '../../types/forum';
import { useAuth } from '../../contexts/AuthContext';
import './ThreadCreatePage.css';

const ThreadCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [visibleForTeachers, setVisibleForTeachers] = useState<boolean>(false);
  const [canBeAnswered, setCanBeAnswered] = useState<boolean>(true);
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Default categories - in a real app, these would come from the backend
  const categories = [
    'General', 
    'Assignments', 
    'Course Materials', 
    'Technical Issues', 
    'Events', 
    'Other'
  ];

  // Try to get the nickname from localStorage if it exists
  useEffect(() => {
    const savedNickname = localStorage.getItem('forumNickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = t('forum.create.validation.titleRequired');
    } else if (title.length < 5) {
      errors.title = t('forum.create.validation.titleLength');
    }
    
    if (!category) {
      errors.category = t('forum.create.validation.categoryRequired');
    }
    
    if (!content.trim()) {
      errors.content = t('forum.create.validation.contentRequired');
    } else if (content.length < 10) {
      errors.content = t('forum.create.validation.contentLength');
    }
    
    // Only require nickname if anonymous posting is selected
    if (isAnonymous && !nickname.trim()) {
      errors.nickname = t('forum.create.validation.nicknameRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Only save nickname for future use if anonymous posting
      if (isAnonymous && nickname) {
        localStorage.setItem('forumNickname', nickname);
      }
      
      const threadData: ThreadCreateData = {
        title,
        category,
        content,
        nickname: isAnonymous ? nickname : undefined, // Only send nickname if anonymous
        visible_for_teachers: visibleForTeachers,
        can_be_answered: canBeAnswered,
        is_anonymous: isAnonymous
      };
      
      const newThread = await threadAPI.create(threadData);
      
      // Redirect to the new thread using post_id which is the thread's primary key
      navigate(`/forum/threads/${newThread.post}`);
    } catch (err) {
      console.error('Error creating thread:', err);
      setError(t('forum.create.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="thread-create-container">
        <div className="thread-create-header">
          <h1>{t('forum.create.title')}</h1>
          <Link to="/forum" className="back-to-forum-link">
            ← {t('forum.backToList')}
          </Link>
        </div>
        
        {error && (
          <div className="thread-create-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="thread-create-form">
          <div className="form-group">
            <label htmlFor="thread-title">{t('forum.create.threadTitle')}</label>
            <input
              id="thread-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('forum.create.threadTitlePlaceholder')}
              className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
              disabled={submitting}
            />
            {formErrors.title && (
              <div className="invalid-feedback">{formErrors.title}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="thread-category">{t('forum.create.category')}</label>
            <select
              id="thread-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`form-control ${formErrors.category ? 'is-invalid' : ''}`}
              disabled={submitting}
            >
              <option value="">{t('forum.create.selectCategory')}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {formErrors.category && (
              <div className="invalid-feedback">{formErrors.category}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="thread-content">{t('forum.create.content')}</label>
            <textarea
              id="thread-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('forum.create.contentPlaceholder')}
              rows={8}
              className={`form-control ${formErrors.content ? 'is-invalid' : ''}`}
              disabled={submitting}
            />
            {formErrors.content && (
              <div className="invalid-feedback">{formErrors.content}</div>
            )}
          </div>
          
          <div className="form-group">
            <div className="form-check">
              <input
                id="is-anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="form-check-input"
                disabled={submitting}
              />
              <label className="form-check-label" htmlFor="is-anonymous">
                {t('forum.create.postAnonymously')}
              </label>
              <small className="form-text text-muted">
                {currentUser ? t('forum.create.anonymousDescription') : t('forum.create.anonymousRequired')}
              </small>
            </div>
          </div>
          
          {isAnonymous && (
            <div className="form-group">
              <label htmlFor="thread-nickname">{t('forum.create.nickname')}</label>
              <input
                id="thread-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('forum.create.nicknamePlaceholder')}
                className={`form-control ${formErrors.nickname ? 'is-invalid' : ''}`}
                disabled={submitting}
              />
              {formErrors.nickname && (
                <div className="invalid-feedback">{formErrors.nickname}</div>
              )}
            </div>
          )}
          
          <div className="thread-options">
            <div className="form-check">
              <input
                id="visible-for-teachers"
                type="checkbox"
                checked={visibleForTeachers}
                onChange={(e) => setVisibleForTeachers(e.target.checked)}
                className="form-check-input"
                disabled={submitting}
              />
              <label className="form-check-label" htmlFor="visible-for-teachers">
                {t('forum.create.visibleForTeachers')}
              </label>
            </div>
            
            <div className="form-check">
              <input
                id="can-be-answered"
                type="checkbox"
                checked={canBeAnswered}
                onChange={(e) => setCanBeAnswered(e.target.checked)}
                className="form-check-input"
                disabled={submitting}
              />
              <label className="form-check-label" htmlFor="can-be-answered">
                {t('forum.create.canBeAnswered')}
              </label>
            </div>
          </div>
          
          <div className="form-actions">
            <Link to="/forum" className="btn-cancel">
              {t('forum.create.cancel')}
            </Link>
            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting 
                ? t('forum.create.creating') 
                : t('forum.create.submit')}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ThreadCreatePage;