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
  blacklistOn: boolean;
  setBlacklistOn: React.Dispatch<React.SetStateAction<boolean>>;
}

const ThreadList: React.FC<ThreadListProps> = ({ 
  threads, 
  loading, 
  error, 
  onCategoryChange, 
  onRefresh,
  blacklistOn,
  setBlacklistOn 
}) => {
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
    return (
      <div className="thread-list-container">
        <div className="loading-indicator">
          {t('forum.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="thread-list-container">
        <div className="error-message">
          {error}
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="retry-button"
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {t('common.retry', 'Retry')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="thread-list-container">
      <div className="thread-list-header">
        <h2>{t('forum.threadList.title')}</h2>
        <div className="thread-list-actions">
          {/* Blacklist Toggle */}
          <div className="blacklist-toggle" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <span style={{ marginTop: '4px' }}>
              {blacklistOn ? t("forum.blacklist_on") : t("forum.blacklist_off")}
            </span>
            <div
              onClick={() => setBlacklistOn(prev => !prev)}
              role="button"
              tabIndex={0}
              aria-label={blacklistOn ? t("forum.disable_blacklist") : t("forum.enable_blacklist")}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setBlacklistOn(prev => !prev);
                }
              }}
              style={{
                width: '40px',
                height: '20px',
                backgroundColor: blacklistOn ? '#22aa22' : '#aa2222',
                borderRadius: '9999px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                marginRight: '10px',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: blacklistOn ? '20px' : '2px',
                  transition: 'left 0.3s',
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            <label htmlFor="category-select">{t('forum.filter.category')}:</label>
            <select 
              id="category-select"
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              <option value="">{t('forum.filter.allCategories')}</option>
              {translatedCategories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>

          {/* Create Thread Button */}
          <Link 
            to="/forum/create-thread" 
            className="create-thread-button"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {t('forum.threadList.createNew')}
          </Link>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="refresh-button"
              style={{
                padding: '0.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              title={t('common.refresh', 'Refresh')}
            >
              ↻
            </button>
          )}
        </div>
      </div>
      
      {filteredThreads.length === 0 ? (
        <div className="no-threads-message" style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6c757d',
          fontSize: '16px'
        }}>
          {categoryFilter 
            ? t('forum.threadList.noThreadsInCategory', { category: translateCategory(categoryFilter, t) }) 
            : t('forum.threadList.noThreads')}
        </div>
      ) : (
        <div className="thread-list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {filteredThreads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {/* Thread Count Info */}
      {filteredThreads.length > 0 && (
        <div className="thread-count-info" style={{
          marginTop: '1rem',
          padding: '0.5rem',
          textAlign: 'center',
          color: '#6c757d',
          fontSize: '14px',
          borderTop: '1px solid #e9ecef'
        }}>
          {categoryFilter ? (
            t('forum.threadList.showingFilteredCount', {
              count: filteredThreads.length,
              total: threads.length,
              category: translateCategory(categoryFilter, t)
            }) || 
            `Showing ${filteredThreads.length} of ${threads.length} threads in "${translateCategory(categoryFilter, t)}"`
          ) : (
            t('forum.threadList.totalCount', { count: threads.length }) ||
            `${threads.length} thread${threads.length === 1 ? '' : 's'} total`
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadList;