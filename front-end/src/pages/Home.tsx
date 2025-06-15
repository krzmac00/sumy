// src/pages/Home.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import TabbedLayout from '../components/TabbedLayout/TabbedLayout';
import DayView from '../components/DayView/DayView';
import NewsFeed from '../components/NewsFeed/NewsFeed';
import PinnedThreads from '../components/PinnedThreads/PinnedThreads';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation();

  const tabs = [
    {
      id: 'today',
      label: t('home.tabs.todayEvents', 'Wydarzenia dziś'),
      component: DayView
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
