import React from "react";
import "./MapFilterPanel.css";
import { useTranslation } from "react-i18next";

// Te same kategorie co w MapPage
const allCategories = [
  "wydziałowe",
  "pozawydziałowe",
  "ogólnouczelniane",
  "administracja",
] as const;
type Category = typeof allCategories[number];

interface Props {
  activeCategories: Category[];
  toggleCategory: (cat: Category) => void;
}

const MapFilterPanel: React.FC<Props> = ({ activeCategories, toggleCategory }) => {
  const { t } = useTranslation();

  // Funkcja tłumacząca klucz kategorii na etykietę
  const labelFor = (cat: Category) => {
    switch (cat) {
      case "wydziałowe":        return t("map.filter.faculty");        // „Wydziałowe” / „Faculty buildings”
      case "pozawydziałowe":    return t("map.filter.nonFaculty");     // „Pozawydziałowe” / „Non-faculty buildings”
      case "ogólnouczelniane":  return t("map.filter.generalAcademic");// „Ogólnouczelniane” / „General academic”
      case "administracja":     return t("map.filter.administration");// „Administracja” / „Administration”
    }
  };

  return (
    <div className="map-filter-panel">
      <h2>{t("map.filter.mapFilters")}</h2>

      <div className="filter-group">
        <strong>{t("map.filter.buildingType")}</strong>
        <div className="checkbox-group">
          {allCategories.map(cat => (
            <label key={cat}>
              <input
                type="checkbox"
                checked={activeCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              { labelFor(cat) }
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapFilterPanel;
