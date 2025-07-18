import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import { NewsCategory } from '../../types/news';
import { newsAPI } from '../../services/newsAPI';
import './CreateNewsPage.css';

const CreateNewsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_ids: [] as number[],
    event_date: '',
    event_location: '',
    event_end_date: '',
    event_description: '',
    event_room: '',
    event_teacher: ''
  });

  // Check permissions
  useEffect(() => {
    if (!currentUser || !['lecturer', 'admin'].includes(currentUser.role)) {
      navigate('/home');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await newsAPI.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError(t('news.errors.loadCategoriesFailed'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (categoryId: number) => {
    const category = findCategoryById(categories, categoryId);
    if (!category) return;

    let newCategories = [...formData.category_ids];
    
    if (newCategories.includes(categoryId)) {
      // Remove category and its children
      newCategories = newCategories.filter(id => {
        const cat = findCategoryById(categories, id);
        return !cat || !isDescendantOf(cat, categoryId, categories);
      });
    } else {
      // Add category and its parents
      const path = getCategoryPath(category);
      path.forEach(cat => {
        if (!newCategories.includes(cat.id)) {
          newCategories.push(cat.id);
        }
      });
    }

    setFormData(prev => ({ ...prev, category_ids: newCategories }));
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

  const renderCategoryTree = (cats: NewsCategory[], level = 0) => {
    return cats.map(category => (
      <div key={category.id} className={`category-select-item level-${level}`}>
        <label className="category-select-label">
          <input
            type="checkbox"
            checked={formData.category_ids.includes(category.id)}
            onChange={() => handleCategoryToggle(category.id)}
          />
          <span className={`category-select-name category-${category.category_type}`}>
            {t(`news.categories.${category.slug}`, category.name)}
          </span>
        </label>
        {category.children && category.children.length > 0 && (
          <div className="category-select-children">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError(t('news.errors.requiredFields'));
      return;
    }

    if (formData.category_ids.length === 0) {
      setError(t('news.errors.selectCategory'));
      return;
    }
    
    // Validate event fields if event category is selected
    if (hasEventCategory) {
      if (!formData.event_date || !formData.event_end_date || !formData.event_location.trim()) {
        setError(t('news.errors.eventFieldsRequired'));
        return;
      }
      
      // Validate end date is after start date
      if (new Date(formData.event_end_date) < new Date(formData.event_date)) {
        setError(t('news.errors.invalidEventDates'));
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const newsData = {
        title: formData.title,
        content: formData.content,
        category_ids: formData.category_ids,
        event_date: formData.event_date || undefined,
        event_location: formData.event_location || undefined,
        event_end_date: formData.event_end_date || undefined,
        event_description: formData.event_description || undefined,
        event_room: formData.event_room || undefined,
        event_teacher: formData.event_teacher || undefined
      };

      const createdNews = await newsAPI.createNewsItem(newsData);
      navigate(`/news/${createdNews.id}`);
    } catch (err) {
      console.error('Failed to create news:', err);
      setError(t('news.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const hasEventCategory = formData.category_ids.some(id => {
    const cat = findCategoryById(categories, id);
    return cat && cat.category_type === 'event';
  });

  // Set default event organizer when event category is selected
  useEffect(() => {
    if (hasEventCategory && currentUser && !formData.event_teacher) {
      setFormData(prev => ({
        ...prev,
        event_teacher: `${currentUser.first_name} ${currentUser.last_name}`
      }));
    }
  }, [hasEventCategory, currentUser, formData.event_teacher]);

  return (
    <MainLayout>
      <div className="create-news-page">
        <div className="create-news-header">
          <h1>{t('news.createNews')}</h1>
          <button 
            type="button" 
            onClick={() => navigate('/home')}
            className="cancel-button-news"
          >
            {t('common.goBack')}
          </button>
        </div>

        {error && (
          <div className="create-news-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-news-form">
          <div className="form-group">
            <label htmlFor="title">{t('news.form.title')} *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t('news.form.titlePlaceholder')}
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">{t('news.form.content')} *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder={t('news.form.contentPlaceholder')}
              rows={10}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('news.form.categories')} *</label>
            <div className="category-selection">
              {renderCategoryTree(categories)}
            </div>
          </div>

          {hasEventCategory && (
            <>
              <div className="event-details-section">
                <h3>{t('news.form.eventDetails')}</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event_date">{t('news.form.eventStartDate')} *</label>
                    <input
                      type="datetime-local"
                      id="event_date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      required={hasEventCategory}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="event_end_date">{t('news.form.eventEndDate')} *</label>
                    <input
                      type="datetime-local"
                      id="event_end_date"
                      name="event_end_date"
                      value={formData.event_end_date}
                      onChange={handleInputChange}
                      min={formData.event_date}
                      required={hasEventCategory}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="event_location">{t('news.form.eventLocation')} *</label>
                  <input
                    type="text"
                    id="event_location"
                    name="event_location"
                    value={formData.event_location}
                    onChange={handleInputChange}
                    placeholder={t('news.form.eventLocationPlaceholder')}
                    required={hasEventCategory}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event_room">{t('news.form.eventRoom')}</label>
                    <input
                      type="text"
                      id="event_room"
                      name="event_room"
                      value={formData.event_room}
                      onChange={handleInputChange}
                      placeholder={t('news.form.eventRoomPlaceholder')}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="event_teacher">{t('news.form.eventOrganizer')}</label>
                    <input
                      type="text"
                      id="event_teacher"
                      name="event_teacher"
                      value={formData.event_teacher}
                      onChange={handleInputChange}
                      placeholder={t('news.form.eventOrganizerPlaceholder')}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="event_description">{t('news.form.eventDescription')}</label>
                  <textarea
                    id="event_description"
                    name="event_description"
                    value={formData.event_description}
                    onChange={handleInputChange}
                    placeholder={t('news.form.eventDescriptionPlaceholder')}
                    rows={4}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/home')}
              className="cancel-button-news"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="submit-button-news"
              disabled={loading}
            >
              {loading ? t('common.saving') : t('news.form.publish')}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateNewsPage;