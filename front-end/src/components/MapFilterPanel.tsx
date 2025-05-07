import React, { useState } from 'react';
import './MapFilterPanel.css';

const MapFilterPanel: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [radius] = useState(5);

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
        <label>Typ budynku:</label>
        <div className="checkbox-group">
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('faculty')} />
            Wydziałowy
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('non-faculty')} />
            Pozawydziałowy
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('academic')} />
            Ogólnoakademicki
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('administration')} />
            Administracja i władze
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('lodge')} />
            Portiernia
          </label>
        </div>
      </div>

      <div className="filter-group">
        <label>Typ pomieszczenia:</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">-- wybierz --</option>
          <option value="auditorium">Aula</option>
          <option value="class">Sala</option>
          <option value="lab">Laboratorium</option>
        </select>
      </div>

      <button className="apply-button" onClick={handleApply}>
        Zastosuj filtry
      </button>
    </div>
  );
};

export default MapFilterPanel;
