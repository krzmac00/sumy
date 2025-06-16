import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import NewsCard from './NewsCard';
import NewsFilters from './NewsFilters';
import { NewsItem, NewsCategory, NewsFilters as NewsFiltersType } from '../../types/news';
import { newsAPI } from '../../services/newsAPI';
import './NewsFeedList.css';

const NewsFeedList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NewsFiltersType>({
    categories: [],
    dateFrom: undefined,
    dateTo: undefined,
    search: undefined
  });

  // Check if user can create news
  const canCreateNews = currentUser && ['lecturer', 'admin'].includes(currentUser.role);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadNewsItems();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const categoriesData = await newsAPI.getCategories();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]); // Ensure categories is always an array
    }
  };

  const loadNewsItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsAPI.getNewsItems(filters);
      // Handle both paginated and non-paginated responses
      const items = Array.isArray(response) ? response : (response.results || []);
      setNewsItems(items);
    } catch (err) {
      console.error('Failed to load news items:', err);
      setError(t('news.errors.loadFailed'));
      setNewsItems([]); // Ensure newsItems is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: NewsFiltersType) => {
    setFilters(newFilters);
  };

  const handleCreateNews = () => {
    navigate('/news/create');
  };

  const handleNewsClick = (newsItem: NewsItem) => {
    navigate(`/news/${newsItem.id}`);
  };

  if (loading && newsItems.length === 0) {
    return (
      <div className="news-feed-container">
        <div className="news-feed-loading">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-feed-container">
      <div className="news-feed-header">
        <h2>{t('news.title')}</h2>
        {canCreateNews && (
          <button className="create-news-button" onClick={handleCreateNews}>
            {t('news.createNews')}
          </button>
        )}
      </div>

      <NewsFilters
        categories={categories}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {error && (
        <div className="news-feed-error">
          <p>{error}</p>
        </div>
      )}

      <div className="news-feed-list">
        {newsItems.length === 0 ? (
          <div className="news-feed-empty">
            <p>{t('news.noItems')}</p>
          </div>
        ) : (
          newsItems.map((item) => (
            <NewsCard
              key={item.id}
              newsItem={item}
              onClick={() => handleNewsClick(item)}
            />
          ))
        )}
      </div>

      {loading && newsItems.length > 0 && (
        <div className="news-feed-loading-more">
          <p>{t('common.loading')}</p>
        </div>
      )}
    </div>
  );
};

export default NewsFeedList;