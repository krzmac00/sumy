import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import './EditProfile.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
      alert(t("editProfile.empty_names"));
      return;
    }

    if (showPasswordFields) {
      if (!formData.password || !formData.confirmPassword) {
        alert(t("editProfile.fill_both_passwords"));
        return;
      }

      if (formData.password.length < 6) {
        alert(t("editProfile.password_len"));
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert(t("editProfile.password_no_match"));
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


    alert(t("editProfile.successful_update"));
    navigate('/profile');
  } catch (error) {
    console.error('Błąd podczas aktualizacji profilu:', error);
    alert(t("editProfile.unsuccessful_update"));
  }
};

  return (
    <MainLayout>
      <div className="edit-profile-page">
        <h1>{t("editProfile.title")}</h1>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <label>{t("editProfile.first_name")}</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />

          <label>{t("editProfile.last_name")}</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />

          <label>{t("editProfile.email")}</label>
          <input type="email" name="email" value={formData.email} readOnly disabled className="disabled-input" />

          <label>{t("editProfile.avatar")}</label>
          <input type="file" name="avatar" accept="image/*" onChange={handleChange} />

          <button
            type="button"
            className="toggle-password-button"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
          >
            {showPasswordFields ? t("editProfile.cancel_password_update") : t("editProfile.update_password")}
          </button>

          {showPasswordFields && (
            <>
              <label>{t("editProfile.new_password")}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />

              <label>{t("editProfile.repeat_password")}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </>
          )}

          <button type="submit" className="save-button">
            {t("editProfile.save")}
          </button>
          <button type="button" className="back-button" onClick={() => navigate('/profile')}>
            {t("editProfile.cancel")}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditProfile;
