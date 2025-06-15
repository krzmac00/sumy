import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import { useUserProfile } from '../hooks/useUserProfile';
import '../pages/Profile.css';

const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { userData, loading, error } = useUserProfile(userId || '');

  if (loading) {
    return (
      <MainLayout>
        <div className="profile-page">
          <p>{t('profile.loading')}</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !userData) {
    return (
      <MainLayout>
        <div className="profile-page">
          <h1>{t('profile.userNotFound', 'User not found')}</h1>
          <button onClick={() => navigate(-1)} className="edit-profile-button">
            {t('common.goBack', 'Go Back')}
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="profile-page">
        <h1>{t('profile.userProfile')}</h1>

        <div className="profile-section">
          <div className="avatar">👤</div>
          <div className="user-info">
            <p><strong>{t('profile.firstName')}</strong> {userData.first_name}</p>
            <p><strong>{t('profile.lastName')}</strong> {userData.last_name}</p>
            <p><strong>{t('profile.role')}:</strong> {t(`roles.${userData.role}`, userData.role)}</p>
            <p><strong>{t('profile.joinDate', 'Member since')}:</strong> {new Date(userData.date_joined).toLocaleDateString()}</p>
          </div>
        </div>

        {userData.bio && (
          <div style={{ marginTop: '20px' }}>
            <p><strong>{t('profile.bio')}</strong></p>
            <div style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {userData.bio}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <button onClick={() => navigate(-1)} className="edit-profile-button">
            {t('common.goBack', 'Go Back')}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfile;