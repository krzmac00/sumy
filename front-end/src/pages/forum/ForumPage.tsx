import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        setError(null);
        const threadsData = await threadAPI.getAll();
        
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
    };

    fetchThreads();
  }, [t]);

  return (
    <MainLayout>
      <div className="forum-page">
        <div className="forum-header">
          <h1>{t('forum.title')}</h1>
          <p className="forum-description">{t('forum.description')}</p>
        </div>
        
        <ThreadList 
          threads={threads} 
          loading={loading} 
          error={error} 
        />
      </div>
    </MainLayout>
  );
};

export default ForumPage;