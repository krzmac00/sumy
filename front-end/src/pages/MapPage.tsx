import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import MainLayout       from "../layouts/MainLayout";
import MapFilterPanel   from "../components/MapFilterPanel";
import BuildingFloorModal from "../components/BuildingFloorModal";

import type { BuildingFeature } from "../types/BuildingFeature";
import "./MapPage.css";

/* ---------- Stałe ---------- */
const buildingList: { name: string; position: LatLngExpression }[] = [
  { name: "Budynek B9 Lodex",        position: [51.747192, 19.453947] },
  { name: "Budynek B15",             position: [51.746492, 19.455347] },
  { name: "Centrum Technologii Informatycznych CTI", position: [51.746992, 19.455847] },
  { name: "Centrum językowe CJ B24", position: [51.7455,   19.452]    },
];

const DEFAULT_POSITION: LatLngExpression = [51.746032, 19.453547];

const footprintStyle: L.PathOptions = {
  color: "#8b0002",
  weight: 2,
  fillColor: "#8b0002",
  fillOpacity: 0.15,
};

/* ---------- Pomocniczy komponent do płynnego przybliżania ---------- */
const PanTo: React.FC<{ position: LatLngExpression }> = ({ position }) => {
  const map = useMap();
  map.flyTo(position, 18, { duration: 1.0 });
  return null;
};

/* ---------- Komponent strony ---------- */
const MapPage: React.FC = () => {
  /* STAN */
  const [footprints, setFootprints] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedPos, setSelectedPos] =
    useState<LatLngExpression | null>(null);
  const [modalOpen, setModalOpen]     = useState(false);

  /* FLOOR PLANS DO MODALA (dla B9) */
  const floorPlans = {
    Parter:    "/images/b9_f0.png",
    "Piętro 1": "/images/b9_f1.png",
    "Piętro 2": "/images/b9_f2.png",
    "Piętro 3": "/images/b9_f3.png",
    "Piętro 4": "/images/b9_f4.png",
  };

  /* 1️⃣ Pobieramy plik GeoJSON raz przy montowaniu */
  useEffect(() => {
    fetch("/data/buildings.geojson")
      .then((res) => res.json())
      .then(setFootprints)
      .catch(console.error);
  }, []);

  /* 2️⃣ Obsługa wyszukiwarki */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value) {
      setSuggestions(
        buildingList
          .map((b) => b.name)
          .filter((n) => n.toLowerCase().includes(value.toLowerCase()))
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (name: string) => {
    setSearchTerm(name);
    setSuggestions([]);
    const b = buildingList.find((x) => x.name === name);
    if (b) {
      setSelectedPos(b.position);
      if (b.name.includes("B9")) setModalOpen(true);
    }
  };

  /* RENDER */
  return (
    <MainLayout>
      <div style={{ display: "flex", gap: "20px" }}>
        <MapFilterPanel />

        <div style={{ flex: 1, position: "relative" }}>
          {/* ----- Searchbox ----- */}
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
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => handleSelect(s)}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ----- MAPA ----- */}
          <MapContainer
            center={DEFAULT_POSITION}
            zoom={17}
            scrollWheelZoom
            className="leaflet-map"
          >
            <TileLayer
              // @ts-ignore
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 3️⃣ Obrysy GeoJSON */}
            {footprints && (
              <GeoJSON
                data={footprints as any}
                style={footprintStyle}
                onEachFeature={(feature: BuildingFeature, layer: L.Layer) => {
                  const vectorLayer = layer as L.Polygon;

                  const { label, description, website } = feature.properties;

                  /* tooltip */
                  layer.bindTooltip(feature.properties.label, {
                    direction: "top",
                    sticky: true,
                  });

                    // podświetlenie
                  vectorLayer.on("mouseover", () =>
                    vectorLayer.setStyle({ fillOpacity: 0.3 })
                  );
                  vectorLayer.on("mouseout", () =>
                    vectorLayer.setStyle({ fillOpacity: 0.15 })
                  );

                  // klik
                  vectorLayer.on("click", () => {
                  const html = `
                    <div style="max-width:250px">
                      <strong>${label}</strong><br/>
                      <p style="margin: 6px 0;">${description || "Brak opisu"}</p>
                      ${website ? `<a href="${website}" target="_blank">Strona instytutu</a>` : ""}
                    </div>
                  `;
                  vectorLayer.bindPopup(html).openPopup();
                });
              }}

              />
            )}

            {/* 5️⃣ Przybliżenie */}
            {selectedPos && <PanTo position={selectedPos} />}
          </MapContainer>
        </div>
      </div>

      {/* ----- Modal z planem pięter dla B9 ----- */}
      <BuildingFloorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        buildingName="Budynek B9 Lodex"
        floorImages={floorPlans}
        defaultFloor="Parter"
      />
    </MainLayout>
  );
};

export default MapPage;
