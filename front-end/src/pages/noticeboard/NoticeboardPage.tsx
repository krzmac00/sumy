import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Filter, Search, RefreshCw } from 'lucide-react';
import { Advertisement, AdvertisementCategory, AdvertisementFilters, CATEGORY_COLORS } from '../../types/noticeboard';
import { advertisementAPI } from '../../services/noticeboardAPI';
import { useAuth } from '../../contexts/AuthContext';
import AdvertisementCard from '../../components/noticeboard/AdvertisementCard';
import MainLayout from '../../layouts/MainLayout';
import './NoticeboardPage.css';

const NoticeboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdvertisementFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories: AdvertisementCategory[] = [
    'announcement', 'sale', 'buy', 'service', 'event', 'lost_found', 'other'
  ];

  useEffect(() => {
    fetchAdvertisements();
  }, [filters]);

  const fetchAdvertisements = async () => {
    try {
      console.log('=== FETCHING ADVERTISEMENTS ===');
      console.log('Current filters:', filters);
      
      setLoading(true);
      setError(null);
      
      const data = await advertisementAPI.list(filters);
      
      console.log('API Response received:');
      console.log('- Type:', typeof data);
      console.log('- Is Array:', Array.isArray(data));
      console.log('- Length:', Array.isArray(data) ? data.length : 'N/A');
      console.log('- Full data:', JSON.stringify(data, null, 2));
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('First advertisement:', data[0]);
        console.log('Advertisement keys:', Object.keys(data[0]));
      }
      
      // Ensure we have valid data before setting state
      if (Array.isArray(data)) {
        setAdvertisements(data);
        console.log('State updated with advertisements:', data);
      } else {
        console.error('Invalid data format received:', data);
        setAdvertisements([]);
      }
    } catch (err) {
      console.error('=== ERROR FETCHING ADVERTISEMENTS ===');
      console.error('Error details:', err);
      
      if (err instanceof Error) {
        console.error('Error type:', err.constructor.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      } else {
        console.error('Unknown error type:', typeof err);
      }
      
      setError(t('noticeboard.errors.fetchFailed'));
    } finally {
      setLoading(false);
      console.log('Loading state set to false');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
  };

  const handleCategoryFilter = (category: AdvertisementCategory | null) => {
    if (category === null) {
      const { category: _, ...newFilters } = filters;
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, category });
    }
  };

  const handlePriceFilter = (minPrice: string, maxPrice: string) => {
    const newFilters: AdvertisementFilters = { ...filters };
    
    if (minPrice) {
      newFilters.price_min = parseFloat(minPrice);
    } else {
      delete newFilters.price_min;
    }
    
    if (maxPrice) {
      newFilters.price_max = parseFloat(maxPrice);
    } else {
      delete newFilters.price_max;
    }
    
    setFilters(newFilters);
  };

  const handleCreateClick = () => {
    if (user) {
      navigate('/noticeboard/create');
    } else {
      navigate('/auth?redirect=/noticeboard/create');
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchAdvertisements();
  };

  return (
    <MainLayout>
      <div className="noticeboard-page">
        <div className="noticeboard-header">
        <h1>{t('noticeboard.title')}</h1>
        <p className="noticeboard-description">{t('noticeboard.description')}</p>
        <button className="btn-primary" onClick={handleCreateClick}>
          <Plus size={20} />
          {t('noticeboard.createAdvertisement')}
        </button>
      </div>

      <div className="noticeboard-controls">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder={t('noticeboard.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">{t('common.search')}</button>
          </div>
        </form>

        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          {t('common.filters')}
        </button>
        
        <button 
          className="filter-toggle"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          {t('common.refresh')}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <h3>{t('noticeboard.category')}</h3>
            <div className="category-filters">
              <button
                className={`category-chip ${!filters.category ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(null)}
              >
                {t('common.all')}
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-chip ${filters.category === category ? 'active' : ''}`}
                  style={{
                    backgroundColor: filters.category === category ? CATEGORY_COLORS[category] : undefined,
                    color: filters.category === category ? 'white' : undefined,
                  }}
                  onClick={() => handleCategoryFilter(category)}
                >
                  {t(`noticeboard.categories.${category}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3>{t('noticeboard.priceRange')}</h3>
            <div className="price-filter">
              <input
                type="number"
                placeholder={t('noticeboard.minPrice')}
                onChange={(e) => handlePriceFilter(e.target.value, filters.price_max?.toString() || '')}
              />
              <span>-</span>
              <input
                type="number"
                placeholder={t('noticeboard.maxPrice')}
                onChange={(e) => handlePriceFilter(filters.price_min?.toString() || '', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="advertisements-container">
        {loading && (
          <div className="loading-state">
            {t('common.loading')}
          </div>
        )}

        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        {!loading && !error && advertisements.length === 0 && (
          <div className="empty-state">
            <p>{t('noticeboard.noAdvertisements')}</p>
            {user && (
              <button className="btn-primary" onClick={handleCreateClick}>
                {t('noticeboard.createFirst')}
              </button>
            )}
          </div>
        )}

        {!loading && !error && advertisements.length > 0 && (
          <div className="advertisements-grid">
            {advertisements.map((ad, index) => {
              // Ensure we have valid advertisement data
              if (!ad || !ad.id) {
                return null;
              }
              return (
                <AdvertisementCard
                  key={ad.id}
                  advertisement={ad}
                  onClick={() => navigate(`/noticeboard/${ad.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
    </MainLayout>
  );
};

export default NoticeboardPage;