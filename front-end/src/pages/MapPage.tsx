import React from 'react';
import MainLayout from '../layouts/MainLayout';
import MapFilterPanel from '../components/MapFilterPanel';

const MapPage: React.FC = () => {
  return (
    <MainLayout>
      <div style={{ display: 'flex', gap: '20px' }}>
        <MapFilterPanel />
        <div style={{ flex: 1, backgroundColor: '#e5e5e5', height: '500px' }}>
          {/* Tu w przyszłości będzie komponent mapy */}
        </div>
      </div>
    </MainLayout>
  );
};

export default MapPage;
