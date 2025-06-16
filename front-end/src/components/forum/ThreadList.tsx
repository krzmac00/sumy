import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Thread } from '../../types/forum';
import ThreadCard from './ThreadCard';
import { getTranslatedCategories, translateCategory } from '../../utils/categories';
import { pinnedThreadService } from '../../services/pinnedThreadService';
import { useAuth } from '../../contexts/AuthContext';
import './ThreadList.css';

interface ThreadListProps {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onCategoryChange?: (category: string) => void;
  onDateRangeChange?: (dateFrom: string, dateTo: string) => void;
  onSortChange?: (sort: string) => void;
  sortBy?: string;
  blacklistOn: boolean;
  setBlacklistOn: React.Dispatch<React.SetStateAction<boolean>>;
}

const ThreadList: React.FC<ThreadListProps> = ({ 
  threads, 
  loading, 
  error, 
  onCategoryChange,
  onDateRangeChange,
  onSortChange,
  sortBy = '-activity',
  onRefresh,
  blacklistOn,
  setBlacklistOn 
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const [dateError, setDateError] = React.useState<string>('');
  const [pinStatuses, setPinStatuses] = useState<{ [threadId: number]: boolean }>({});
  
  // Get translated categories for the dropdown
  const translatedCategories = getTranslatedCategories(t);
  
  // Filter threads by category if a filter is selected
  const filteredThreads = categoryFilter 
    ? threads.filter(thread => thread.category === categoryFilter) 
    : threads;

  // Handle category filter change
  const handleCategoryChange = (newCategory: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newCategory) {
      newParams.set('category', newCategory);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
    onCategoryChange?.(newCategory);
  };

  // Handle date range change
  const handleDateChange = (type: 'from' | 'to', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    
    let actualDateFrom = dateFrom;
    let actualDateTo = dateTo;
    
    if (type === 'from') {
      actualDateFrom = value;
      if (value) {
        newParams.set('dateFrom', value);
        // If from date is after to date, adjust to date
        if (dateTo && value > dateTo) {
          actualDateTo = value;
          newParams.set('dateTo', value);
        }
      } else {
        newParams.delete('dateFrom');
      }
    } else {
      actualDateTo = value;
      if (value) {
        newParams.set('dateTo', value);
        // If to date is before from date, adjust from date
        if (dateFrom && value < dateFrom) {
          actualDateFrom = value;
          newParams.set('dateFrom', value);
        }
      } else {
        newParams.delete('dateTo');
      }
    }
    
    setSearchParams(newParams);
    setDateError('');
    onDateRangeChange?.(actualDateFrom, actualDateTo);
  };

  // Clear date filters
  const clearDateFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('dateFrom');
    newParams.delete('dateTo');
    setSearchParams(newParams);
    setDateError('');
    onDateRangeChange?.('', '');
  };

  // Load pin statuses for all threads
  useEffect(() => {
    const loadPinStatuses = async () => {
      if (currentUser && threads.length > 0) {
        try {
          const threadIds = threads.map(thread => thread.id);
          const statuses = await pinnedThreadService.getBulkPinStatus(threadIds);
          setPinStatuses(statuses);
        } catch (err) {
          console.error('Error loading pin statuses:', err);
          // If bulk load fails, leave empty - threads will handle individually
        }
      }
    };
    loadPinStatuses();
  }, [threads, currentUser]);

  // Sync with parent component when filters change
  useEffect(() => {
    onCategoryChange?.(categoryFilter);
  }, [categoryFilter, onCategoryChange]);

  useEffect(() => {
    if (!dateError) {
      onDateRangeChange?.(dateFrom, dateTo);
    }
  }, [dateFrom, dateTo, dateError, onDateRangeChange]);

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

          {/* Date Range Picker */}
          <div className="date-range-picker">
            <div className="date-input-group">
              <label htmlFor="date-from">{t('forum.filter.dateFrom')}:</label>
              <input
                type="date"
                id="date-from"
                value={dateFrom}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="date-input"
                max={dateTo || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="date-to">{t('forum.filter.dateTo')}:</label>
              <input
                type="date"
                id="date-to"
                value={dateTo}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="date-input"
                min={dateFrom}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={clearDateFilters}
                className="clear-dates-button"
                title={t('forum.filter.clearDates')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Error Message */}
          {dateError && (
            <div className="date-error">
              {dateError}
            </div>
          )}

          {/* Category Filter */}
          <div className="category-filter">
            <label htmlFor="category-select">{t('forum.filter.category')}:</label>
            <select 
              id="category-select"
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="category-select"
            >
              <option value="">{t('forum.filter.allCategories')}</option>
              {translatedCategories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="sort-filter">
            <label htmlFor="sort-select">{t('forum.filter.sortBy')}:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="sort-select"
            >
              <option value="-activity">{t('forum.filter.sort.latestActivity')}</option>
              <option value="-created">{t('forum.filter.sort.newest')}</option>
              <option value="created">{t('forum.filter.sort.oldest')}</option>
              <option value="-votes">{t('forum.filter.sort.mostVotes')}</option>
              <option value="-posts">{t('forum.filter.sort.mostPosts')}</option>
              <option value="title">{t('forum.filter.sort.title')}</option>
            </select>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="refresh-button"
              title={t('forum.refresh', 'Refresh')}
            >
              ↻
            </button>
          )}

          {/* Create Thread Button */}
          <Link 
            to="/forum/create-thread" 
            className="create-thread-button"
          >
            {t('forum.threadList.createNew')}
          </Link>
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
          gap: '5px'
        }}>
          {filteredThreads.map(thread => (
            <ThreadCard 
              key={thread.id} 
              thread={thread} 
              onThreadDeleted={onRefresh}
              initialPinStatus={pinStatuses[thread.id] || false}
              onPinStatusChange={(threadId, isPinned) => {
                setPinStatuses(prev => ({ ...prev, [threadId]: isPinned }));
              }}
            />
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
            threads.length === 1 
              ? t('forum.threadList.totalCount_one', { count: threads.length })
              : t('forum.threadList.totalCount_other', { count: threads.length })
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadList;