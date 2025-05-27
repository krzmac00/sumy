// src/pages/Home.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import UnderConstruction from '../components/UnderConstruction';
import './Home.css';
//import Calendar from '@/components/Calendar';
//import { useLocation } from 'react-router-dom';

const Home: React.FC = () => {
  const { t } = useTranslation();
  //const { hash } = useLocation();

  return (
    <MainLayout>
      <UnderConstruction />
    </MainLayout>
  );
};

export default Home;
