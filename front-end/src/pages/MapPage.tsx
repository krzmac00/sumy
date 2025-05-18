import React from 'react';
import MainLayout from '../layouts/MainLayout';
import MapFilterPanel from '../components/MapFilterPanel';
import { MapContainer, TileLayer, /* Marker, Popup */} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPage.css'
import { LatLngExpression } from 'leaflet';

const DEFAULT_POSITION: LatLngExpression = [51.746032, 19.453547];

const MapPage: React.FC = () => {
  return (
    <MainLayout>
      <div style={{ display: 'flex', gap: '20px' }}>
        <MapFilterPanel />

        <div style={{ flex: 1 }}>
          <MapContainer
            center={DEFAULT_POSITION}
            zoom={15}
            scrollWheelZoom={true}
            className="leaflet-map"
          >
            <TileLayer
              // @ts-ignore
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        </div>
      </div>
    </MainLayout>
  );
};

export default MapPage;
