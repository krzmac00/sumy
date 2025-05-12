import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../layouts/MainLayout';
import ThreadList from '../../components/forum/ThreadList';
import { Thread } from '../../types/forum';
import { threadAPI } from '../../services/api';
import './ForumPage.css';

const ForumPage: React.FC = () => {
  const { t } = useTranslation();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const threadsData = await threadAPI.getAll();
      
      // Ensure threadsData is an array before attempting to sort
      if (!Array.isArray(threadsData)) {
        console.error('Threads data is not an array:', threadsData);
        setThreads([]);
        return;
      }
      
      // Sort threads by last_activity_date in descending order (newest first)
      const sortedThreads = [...threadsData].sort((a, b) => {
        return new Date(b.last_activity_date).getTime() - new Date(a.last_activity_date).getTime();
      });
      
      setThreads(sortedThreads);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError(t('forum.error.fetchThreads'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return (
    <MainLayout>
      <div className="forum-page">
        <div className="forum-header">
          <div className="forum-header-title">
            <h1>{t('forum.title')}</h1>
            <button 
              className="refresh-button" 
              onClick={fetchThreads}
              disabled={loading}
              aria-label={t('forum.refresh')}
              title={t('forum.refresh')}
            >
              {loading ? (
                <div className="loading-spinner" aria-hidden="true"></div>
              ) : (
                <span className="refresh-icon" aria-hidden="true">↻</span>
              )}
            </button>
          </div>
          <p className="forum-description">{t('forum.description')}</p>
        </div>
        
        <ThreadList 
          threads={threads} 
          loading={loading} 
          error={error} 
          onRefresh={fetchThreads}
        />
      </div>
    </MainLayout>
  );
};

export default ForumPage;