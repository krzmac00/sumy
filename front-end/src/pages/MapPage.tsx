import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import MapFilterPanel from '../components/MapFilterPanel';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';
import { LatLngExpression } from 'leaflet';
import BuildingFloorModal from '../components/BuildingFloorModal';

const DEFAULT_POSITION: LatLngExpression = [51.746032, 19.453547];

const MapPage: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const floorPlans = {
    "Parter": "/images/b9_f0.png",
    "Piętro 1": "/images/b9_f0.png",
    "Piętro 2": "/images/b9_f0.png",
    "Piętro 3": "/images/b9_f3.png",
    "Piętro 4": "/images/b9_f0.png",
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', gap: '20px' }}>
        <MapFilterPanel />

        <div style={{ flex: 1 }}>
          <MapContainer
            center={DEFAULT_POSITION}
            zoom={17}
            scrollWheelZoom={true}
            className="leaflet-map"
          >
            <TileLayer
              // @ts-ignore
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[51.747192, 19.453947]} eventHandlers={{ click: () => setModalOpen(true) }} />
          </MapContainer>
        </div>
      </div>

      <BuildingFloorModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        buildingName="Budynek B9 Lodex"
        floorImages={floorPlans}
        defaultFloor="Piętro 1"
      />
    </MainLayout>
  );
};

export default MapPage;
