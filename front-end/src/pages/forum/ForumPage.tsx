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
  const [blacklistOn, setBlacklistOn] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  // Category filtering is handled by ThreadList component via URL params

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const threadsData = await threadAPI.getAll(blacklistOn, dateFrom, dateTo);
      
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
  }, [t, blacklistOn, dateFrom, dateTo]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleDateRangeChange = useCallback((newDateFrom: string, newDateTo: string) => {
    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
  }, []);

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
          onRefresh={fetchThreads}
          onCategoryChange={() => {}} // URL state is managed by ThreadList itself
          onDateRangeChange={handleDateRangeChange}
          blacklistOn={blacklistOn}
          setBlacklistOn={setBlacklistOn}
        />
      </div>
    </MainLayout>
  );
};

export default ForumPage;