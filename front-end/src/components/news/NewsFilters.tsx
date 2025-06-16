import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NewsCategory, NewsFilters as NewsFiltersType } from '../../types/news';
import './NewsFilters.css';

interface NewsFiltersProps {
  categories: NewsCategory[];
  filters: NewsFiltersType;
  onFilterChange: (filters: NewsFiltersType) => void;
}

const NewsFilters: React.FC<NewsFiltersProps> = ({ categories, filters, onFilterChange }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleCategoryToggle = (categoryId: number) => {
    const category = findCategoryById(categories, categoryId);
    if (!category) return;

    let newCategories = [...filters.categories];
    
    if (newCategories.includes(categoryId)) {
      // Remove category and all its children
      newCategories = newCategories.filter(id => {
        const cat = findCategoryById(categories, id);
        return !cat || !isDescendantOf(cat, categoryId, categories);
      });
    } else {
      // Add category and all its parents
      const path = getCategoryPath(category);
      path.forEach(cat => {
        if (!newCategories.includes(cat.id)) {
          newCategories.push(cat.id);
        }
      });
    }

    onFilterChange({ ...filters, categories: newCategories });
  };

  const findCategoryById = (cats: NewsCategory[], id: number): NewsCategory | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      const found = findCategoryById(cat.children || [], id);
      if (found) return found;
    }
    return null;
  };

  const getCategoryPath = (category: NewsCategory): NewsCategory[] => {
    const path: NewsCategory[] = [];
    let current: NewsCategory | null = category;
    
    while (current) {
      path.unshift(current);
      if (current.parent) {
        current = findCategoryById(categories, current.parent);
      } else {
        break;
      }
    }
    
    return path;
  };

  const isDescendantOf = (category: NewsCategory, ancestorId: number, allCategories: NewsCategory[]): boolean => {
    if (category.id === ancestorId) return true;
    if (!category.parent) return false;
    
    const parent = findCategoryById(allCategories, category.parent);
    return parent ? isDescendantOf(parent, ancestorId, allCategories) : false;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      onFilterChange({ ...filters, search: value || undefined });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    onFilterChange({ ...filters, [field]: value || undefined });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFilterChange({
      categories: [],
      dateFrom: undefined,
      dateTo: undefined,
      search: undefined
    });
  };

  const renderCategoryTree = (cats: NewsCategory[], level = 0) => {
    if (!Array.isArray(cats)) return null;
    
    return cats.map(category => (
      <div key={category.id} className={`category-item level-${level}`}>
        <label className="category-label">
          <input
            type="checkbox"
            checked={filters.categories.includes(category.id)}
            onChange={() => handleCategoryToggle(category.id)}
          />
          <span className={`category-name category-${category.category_type}`}>
            {t(`news.categories.${category.slug}`, category.name)}
          </span>
        </label>
        {category.children && category.children.length > 0 && (
          <div className="category-children">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const hasActiveFilters = filters.categories.length > 0 || 
    filters.dateFrom || filters.dateTo || filters.search;

  return (
    <div className="news-filters">
      <div className="filters-header">
        <button 
          className="filters-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{t('news.filters.title')}</span>
          <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
        {hasActiveFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            {t('news.filters.clear')}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filter-section">
            <h3>{t('news.filters.search')}</h3>
            <input
              type="text"
              placeholder={t('news.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="filter-section">
            <h3>{t('news.filters.categories')}</h3>
            <div className="category-tree">
              {renderCategoryTree(categories)}
            </div>
          </div>

          <div className="filter-section">
            <h3>{t('news.filters.dateRange')}</h3>
            <div className="date-inputs">
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                placeholder={t('news.filters.dateFrom')}
              />
              <span>-</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                placeholder={t('news.filters.dateTo')}
              />
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && !isExpanded && (
        <div className="active-filters">
          <span>{t('news.filters.active')}:</span>
          {filters.search && <span className="filter-tag">{t('news.filters.searchActive')}</span>}
          {filters.categories.length > 0 && (
            <span className="filter-tag">
              {t('news.filters.categoriesActive', { count: filters.categories.length })}
            </span>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="filter-tag">{t('news.filters.dateActive')}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsFilters;