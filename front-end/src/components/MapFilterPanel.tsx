import React, { useState } from 'react';
import './MapFilterPanel.css';
import { useTranslation } from 'react-i18next';

const MapFilterPanel: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [radius] = useState(5);
  const { t } = useTranslation();

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
      <h2>{t('map.filter.mapFilters')}</h2>

      <div className="filter-group">
        <label>{t('map.filter.buildingType')}</label>
        <div className="checkbox-group">
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('faculty')} />
            {t('map.filter.faculty')}
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('non-faculty')} />
            {t('map.filter.nonFaculty')}
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('academic')} />
            {t('map.filter.generalAcademic')}
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('administration')} />
            {t('map.filter.administration')}
          </label>
          <label>
            <input type="checkbox" onChange={() => handleCheckboxChange('lodge')} />
            {t('map.filter.porter')}
          </label>
        </div>
      </div>

      <div className="filter-group">
        <label>{t('map.filter.roomType')}</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t('map.filter.choice')}</option>
          <option value="auditorium">{t('map.filter.auditorium')}</option>
          <option value="class">{t('map.filter.class')}</option>
          <option value="lab">{t('map.filter.laboratory')}</option>
        </select>
      </div>

      <button className="apply-button" onClick={handleApply}>
        {t('map.filter.applyFilters')}
      </button>
    </div>
  );
};

export default MapFilterPanel;
