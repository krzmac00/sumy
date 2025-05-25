import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Thread } from '../../types/forum';
import ThreadCard from './ThreadCard';
import './ThreadList.css';

interface ThreadListProps {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

const ThreadList: React.FC<ThreadListProps> = ({ threads, loading, error /* onRefresh */ }) => {
  const { t } = useTranslation();
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  
  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(threads.map(thread => thread.category)));
  
  // Filter threads by category if a filter is selected
  const filteredThreads = categoryFilter 
    ? threads.filter(thread => thread.category === categoryFilter) 
    : threads;

  if (loading) {
    return <div className="loading-indicator">{t('forum.loading')}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="thread-list-container">
      <div className="thread-list-header">
        <h2>{t('forum.threadList.title')}</h2>
        <div className="thread-list-actions">
          <div className="category-filter">
            <label htmlFor="category-select">{t('forum.filter.category')}:</label>
            <select 
              id="category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">{t('forum.filter.allCategories')}</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <Link to="/forum/create-thread" className="create-thread-button">
            {t('forum.threadList.createNew')}
          </Link>
        </div>
      </div>
      
      {filteredThreads.length === 0 ? (
        <div className="no-threads-message">
          {categoryFilter 
            ? t('forum.threadList.noThreadsInCategory', { category: categoryFilter }) 
            : t('forum.threadList.noThreads')}
        </div>
      ) : (
        <div className="thread-list">
          {filteredThreads.map(thread => (
            <ThreadCard key={thread.post} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreadList;