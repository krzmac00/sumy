import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import './EditProfile.css';
import { useNavigate } from 'react-router-dom'; // dodaj na górze pliku


const EditProfile: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: '123456@edu.p.lodz.pl',
    password: '',
    confirmPassword: '',
    avatar: null as File | null
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'avatar' && files) {
      setFormData({ ...formData, avatar: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    // Walidacja imienia i nazwiska
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Imię i nazwisko nie mogą być puste.');
      return;
    }
  
    // Walidacja haseł (jeśli użytkownik je edytuje)
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
  
    // Jeśli wszystko OK
    console.log('Zapisane dane:', formData);
    alert('Zapisano zmiany (tylko frontend)');
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
          <input type="email" name="email" value={formData.email} readOnly disabled className="disabled-input"/>

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

          <button type="submit" className="save-button">Zapisz zmiany</button>
          <button type="button" className="back-button" onClick={() => navigate('/profile')}>Anuluj</button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditProfile;
