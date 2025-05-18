import React from 'react';
import MainLayout from '../layouts/MainLayout';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const navigate = useNavigate();


  const user = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: '123456@edu.p.lodz.pl',
    id: '123456',
  };

  return (
    <MainLayout>
      <div className="profile-page">
        <h1>Profil użytkownika</h1>

        <div className="profile-section">
          <div className="avatar">👤</div>
          <div className="user-info">
            <p><strong>Imię:</strong> {user.firstName}</p>
            <p><strong>Nazwisko:</strong> {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Numer indeksu:</strong> {user.id}</p>

            <button onClick={() => navigate('/profile/edit')} className="edit-profile-button">
              Edytuj profil
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
