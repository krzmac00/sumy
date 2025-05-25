import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../layouts/MainLayout';
import './EditProfile.css';
import { useNavigate } from 'react-router-dom';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();

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
      alert('Imię i nazwisko nie mogą być puste.');
      return;
    }

    if (showPasswordFields) {
      if (!formData.password || !formData.confirmPassword) {
        alert('Wprowadź oba pola hasła.');
        return;
      }

      if (formData.password.length < 6) {
        alert('Hasło musi mieć co najmniej 6 znaków.');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        alert('Hasła się nie zgadzają.');
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

      await axios.put('http://localhost:8000/api/accounts/me/', formPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Profil zaktualizowany pomyślnie!');
      navigate('/profile');
    } catch (error) {
      console.error('Błąd podczas aktualizacji profilu:', error);
      alert('Nie udało się zaktualizować profilu.');
    }
  };

  return (
    <MainLayout>
      <div className="edit-profile-page">
        <h1>Edytuj profil</h1>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <label>Imię:</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />

          <label>Nazwisko:</label>
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
            {showPasswordFields ? 'Anuluj zmianę hasła' : 'Zmień hasło'}
          </button>

          {showPasswordFields && (
            <>
              <label>Nowe hasło:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />

              <label>Powtórz hasło:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </>
          )}

          <button type="submit" className="save-button">
            Zapisz zmiany
          </button>
          <button type="button" className="back-button" onClick={() => navigate('/profile')}>
            Anuluj
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditProfile;
