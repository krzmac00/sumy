import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useTranslation } from 'react-i18next';
import Timetable from '@/components/Timetable';

const TimetablePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <h1>{t('nav.timetable')}</h1>
      <Timetable />
    </MainLayout>
  );
};

export default TimetablePage;
