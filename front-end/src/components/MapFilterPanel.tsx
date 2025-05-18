import React, { useState } from 'react';
import './MapFilterPanel.css';

const MapFilterPanel: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [radius, setRadius] = useState(5);

  const handleCheckboxChange = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleApply = () => {
    console.log({ selectedCategories, type, radius });
    // Tu można wysłać dane do komponentu mapy
  };

  return (
    <div className="map-filter-panel">
      <h2>Filtry mapy</h2>

      <div className="filter-group">
        <label>Kategorie:</label>
        <div className="checkbox-group">
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('faculty')} />
            Budynki wydziału
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('academic')} />
            Budynki ogólnoakademickie
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('administration')} />
            Administracja
          </label>
        </div>
      </div>

      <div className="filter-group">
        <label>Typ obiektu:</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">-- wybierz --</option>
          <option value="academic">Akademicki</option>
          <option value="dorm">Akademik</option>
          <option value="facility">Obiekt sportowy</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Promień (km):</label>
        <input
          type="range"
          min="1"
          max="20"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <span>{radius} km</span>
      </div>

      <button className="apply-button" onClick={handleApply}>
        Zastosuj filtry
      </button>
    </div>
  );
};

export default MapFilterPanel;
