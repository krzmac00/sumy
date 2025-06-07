import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import MainLayout from "../layouts/MainLayout";
import MapFilterPanel from "../components/MapFilterPanel";
import BuildingFloorModal from "../components/BuildingFloorModal";
import type { BuildingFeature } from "../types/BuildingFeature";
import "./MapPage.css";

/* ---------- Budynki do wyszukiwarki ---------- */
const buildingList: { name: string; position: LatLngExpression; buildingCode?: string; floor?: string; roomId?: string }[] = [
  { name: "B9 Lodex", position: [51.747192, 19.453947] },
  { name: "B14 Instytut Fizyki", position: [51.746575, 19.455451] },
  { name: "B19 Centrum Technologii Informatycznych CTI", position: [51.746992, 19.455847] },
  { name: "B24 Centrum językowe CJ", position: [51.7455, 19.452] },
  { name: "B11 Dziekanat WFTIMS", position: [51.74738674592893, 19.45601321037561] },
  { name: "B28 Zatoka Sportu", position: [51.746391, 19.451582] },
  { name: "B22 Biblioteka Główna", position: [51.745585, 19.454121] },
  { name: "C4 Centrum Sportu", position: [51.745460, 19.449326] },
  { name: "C17 VI Dom Studencki", position: [51.745653, 19.449830] },
  { name: "C5 VII Dom Studencki", position: [51.74613357537689, 19.450050014589447] },
  { name: "C11 IV Dom Studencki", position: [51.74668385901008, 19.45013716680703] },
  { name: "C12 III Dom Studencki", position: [51.747499375006775, 19.450123634046818] },
  { name: "C13 II Dom Studencki", position: [51.748209992302506, 19.44980180660171] },
  { name: "C14 I Dom Studencki", position: [51.748721070688966, 19.449567238768278] },
  { name: "C15 SDS", position: [51.749120433928596, 19.449427400249085] },
  { name: "E1 IX Dom Studencki", position: [51.74695479499577, 19.45977903555612] },
  { name: "F1 V Dom Studencki", position: [51.7789650157646, 19.494415789858092] },
  { name: "B9 Aula F2", position: [51.747263, 19.453623], buildingCode: "B9", floor: "Parter", roomId: "F2" },
  { name: "B9 Aula F3", position: [51.747229, 19.453357], buildingCode: "B9", floor: "Parter", roomId: "F3" },
  { name: "B9 Aula F7", position: [51.747211, 19.453157], buildingCode: "B9", floor: "Piętro 3", roomId: "F7" },
  { name: "B9 Aula F9", position: [51.747126, 19.453178], buildingCode: "B9", floor: "Piętro 3", roomId: "F9" },
  { name: "B9 Aula F10", position: [51.747149, 19.452928], buildingCode: "B9", floor: "Piętro 3", roomId: "F10" },
  { name: "B19 Sala kinowa CTI", position: [51.747007, 19.455864], buildingCode: "B19", floor: "Parter", roomId: "Sala kinowa" },
  { name: "B14 Aula Major Instytut Fizyki", position: [51.746474, 19.455167], buildingCode: "B14", floor: "Parter", roomId: "Aula major" },
];

const DEFAULT_POSITION: LatLngExpression = [51.746032, 19.453547];

const footprintStyle: L.PathOptions = {
  color: "#8b0002",
  weight: 2,
  fillColor: "#8b0002",
  fillOpacity: 0.15,
};

/* ---------- Przybliżenie na budynek ---------- */
const PanTo: React.FC<{ position: LatLngExpression }> = ({ position }) => {
  const map = useMap();
  map.flyTo(position, 18, { duration: 1 });
  return null;
};

