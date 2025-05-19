import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import './EditProfile.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const EditProfile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateUser, currentUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null as File | null,
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('http://localhost:8000/api/accounts/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        setFormData({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          password: '',
          confirmPassword: '',
          avatar: null,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Nie udało się załadować danych użytkownika.');
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'avatar' && files) {
      setFormData({ ...formData, avatar: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert(t("profile.edit.empty_names"));
      return;
    }

    if (showPasswordFields) {
      if (!formData.password || !formData.confirmPassword) {
        alert(t("profile.edit.fill_both_passwords"));
        return;
      }

      if (formData.password.length < 6) {
        alert(t("profile.edit.password_len"));
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert(t("profile.edit.password_no_match"));
        return;
      }
    }

    try {
    const token = localStorage.getItem('auth_token');

    const formPayload = new FormData();
    formPayload.append('first_name', formData.firstName);
    formPayload.append('last_name', formData.lastName);
    formPayload.append('email', formData.email);
    if (formData.avatar) formPayload.append('avatar', formData.avatar);
    if (showPasswordFields && formData.password) formPayload.append('password', formData.password);

    const response = await axios.put('http://localhost:8000/api/accounts/me/', formPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    // Aktualizuj globalny stan użytkownika
    const updatedUser = response.data;
    updateUser(updatedUser);


    alert(t("profile.edit.successful_update"));
    navigate('/profile');
  } catch (error) {
    console.error('Błąd podczas aktualizacji profilu:', error);
    alert(t("profile.edit.unsuccessful_update"));
  }
};

  return (
    <MainLayout>
      <div className="edit-profile-page">
        <h1>{t('profile.edit.editProfile')}</h1>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <label>{t('profile.firstName')}</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />

          <label>{t('profile.lastName')}</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />

          <label>Email:</label>
          <input type="email" name="email" value={formData.email} readOnly disabled className="disabled-input" />

          <label>Avatar:</label>
          <input type="file" name="avatar" accept="image/*" onChange={handleChange} />

          <button
            type="button"
            className="toggle-password-button"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
          >
            {showPasswordFields ? t("profile.edit.changePasswordCancel") : t("profile.edit.changePassword")}
          </button>

          {showPasswordFields && (
            <>
              <label>{t('profile.edit.newPassword')}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />

              <label>{t('profile.edit.repeatPassword')}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </>
          )}

          <button type="submit" className="save-button">
            {t('profile.edit.saveChanges')}
          </button>
          <button type="button" className="back-button" onClick={() => navigate('/profile')}>
            {t('profile.edit.cancel')}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditProfile;
