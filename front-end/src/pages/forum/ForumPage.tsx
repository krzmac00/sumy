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
  const [sortBy, setSortBy] = useState<string>('-activity'); // Default to latest activity
  // Category filtering is handled by ThreadList component via URL params

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fire and forget - don't wait for email threads
      threadAPI.threadsFromEmail().catch(() => {
        // Ignore errors from email thread fetching
      });
      
      const threadsData = await threadAPI.getAll(blacklistOn, dateFrom, dateTo, sortBy);
      
      // Ensure threadsData is an array
      if (!Array.isArray(threadsData)) {
        console.error('Threads data is not an array:', threadsData);
        setThreads([]);
        return;
      }
      
      setThreads(threadsData);
    } catch (err: any) {
      // Check if it's a connection error
      if (err.message?.includes('Failed to fetch') || err.code === 'ERR_NETWORK') {
        setError(t('forum.error.connectionError', 'Unable to connect to server. Please check if the server is running.'));
      } else {
        console.error('Error fetching threads:', err);
        setError(t('forum.error.fetchThreads'));
      }
    } finally {
      setLoading(false);
    }

  }, [t, blacklistOn, dateFrom, dateTo, sortBy]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleDateRangeChange = useCallback((newDateFrom: string, newDateTo: string) => {
    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
  }, []);

  const handleSortChange = useCallback((newSort: string) => {
    setSortBy(newSort);
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
          onSortChange={handleSortChange}
          sortBy={sortBy}
          blacklistOn={blacklistOn}
          setBlacklistOn={setBlacklistOn}
        />
      </div>
    </MainLayout>
  );
};

export default ForumPage;