/* ---------- Komponent główny ---------- */
const MapPage: React.FC = () => {
  const [footprints, setFootprints] = useState<GeoJSON.FeatureCollection | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedPos, setSelectedPos] = useState<LatLngExpression | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingFeature | null>(null);
  const [layersMap, setLayersMap] = useState<Record<string, L.Polygon>>({});

  useEffect(() => {
    fetch("/data/buildings.geojson")
      .then((res) => res.json())
      .then(setFootprints)
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSuggestions(
      value
        ? buildingList
            .map((b) => b.name)
            .filter((n) => n.toLowerCase().includes(value.toLowerCase()))
        : []
    );
  };

  const handleSelect = (name: string) => {
  setSuggestions([]);
  const item = buildingList.find((b) => b.name === name);

  if (item) {
    setSelectedPos(item.position);

    if (item.buildingCode && item.floor && item.roomId) {
      setSelectedBuilding({
        properties: {
          name: item.buildingCode,
          label: name,
        },
        roomId: item.roomId,
        defaultFloor: item.floor,
      } as any);
    }

    const layer = layersMap[name];
    if (layer) {
      const map = layer._map;
      if (map) {
        const feature = layer.feature as BuildingFeature;
        const { label, description, website, hasPlan, name: code } = feature.properties;

        const btnId = `plan-btn-${code}`;
        const html = `
          <div style="max-width:240px">
            <strong>${label}</strong><br/>
            <p style="margin:6px 0">${description ?? ""}</p>
            ${website ? `<a href="${website}" target="_blank">Przejdź do strony</a><br/>` : ""}
            ${hasPlan ? `<button id="${btnId}" class="map-popup-button">Plan budynku</button>` : ""}
          </div>
        `;

        layer.once("popupopen", () => {
          setTimeout(() => {
            const btn = document.getElementById(btnId);
            if (btn) btn.onclick = () => setSelectedBuilding(feature);
          }, 50);
        });

        layer.bindPopup(html).openPopup();
      }
    }
  }

  // ✨ Ostatecznie wyczyść pole wyszukiwarki
  setSearchTerm("");
};

  return (
    <MainLayout>
      <div style={{ display: "flex", gap: 20 }}>
        <MapFilterPanel />

        <div style={{ flex: 1, position: "relative" }}>
          <div className="search-container">
            <input
              className="search-input"
              placeholder="Szukaj budynku…"
              value={searchTerm}
              onChange={handleChange}
            />
            {!!suggestions.length && (
              <ul className="suggestions-list">
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => handleSelect(s)}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <MapContainer className="leaflet-map" center={DEFAULT_POSITION} zoom={17} scrollWheelZoom>
            <TileLayer
              //@ts-ignore
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {footprints && (
              <GeoJSON
                data={footprints as any}
                style={footprintStyle}
                onEachFeature={(feature: BuildingFeature, layer: L.Layer) => {
                  const poly = layer as L.Polygon;
                  const { label, description, website, hasPlan, name } = feature.properties;

                  poly.bindTooltip(label, { direction: "top", sticky: true });
                  poly.on("mouseover", () => poly.setStyle({ fillOpacity: 0.3 }));
                  poly.on("mouseout", () => poly.setStyle({ fillOpacity: 0.15 }));

                  setLayersMap((prev) => ({ ...prev, [label]: poly }));

                  poly.on("click", () => {
                    const center = poly.getBounds().getCenter();
                    setSelectedPos([center.lat, center.lng]);

                    const btnId = `plan-btn-${name}`;
                    const html = `
                      <div style="max-width:240px">
                        <strong>${label}</strong><br/>
                        <p style="margin:6px 0">${description ?? ""}</p>
                        ${website ? `<a href="${website}" target="_blank">Przejdź do strony</a><br/>` : ""}
                        ${hasPlan ? `<button id="${btnId}" class="map-popup-button">Plan budynku</button>` : ""}
                      </div>
                    `;

                    poly.once("popupopen", () => {
                      setTimeout(() => {
                        const btn = document.getElementById(btnId);
                        if (btn) btn.onclick = () => setSelectedBuilding(feature);
                      }, 50);
                    });

                    poly.bindPopup(html).openPopup();
                  });
                }}
              />
            )}

            {selectedPos && <PanTo position={selectedPos} />}
          </MapContainer>
        </div>
      </div>

      {selectedBuilding && (
        <BuildingFloorModal
          isOpen
          onClose={() => setSelectedBuilding(null)}
          buildingCode={selectedBuilding.properties.name}
          buildingName={selectedBuilding.properties.label}
          defaultFloor={(selectedBuilding as any).defaultFloor ?? "Parter"}
          highlightedRoomId={(selectedBuilding as any).roomId}
        />
      )}
    </MainLayout>
  );
};

export default MapPage;
