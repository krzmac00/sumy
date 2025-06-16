// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import TabbedLayout from '../components/TabbedLayout/TabbedLayout';
import TodayEvents from '../components/TodayEvents';
import NewsFeed from '../components/NewsFeed/NewsFeed';
import PinnedThreads from '../components/PinnedThreads/PinnedThreads';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);

  useEffect(() => {
    // Get selected schedule from localStorage if available
    const storedScheduleId = localStorage.getItem('selectedScheduleId');
    if (storedScheduleId) {
      setSelectedScheduleId(parseInt(storedScheduleId));
    }
  }, []);

  const tabs = [
    {
      id: 'today',
      label: t('home.tabs.todayEvents', 'Wydarzenia dziś'),
      component: () => <TodayEvents scheduleId={selectedScheduleId} />
    },
    {
      id: 'news',
      label: t('home.tabs.newsFeed', 'Aktualności'),
      component: NewsFeed
    },
    {
      id: 'pinned',
      label: t('home.tabs.pinnedThreads', 'Przypięte wątki'),
      component: PinnedThreads
    }
  ];

  return (
    <MainLayout>
      <TabbedLayout tabs={tabs} defaultTab="today" />
    </MainLayout>
  );
};

export default Home;
