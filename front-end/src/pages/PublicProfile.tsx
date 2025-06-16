import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import './Profile.css';  
import { useTranslation } from 'react-i18next';
import { getMediaUrl } from '../utils/mediaUrl';
import '../components/ProfilePictureUpload/ProfilePictureUpload.css';

interface PublicUserData {
  first_name: string;
  last_name: string;
  email: string;
  bio: string;
  profile_picture_url?: string | null;
  profile_thumbnail_url?: string | null;
  role: string;
}

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const [userData, setUserData] = useState<PublicUserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`http://localhost:8000/api/accounts/users/${userId}/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching public user data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  if (!userData) {
    return (
      <MainLayout>
        <p>{t('profile.loading')}</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="profile-page">
        <h1>{t('profile.userProfile')}</h1>
        <div className="profile-section">
          <div className="current-picture">
            <img 
              src={getMediaUrl(userData.profile_picture_url) || '/user_default_image.png'}
              alt={t('profile.picture.current', 'Profile picture')}
              onError={(e) => {
                e.currentTarget.src = '/user_default_image.png';
              }}
            />
          </div>
          <div className="user-info">
            <p><strong>{t('profile.firstName')}</strong> {userData.first_name}</p>
            <p><strong>{t('profile.lastName')}</strong> {userData.last_name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            {userData.role === 'student' && (
              <p><strong>{t('profile.indexNumber')}</strong> {userData.email.split('@')[0]}</p>
            )}
          </div>
        </div>
        <div className="profile-box" style={{ marginTop: '20px' }}>
          <p><strong>{t("profile.bio")}</strong></p>
          <p>{userData.bio || t("profile.noBio")}</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default PublicProfile;
