import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  login: string;
  role: string;
  blacklist: string;
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [blacklist, setBlacklist] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('http://localhost:8000/api/accounts/me/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(response.data);
        const formattedBlacklist = (response.data.blacklist || [])
          .map((item: string) => `"${item}"`)
          .join(' ');
        setBlacklist(formattedBlacklist);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Dopasowanie wysokości textarea przy zmianie wartości
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // reset wysokości
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // ustaw na wysokość zawartości
    }
  }, [blacklist]);

  const saveBlacklist = async (newBlacklist: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put('http://localhost:8000/api/accounts/me/',
        { first_name: userData?.first_name,
          last_name: userData?.last_name,
          email: userData?.email,
          blacklist: newBlacklist },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // możesz dodać powiadomienie o sukcesie lub logowanie
    } catch (error) {
      console.error('Unable to save blacklist:', error);
    }
  };

  // Obsługa zmiany w textarea
  const handleBlacklistChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setBlacklist(newValue);
    saveBlacklist(newValue);  // zapis na backend przy każdej zmianie
  };

  if (!userData) return <MainLayout><p>{t('profile.loading')}</p></MainLayout>;

  return (
    <MainLayout>
      <div className="profile-page">
        <h1>{t("profile.h1")}</h1>

        <div className="profile-section">
          <div className="avatar">👤</div>
          <div className="user-info">
            <p><strong>{t('profile.first_name')}</strong> {userData.first_name}</p>
            <p><strong>{t('profile.last_name')}</strong> {userData.last_name}</p>
            <p><strong>{t('profile.email')}</strong> {userData.email}</p>
            <p><strong>{t('profile.index_number')}</strong> {userData.email.split('@')[0]}</p>

            <button onClick={() => navigate('/profile/edit')} className="edit-profile-button">
              {t("profile.edit")}
            </button>
          </div>
        </div>

        <p><strong>{t("profile.blacklist")}</strong></p>
        <p style={{ color: '#555555', fontStyle: 'italic', marginTop: '-4px', marginBottom: '4px' }}>
          {t("profile.blacklist_tip")}
        </p>
        <textarea
          ref={textareaRef}
          value={blacklist}
          onChange={handleBlacklistChange}
          placeholder={t("profile.blacklist_placeholder")}
          rows={1} // minimalna wysokość 1 linijka
          style={{
            width: '100%',
            boxSizing: 'border-box',
            resize: 'none',      // blokada ręcznego zmieniania rozmiaru
            overflow: 'hidden'   // ukrycie pasków przewijania
          }}
        />
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
