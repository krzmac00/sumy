import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  useMap,
} from "react-leaflet";
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
  { name: "B9 Aula F4", position: [51.747156, 19.453225], buildingCode: "B9", floor: "Parter", roomId: "F4" },
  { name: "B9 Aula F5", position: [51.747140, 19.453094], buildingCode: "B9", floor: "Parter", roomId: "F5" },
  { name: "B9 Aula F6", position: [51.747128, 19.452984], buildingCode: "B9", floor: "Parter", roomId: "F6" },
  { name: "B9 Aula F7", position: [51.747211, 19.453157], buildingCode: "B9", floor: "Piętro 3", roomId: "F7" },
  { name: "B9 Aula F9", position: [51.747126, 19.453178], buildingCode: "B9", floor: "Piętro 3", roomId: "F9" },
  { name: "B9 Aula F10", position: [51.747149, 19.452928], buildingCode: "B9", floor: "Piętro 3", roomId: "F10" },
  { name: "B19 Sala kinowa CTI", position: [51.747007, 19.455864], buildingCode: "B19", floor: "Parter", roomId: "S1" },
  { name: "B14 Aula Major Instytut Fizyki", position: [51.746474, 19.455167], buildingCode: "B14", floor: "Parter", roomId: "A1" },
  { name: "B14 Aula Minor Instytut Fizyki", position: [51.746546, 19.455530], buildingCode: "B14", floor: "Parter", roomId: "A3" },
  { name: "B14 Arena Magica Instytut Fizyki", position: [51.746847, 19.455548], buildingCode: "B14", floor: "Parter", roomId: "A2" },
];

const categoryColors: Record<Category, string> = {
  wydziałowe:       "#8b0002",
  pozawydziałowe:   "#006400",
  ogólnouczelniane: "#00008b",
  administracja:    "#8b008b",
};

const footprintStyle: L.PathOptions = {
  color: "#8b0002",
  weight: 2,
  fillColor: "#8b0002",
  fillOpacity: 0.15,
};

/* marker dla auli */
const markerIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
  <path fill="#8b0002" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
  <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
