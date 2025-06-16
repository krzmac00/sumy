import React, { useState } from 'react';
import './TabbedLayout.css';

interface Tab {
  id: string;
  label: string;
  component: React.ComponentType;
}

interface TabbedLayoutProps {
  tabs: Tab[];
  defaultTab?: string;
}

const TabbedLayout: React.FC<TabbedLayoutProps> = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <div className="tabbed-layout">
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default TabbedLayout;