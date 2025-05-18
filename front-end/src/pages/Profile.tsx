import React, { useEffect, useState, useRef } from 'react';
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
      console.error('Nie udało się zapisać czarnej listy:', error);
    }
  };

  // Obsługa zmiany w textarea
  const handleBlacklistChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setBlacklist(newValue);
    saveBlacklist(newValue);  // zapis na backend przy każdej zmianie
  };

  if (!userData) return <MainLayout><p>Ładowanie danych...</p></MainLayout>;

  return (
    <MainLayout>
      <div className="profile-page">
        <h1>Profil użytkownika</h1>

        <div className="profile-section">
          <div className="avatar">👤</div>
          <div className="user-info">
            <p><strong>Imię:</strong> {userData.first_name}</p>
            <p><strong>Nazwisko:</strong> {userData.last_name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Numer indeksu:</strong> {userData.email.split('@')[0]}</p>

            <button onClick={() => navigate('/profile/edit')} className="edit-profile-button">
              Edytuj profil
            </button>
          </div>
        </div>

        <p><strong>Czarna lista forum:</strong></p>
        <p style={{ color: '#555555', fontStyle: 'italic', marginTop: '-4px', marginBottom: '4px' }}>
          Frazy należy włożyć w cudzysłów: "Pierwsza fraza" "Druga" itd.
        </p>
        <textarea
          ref={textareaRef}
          value={blacklist}
          onChange={handleBlacklistChange}
          placeholder="Dodaj treść do czarnej listy..."
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
