import React, {useEffect, useState, useRef, ChangeEvent} from 'react';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import './Profile.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProfilePictureUpload from '../components/ProfilePictureUpload';

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  login: string;
  role: string;
  blacklist: string;
  bio: string;
  profile_picture_url?: string | null;
  profile_thumbnail_url?: string | null;
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [blacklist, setBlacklist] = useState('');
  const [bio, setBio] = useState('');
  const blacklistRef = useRef<HTMLTextAreaElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
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

        setBio(response.data.bio || '');
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

  // Auto-resize textarea for bio
  useEffect(() => {
    if (bioRef.current) {
      bioRef.current.style.height = 'auto';
      bioRef.current.style.height = `${bioRef.current.scrollHeight}px`;
    }
  }, [bio]);

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

  // Save bio separately
  const saveBio = async (newBio: string) => {
    if (!userData) return;
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        'http://localhost:8000/api/accounts/me/',
        { bio: newBio, first_name: userData.first_name, last_name: userData.last_name, email: userData.email },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error saving bio:', error);
    }
  };

  // Obsługa zmiany w textarea
  const handleBlacklistChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setBlacklist(newValue);
    saveBlacklist(newValue);  // zapis na backend przy każdej zmianie
  };


  if (!userData) return <MainLayout><p>{t('profile.loading')}</p></MainLayout>;

  const handleBioChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setBio(newValue);
    saveBio(newValue);
  };

  const handleProfilePictureUpdate = (updatedUser: any) => {
    // Update only the profile picture URLs
    if (userData) {
      setUserData({
        ...userData,
        profile_picture_url: updatedUser.profile_picture_url || null,
        profile_thumbnail_url: updatedUser.profile_thumbnail_url || null
      });
    }
  };


  return (
    <MainLayout>
      <div className="profile-page">
        <h1>{t('profile.userProfile')}</h1>

        <div className="profile-section">
          <ProfilePictureUpload 
            currentPictureUrl={userData.profile_picture_url}
            onUploadSuccess={handleProfilePictureUpdate}
          />
          <div className="user-info">
            <p><strong>{t('profile.firstName')}</strong> {userData.first_name}</p>
            <p><strong>{t('profile.lastName')}</strong> {userData.last_name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>{t('profile.indexNumber')}</strong> {userData.email.split('@')[0]}</p>

            <button onClick={() => navigate('/profile/edit')} className="edit-profile-button">
              {t('profile.editProfile')}
            </button>
          </div>
        </div>
        {/* Bio section */}
        <p><strong>{t("profile.bio")}</strong></p>
          <textarea
            ref={bioRef}
            value={bio}
            onChange={handleBioChange}
            placeholder={t("profile.bioPlaceholder")}
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'none', overflow: 'hidden' }}
          />
        <p style={{ marginTop: '16px'}}><strong>{t('profile.blackListForum')}</strong></p>
        <p style={{ color: '#555555', fontStyle: 'italic', marginTop: '-4px', marginBottom: '4px' }}>
          {t('profile.blacklistExample')}
        </p>
        <textarea
          ref={textareaRef}
          value={blacklist}
          onChange={handleBlacklistChange}
          placeholder={t('profile.addBlacklistedCotent')}
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
