import React from 'react';
import MainLayout from '../layouts/MainLayout';
import './Profile.css';

const Profile: React.FC = () => {
  const user = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: '123456@edu.p.lodz.pl',
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
