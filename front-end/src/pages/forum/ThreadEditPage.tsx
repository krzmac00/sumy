import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { threadAPI } from '../../services/api';
import { Thread } from '../../types/forum';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import './ThreadEditPage.css';

const ThreadEditPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThread = async () => {
      if (!threadId) return;
      
      try {
        setIsLoading(true);
        const threadData = await threadAPI.getOne(parseInt(threadId));
        
        // Check if current user is the thread creator
        if (currentUser && threadData.user !== currentUser.id) {
          setError(t('forum.error.notAuthorized'));
          setTimeout(() => navigate(`/forum/threads/${threadId}`), 2000);
          return;
        }
        
        setThread(threadData);
        setTitle(threadData.title);
        setContent(threadData.content);
        setCategory(threadData.category);
      } catch (err) {
        console.error('Error fetching thread:', err);
        setError(t('forum.error.loadThread'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchThread();
  }, [threadId, currentUser, navigate, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!threadId || !thread) return;
    
    // Validate inputs
    if (!title.trim()) {
      setError(t('forum.error.titleRequired'));
      return;
    }
    
    if (!content.trim()) {
      setError(t('forum.error.contentRequired'));
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      await threadAPI.update(parseInt(threadId), {
        title: title.trim(),
        content: content.trim(),
        category: category
      });
      
      navigate(`/forum/threads/${threadId}`);
    } catch (err) {
      console.error('Error updating thread:', err);
      setError(t('forum.error.updateThread'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/forum/threads/${threadId}`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="thread-edit-page">
          <div className="loading">{t('common.loading')}</div>
        </div>
      </MainLayout>
    );
  }

  if (error && !thread) {
    return (
      <MainLayout>
        <div className="thread-edit-page">
          <div className="error-message">{error}</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="thread-edit-page">
        <h1 className="page-title">{t('forum.thread.editTitle')}</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="thread-edit-form">
          <div className="form-group">
            <label htmlFor="title">{t('forum.create.title')}</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('forum.create.titlePlaceholder')}
              maxLength={1023}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">{t('forum.create.category')}</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="general">{t('categories.general')}</option>
              <option value="exams">{t('categories.exams')}</option>
              <option value="assignments">{t('categories.assignments')}</option>
              <option value="materials">{t('categories.materials')}</option>
              <option value="courses">{t('categories.courses')}</option>
              <option value="lecturers">{t('categories.lecturers')}</option>
              <option value="events">{t('categories.events')}</option>
              <option value="technical">{t('categories.technical')}</option>
              <option value="other">{t('categories.other')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content">{t('forum.create.content')}</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('forum.create.contentPlaceholder')}
              rows={10}
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="save-button-edit"
              disabled={isSaving}
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
            <button 
              type="button" 
              className="cancel-button-edit"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ThreadEditPage;