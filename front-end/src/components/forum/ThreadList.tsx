import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Thread } from '../../types/forum';
import ThreadCard from './ThreadCard';
import { getTranslatedCategories, translateCategory } from '../../utils/categories';
import './ThreadList.css';

interface ThreadListProps {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onCategoryChange?: (category: string) => void;
}

const ThreadList: React.FC<ThreadListProps> = ({ threads, loading, error, onCategoryChange /* onRefresh */ }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';
  
  // Get translated categories for the dropdown
  const translatedCategories = getTranslatedCategories(t);
  
  // Filter threads by category if a filter is selected
  const filteredThreads = categoryFilter 
    ? threads.filter(thread => thread.category === categoryFilter) 
    : threads;

  // Handle category filter change
  const handleCategoryChange = (newCategory: string) => {
    if (newCategory) {
      setSearchParams({ category: newCategory });
    } else {
      setSearchParams({});
    }
    onCategoryChange?.(newCategory);
  };

  // Sync with parent component when category changes
  useEffect(() => {
    onCategoryChange?.(categoryFilter);
  }, [categoryFilter, onCategoryChange]);

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
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">{t('forum.filter.allCategories')}</option>
              {translatedCategories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
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
            ? t('forum.threadList.noThreadsInCategory', { category: translateCategory(categoryFilter, t) }) 
            : t('forum.threadList.noThreads')}
        </div>
      ) : (
        <div className="thread-list">
          {filteredThreads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreadList;