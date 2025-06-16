import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, DollarSign, MapPin, Phone, Info, Loader2 } from 'lucide-react';
import { AdvertisementCategory, AdvertisementUpdateData, CATEGORY_COLORS, AdvertisementDetail } from '../../types/noticeboard';
import { advertisementAPI } from '../../services/noticeboardAPI';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../layouts/MainLayout';
import './AdvertisementCreatePage.css';

const AdvertisementEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser: user } = useAuth();
  
  const [advertisement, setAdvertisement] = useState<AdvertisementDetail | null>(null);
  const [formData, setFormData] = useState<AdvertisementUpdateData>({});
  const [errors, setErrors] = useState<Partial<Record<keyof AdvertisementUpdateData, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categories: AdvertisementCategory[] = [
    'announcement', 'sale', 'buy', 'service', 'event', 'lost_found', 'other'
  ];

  useEffect(() => {
    fetchAdvertisement();
  }, [id]);

  const fetchAdvertisement = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await advertisementAPI.get(parseInt(id));
      setAdvertisement(data);
      
      // Initialize form data with current values
      setFormData({
        title: data.title,
        content: data.content,
        category: data.category,
        contact_info: data.contact_info || '',
        location: data.location || '',
        price: data.price,
        expires_at: data.expires_at
      });
    } catch (err) {
      console.error('Error fetching advertisement:', err);
      setSubmitError(t('noticeboard.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name as keyof AdvertisementUpdateData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFormData(prev => ({ ...prev, price: undefined }));
    } else {
      const price = parseFloat(value);
      if (!isNaN(price) && price >= 0) {
        setFormData(prev => ({ ...prev, price }));
      }
    }
  };

  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      // Convert to ISO string for API
      const date = new Date(value);
      setFormData(prev => ({ ...prev, expires_at: date.toISOString() }));
    } else {
      setFormData(prev => ({ ...prev, expires_at: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AdvertisementUpdateData, string>> = {};

    if (formData.title !== undefined && !formData.title.trim()) {
      newErrors.title = t('noticeboard.errors.titleRequired');
    } else if (formData.title && formData.title.length > 200) {
      newErrors.title = t('noticeboard.errors.titleTooLong');
    }

    if (formData.content !== undefined && !formData.content.trim()) {
      newErrors.content = t('noticeboard.errors.contentRequired');
    }

    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = t('noticeboard.errors.invalidPrice');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id || !advertisement) return;

    try {
      setSaving(true);
      setSubmitError(null);
      
      // Only send changed fields
      const changedFields: AdvertisementUpdateData = {};
      Object.keys(formData).forEach(key => {
        const field = key as keyof AdvertisementUpdateData;
        if (formData[field] !== advertisement[field]) {
          changedFields[field] = formData[field];
        }
      });
      
      if (Object.keys(changedFields).length === 0) {
        // No changes made
        navigate(`/noticeboard/${id}`);
        return;
      }
      
      await advertisementAPI.update(parseInt(id), changedFields);
      navigate(`/noticeboard/${id}`);
    } catch (err) {
      setSubmitError(t('noticeboard.errors.updateFailed'));
      console.error('Error updating advertisement:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    navigate('/auth?redirect=/noticeboard');
    return null;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">
          <Loader2 className="loading-spinner" size={48} />
        </div>
      </MainLayout>
    );
  }

  if (!advertisement || advertisement.author.id !== user.id) {
    return (
      <MainLayout>
        <div className="error-container">
          <h2>{t('noticeboard.errors.notAuthorized')}</h2>
          <button className="primary-button" onClick={() => navigate('/noticeboard')}>
            {t('common.back')}
          </button>
        </div>
      </MainLayout>
    );
  }

  // Calculate min date for expiration (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate max date for expiration (90 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <MainLayout>
      <div className="advertisement-create-page">
        <div className="page-header">
          <button className="back-button-advertisment" onClick={() => navigate(`/noticeboard/${id}`)}>
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
          <h1>{t('noticeboard.editAdvertisement')}</h1>
        </div>

        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="category">
                {t('noticeboard.category')} <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {t(`noticeboard.categories.${category}`)}
                  </option>
                ))}
              </select>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="title">
                {t('noticeboard.title')} <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                placeholder={t('noticeboard.titlePlaceholder')}
                maxLength={200}
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="content">
                {t('noticeboard.content')} <span className="required">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content || ''}
                onChange={handleInputChange}
                placeholder={t('noticeboard.contentPlaceholder')}
                rows={8}
                className={`styled-textarea ${errors.content ? 'error' : ''}`}
              />
              {errors.content && <span className="error-message">{errors.content}</span>}
            </div>
          </div>

          <div className="form-section">
            <h2>{t('noticeboard.additionalInfo')}</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">
                  <DollarSign size={18} />
                  {t('noticeboard.price')}
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ''}
                  onChange={handlePriceChange}
                  placeholder={t('noticeboard.pricePlaceholder')}
                  min="0"
                  step="0.01"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  <MapPin size={18} />
                  {t('noticeboard.location')}
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  placeholder={t('noticeboard.locationPlaceholder')}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact_info">
                <Phone size={18} />
                {t('noticeboard.contactInfo')}
              </label>
              <textarea
                id="contact_info"
                name="contact_info"
                value={formData.contact_info || ''}
                onChange={handleInputChange}
                placeholder={t('noticeboard.contactPlaceholder')}
                rows={3}
                className={`styled-textarea`}
              />
              <div className="field-hint">
                <Info size={14} />
                {t('noticeboard.contactHint')}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="expires_at">
                <Calendar size={18} />
                {t('noticeboard.expirationDate')}
              </label>
              <input
                type="date"
                id="expires_at"
                name="expires_at"
                value={formData.expires_at ? formData.expires_at.split('T')[0] : ''}
                onChange={handleExpirationChange}
                min={minDate}
                max={maxDateStr}
              />
              <div className="field-hint">
                <Info size={14} />
                {t('noticeboard.expirationHint')}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="submit-error">{submitError}</div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button-advertisment"
              onClick={() => navigate(`/noticeboard/${id}`)}
              disabled={saving}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="submit-button-advertisment"
              disabled={saving}
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>

        <div className="category-preview">
          <h3>{t('noticeboard.preview')}</h3>
          <div className="preview-card">
            <span
              className="category-badge"
              style={{ backgroundColor: CATEGORY_COLORS[formData.category || 'other'] }}
            >
              {t(`noticeboard.categories.${formData.category || 'other'}`)}
            </span>
            <h4>{formData.title || t('noticeboard.titlePlaceholder')}</h4>
            <p>{formData.content || t('noticeboard.contentPlaceholder')}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdvertisementEditPage;