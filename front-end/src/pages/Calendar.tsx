import React from 'react';
import Calendar from '@/components/Calendar.tsx';
import MainLayout from '../layouts/MainLayout';
import { useTranslation } from 'react-i18next';

const CalendarPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <h1>{t('nav.calendar')}</h1>
      <Calendar />
    </MainLayout>
  );
};

export default CalendarPage;