</svg>
`),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapEffect({
  onMapReady,
}: {
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

const PanTo: React.FC<{ position: LatLngExpression }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 18, { duration: 1 });
  }, [map, position]);
  return null;
};

const buildingCategoryMap: Record<string, string> = {
  B9: "wydziałowe" as const,
  B14: "wydziałowe" as const,
  B19: "wydziałowe" as const,
  B28: "pozawydziałowe" as const,
  B24: "pozawydziałowe" as const,
  B22: "pozawydziałowe" as const,
  C4: "pozawydziałowe" as const,
  C17: "ogólnouczelniane" as const,
  C5: "ogólnouczelniane" as const,
  C11: "ogólnouczelniane" as const,
  C12: "ogólnouczelniane" as const,
  C13: "ogólnouczelniane" as const,
  C14: "ogólnouczelniane" as const,
  C15: "ogólnouczelniane" as const,
  E1: "ogólnouczelniane" as const,
  F1: "ogólnouczelniane" as const,
  B11: "administracja" as const,
} as const;
const allCategories = [
  "wydziałowe",
  "pozawydziałowe",
  "ogólnouczelniane",
  "administracja",
] as const;
type Category = typeof allCategories[number];

const isValidCategory = (cat: string | undefined): cat is Category => {
  return cat !== undefined && allCategories.includes(cat as Category);
};

const buildingDescriptions: Record<string, { pl: string; en: string }> = {
  // wydziałowe
  B9:  {
    pl: "Wydział Fizyki Technicznej, Informatyki i Matematyki Stosowanej",
    en: "Faculty of Technical Physics, Computer Science and Applied Mathematics",
  },
  B14: {
    pl: "Instytut Fizyki",
    en: "Institute of Physics",
  },
  B19: {
    pl: "Centrum Technologii Informatycznych CTI",
    en: "Center for Information Technology (CTI)",
  },

  // pozawydziałowe
  B28: {
    pl: "Zatoka Sportu",
    en: "Sports Bay",
  },
  B24: {
    pl: "Centrum Językowe",
    en: "Language Center",
  },
  B22: {
    pl: "Biblioteka Główna",
    en: "Main Library",
  },
  C4: {
    pl: "Centrum Sportu",
    en: "Sports Center",
  },

  // ogólnouczelniane – domy studenckie + SDS
  C17: {
    pl: "VI Dom Studencki",
    en: "Student Dormitory VI",
  },
  C5: {
    pl: "VII Dom Studencki",
    en: "Student Dormitory VII",
  },
  C11: {
    pl: "IV Dom Studencki",
    en: "Student Dormitory IV",
  },
  C12: {
    pl: "III Dom Studencki",
    en: "Student Dormitory III",
  },
  C13: {
    pl: "II Dom Studencki",
    en: "Student Dormitory II",
  },
  C14: {
    pl: "I Dom Studencki",
    en: "Student Dormitory I",
  },
  C15: {
    pl: "SDS",
    en: "Student Development Center",
  },
  E1: {
    pl: "IX Dom Studencki",
    en: "Student Dormitory IX",
  },
  F1: {
    pl: "V Dom Studencki",
    en: "Student Dormitory V",
  },

  // administracja
  B11: {
    pl: "Dziekanat WFTiMS",
    en: "Dean’s Office of FT-CS-AM",
  },
};


const DEFAULT_POSITION: LatLngExpression = [51.746032, 19.453547];

const MapPage: React.FC = () => {
  const [footprints, setFootprints] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [activeCategories, setActiveCategories] = useState<Category[]>(
    [...allCategories]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedPos, setSelectedPos] =
    useState<LatLngExpression | null>(null);
  const [selectedBuilding, setSelectedBuilding] =
    useState<BuildingFeature | null>(null);
  const [layersMap, setLayersMap] = useState<Record<string, L.Polygon>>({});
  const [markerPosition, setMarkerPosition] =
    useState<LatLngExpression | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (highlightedIndex < 0) return;
    const listEl = suggestionsRef.current;
    if (!listEl) return;

    const item = listEl.children[highlightedIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    fetch("/data/buildings.geojson")
      .then((res) => res.json())
      .then(setFootprints)
      .catch(console.error);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleCategory = (cat: Category) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchTerm(v);
    setSuggestions(
      v
        ? buildingList
            .map((b) => b.name)
            .filter((n) => n.toLowerCase().includes(v.toLowerCase()))
        : []
    );
    setHighlightedIndex(-1);
  };

  const handleSelect = (name: string) => {
    setSuggestions([]);
    const item = buildingList.find((b) => b.name === name);
    if (!item) return;

    setSelectedPos(item.position);

    if (item.buildingCode && item.floor && item.roomId) {
      setMarkerPosition(item.position);
      setSelectedBuilding({
        properties: {
          name: item.buildingCode,
          label: name,
        },
        roomId: item.roomId,
        defaultFloor: item.floor,
      } as any);
    } else if (mapInstance) {
      setMarkerPosition(null);
      const layer = layersMap[name];
      if (!layer) return;

      const feature = layer.feature as BuildingFeature;
      const { label, website, hasPlan, name: code } = feature.properties;
      const { t, i18n } = useTranslation();

      const description =
        buildingDescriptions[code]?.[i18n.language as "pl" | "en"]
        ?? feature.properties.description
        ?? "";

      const btnId = `plan-btn-${code}`;
      const html = `
        <div style="max-width:240px">
          <strong>${label}</strong><br/>
          <p style="margin:6px 0">${description}</p>
          ${website ? `<a href="${website}" target="_blank">${t("map.popup.goToWebsite")}</a><br/>` : ""}
          ${hasPlan ? `<button id="${btnId}" class="map-popup-button">${t("map.popup.buildingPlan")}</button>` : ""}
        </div>
      `;

      layer.once("popupopen", () => {
        setTimeout(() => {
          const btn = document.getElementById(btnId);
          if (btn) btn.onclick = () => setSelectedBuilding(feature);
        }, 50);
      });
      layer.bindPopup(html).openPopup();

      const bounds = (layer as L.Polygon).getBounds();
      mapInstance.flyTo(bounds.getCenter(), 18, { duration: 1 });
    }

    setSearchTerm("");
  };

  const handleCloseModal = () => {
    setSelectedBuilding(null);
    setMarkerPosition(null);
  };

  return (
    <MainLayout>
      <div className="map-page-wrapper">
        <MapFilterPanel
          activeCategories={activeCategories}
          toggleCategory={toggleCategory}
        />

        <div className="map-container-wrapper">
          <div className="search-container" ref={searchRef}>
            <input
              className="search-input"
              placeholder={t("map.search.placeholder")}
              value={searchTerm}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex(prev =>
                    suggestions.length === 0
                      ? -1
                      : prev < suggestions.length - 1
                        ? prev + 1
                        : 0
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex(prev =>
                    suggestions.length === 0
                      ? -1
                      : prev > 0
                        ? prev - 1
                        : suggestions.length - 1
                  );
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const idx = highlightedIndex;
                  if (idx >= 0) {
                    handleSelect(suggestions[idx]);
                  } else if (suggestions.length === 1) {
                    handleSelect(suggestions[0]);
                  }
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    setSuggestions([]);
                    setHighlightedIndex(-1);
                }
              }}
            />
            {suggestions.length > 0 && (
              <ul className="suggestions-list" ref={suggestionsRef}>
                {suggestions.map((s, i) => (
                  <li
                      key={i}
                      className={i === highlightedIndex ? "highlighted" : ""}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      onMouseLeave={() => setHighlightedIndex(-1)}
                      onClick={() => handleSelect(s)}
                    >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <MapContainer
            className="leaflet-map"
            center={DEFAULT_POSITION}
            zoom={17}
            scrollWheelZoom
          >
            <MapEffect onMapReady={(m) => setMapInstance(m)} />

            <TileLayer
              // @ts-ignore
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {footprints && (
              <GeoJSON
                key={`${i18n.resolvedLanguage}|${activeCategories.join("|")}`}
                data={footprints as any}
                style={(feature: any) => {
                  const code = feature.properties.name as string;
                  const cat  = buildingCategoryMap[code] as Category|undefined;
                  const fill = cat ? categoryColors[cat] : footprintStyle.fillColor;
                  return {
                    ...footprintStyle,
                    fillColor: fill,
                    color:     fill,
                  };
                }}
                filter={(feature: any) => {
                  const code = feature.properties.name as string;
                  const cat = buildingCategoryMap[code];
                  return isValidCategory(cat) && activeCategories.includes(cat);
                }}
                onEachFeature={(feature: BuildingFeature, layer: L.Layer) => {
                  const poly = layer as L.Polygon;
                  const { label, description, website, hasPlan, name } =
                    feature.properties;

                  poly.bindTooltip(label, {
                    direction: "top",
                    sticky: true,
                  });
                  poly.on("mouseover", () =>
                    poly.setStyle({ fillOpacity: 0.3 })
                  );
                  poly.on("mouseout", () =>
                    poly.setStyle({ fillOpacity: 0.15 })
                  );

                  setLayersMap((prev) => ({ ...prev, [label]: poly }));

                  poly.on("click", () => {
                    const ctr = poly.getBounds().getCenter();
                    setSelectedPos([ctr.lat, ctr.lng]);

                    const btnId = `plan-btn-${name}`;
                    const html = `
                      <div style="max-width:240px">
                        <strong>${label}</strong><br/>
                        <p style="margin:6px 0">${description ?? ""}</p>
                        ${website ? `<a href="${website}" target="_blank">${t("map.popup.goToWebsite")}</a><br/>` : ""}
                        ${hasPlan ? `<button id="${btnId}" class="map-popup-button">${t("map.popup.buildingPlan")}</button>` : ""}
                      </div>
                    `;
                    poly.once("popupopen", () => {
                      setTimeout(() => {
                        const btn = document.getElementById(btnId);
                        if (btn) btn.onclick = () =>
                          setSelectedBuilding(feature);
                      }, 50);
                    });
                    poly.bindPopup(html).openPopup();
                  });
                }}
              />
            )}

            {markerPosition && (
              <Marker position={markerPosition} icon={markerIcon} />
            )}
            {selectedPos && <PanTo position={selectedPos} />}
          </MapContainer>
        </div>
      </div>

      {selectedBuilding && (
        <BuildingFloorModal
          isOpen
          onClose={handleCloseModal}
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