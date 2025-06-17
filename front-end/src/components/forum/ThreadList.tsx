import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Thread } from '../../types/forum';
import ThreadCard from './ThreadCard';
import { getTranslatedCategories, translateCategory } from '../../utils/categories';
import { pinnedThreadService } from '../../services/pinnedThreadService';
import { useAuth } from '../../contexts/AuthContext';
import { debounce } from '../../utils/debounce';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  
  // Debounced search update
  const debouncedSetSearchQuery = React.useMemo(
    () => debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );
  
  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    debouncedSetSearchQuery(value);
  };
  
  // Get translated categories for the dropdown
  const translatedCategories = getTranslatedCategories(t);
  
  // Filter threads by category and search query
  const filteredThreads = threads.filter(thread => {
    // Category filter
    if (categoryFilter && thread.category !== categoryFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = thread.title.toLowerCase().includes(query);
      const contentMatch = thread.content?.toLowerCase().includes(query);
      const authorMatch = (thread.author_display_name || thread.nickname || '').toLowerCase().includes(query);
      
      return titleMatch || contentMatch || authorMatch;
    }
    
    return true;
  });

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
        <div className="thread-list-controls">
            {/* Search Form - Reusing noticeboard style */}
            <form className="search-form" onSubmit={(e) => e.preventDefault()}>
              <div className="search-input-wrapper">
                <Search size={20} />
                <input
                  type="text"
                  placeholder={t('forum.search.placeholder', 'Search threads...')}
                  value={localSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleSearchChange('');
                      setSearchQuery('');
                    }
                  }}
                />
                {localSearchQuery && (
                  <button 
                    type="button"
                    onClick={() => {
                      handleSearchChange('');
                      setSearchQuery('');
                    }}
                    title={t('forum.search.clear', 'Clear search')}
                  >
                    {t('common.clear', 'Clear')}
                  </button>
                )}
              </div>
            </form>

            {/* Blacklist Toggle */}
            <div className="blacklist-toggle">
              <span>
                {t("forum.blacklist.label", "Blacklist")}
              </span>
              <div
                className="toggle-switch"
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
                  backgroundColor: blacklistOn ? '#8b0002' : '#e5e7eb',
                }}
              >
                <div
                  style={{
                    transform: blacklistOn ? 'translateX(20px)' : 'translateX(0)',
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
          {/*<div className="sort-filter">
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
            </div>*/}

            
          </div>
          
          {/* Action Buttons */}
          <div className="thread-list-action-buttons">
            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="btn-icon refresh-button"
                title={t('forum.refresh', 'Refresh')}
                aria-label={t('forum.refresh', 'Refresh')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M8 16H3v5"/>
                </svg>
              </button>
            )}

            {/* Create Thread Button */}
            <Link 
              to="/forum/create-thread" 
              className="btn-primary-create-thread-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>{t('forum.threadList.createNew')}</span>
            </Link>
          </div>
        </div>
      
      {/* Search results info */}
      {searchQuery && (
        <div className="search-results-info">
          {filteredThreads.length > 0 ? (
            <span>{t('forum.search.resultsCount', { count: filteredThreads.length, query: searchQuery })}</span>
          ) : (
            <span>{t('forum.search.noResults', { query: searchQuery })}</span>
          )}
        </div>
      )}
      
      {filteredThreads.length === 0 ? (
        <div className="no-threads-message" style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6c757d',
          fontSize: '16px'
        }}>
          {searchQuery
            ? t('forum.search.tryDifferent', 'Try a different search term')
            : categoryFilter 
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