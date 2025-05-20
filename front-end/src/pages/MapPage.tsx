import React, { useState, useRef } from 'react';
import MainLayout from '../layouts/MainLayout';
import MapFilterPanel from '../components/MapFilterPanel';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';
import BuildingFloorModal from '../components/BuildingFloorModal';

// Define your buildings here
const buildingList: { name: string; position: LatLngExpression }[] = [
  { name: 'Budynek B9 Lodex', position: [51.747192, 19.453947] },
  { name: 'Budynek B15', position: [51.746492, 19.455347] },
  { name: 'Centrum Technologii Informatycznych CTI', position: [51.746992, 19.455847] },
  { name: 'Centrum językowe CJ B24', position: [51.745500, 19.452000] },
];

const DEFAULT_POSITION: LatLngExpression = [51.746032, 19.453547];

// Component to pan the map when a building is selected
interface PanToProps { position: LatLngExpression; }
const PanTo: React.FC<PanToProps> = ({ position }) => {
  const map = useMap();
  map.flyTo(position, 18, { duration: 1.0 });
  return null;
};

const MapPage: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedPos, setSelectedPos] = useState<LatLngExpression | null>(null);

  const floorPlans = {
    "Parter": "/images/b9_f0.png",
    "Piętro 1": "/images/b9_f0.png",
    "Piętro 2": "/images/b9_f0.png",
    "Piętro 3": "/images/b9_f3.png",
    "Piętro 4": "/images/b9_f0.png",
  };

  // Handle input change for search
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 0) {
      const filtered = buildingList
        .map(b => b.name)
        .filter(name => name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // Handle selection of a suggestion
  const handleSelect = (name: string) => {
    setSearchTerm(name);
    setSuggestions([]);
    const building = buildingList.find(b => b.name === name);
    if (building) {
      setSelectedPos(building.position);
      // Open modal only for B9
      if (building.name.includes('B9')) {
        setModalOpen(true);
      }
    }
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', gap: '20px' }}>
        <MapFilterPanel />

        <div style={{ flex: 1, position: 'relative' }}>
          {/* Search box */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Szukaj budynku..."
              value={searchTerm}
              onChange={handleChange}
              className="search-input"
            />
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((s, idx) => (
                  <li key={idx} onClick={() => handleSelect(s)}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <MapContainer
            center={DEFAULT_POSITION}
            zoom={17}
            scrollWheelZoom={true}
            className="leaflet-map"
            whenCreated={mapInstance => {
              // Optionally keep map instance
            }}
          >
            <TileLayer
              // @ts-ignore
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render all building markers */}
            {buildingList.map((b, i) => (
              <Marker
                key={i}
                position={b.position}
                eventHandlers={{
                  click: () => {
                    if (b.name.includes('B9')) setModalOpen(true);
                  }
                }}
              />
            ))}

            {/* Pan when a building is selected */}
            {selectedPos && <PanTo position={selectedPos} />}
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