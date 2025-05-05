// src/pages/Home.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <div className="home-page">
        <h1>{t('home.welcome')}</h1>
        <p>{t('home.description')}</p>
        <div className="content-section">
          <h2>{t('home.features.title')}</h2>
          <ul>
            <li>{t('home.features.navbar')}</li>
            <li>{t('home.features.sidebar')}</li>
            <li>{t('home.features.i18n')}</li>
            <li>{t('home.features.userMenu')}</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;