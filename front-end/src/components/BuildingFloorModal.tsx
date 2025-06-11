import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./BuildingFloorModal.css";

import ParterSvg from "./floors/b9_f0Svg";
import Pietro1Svg from "./floors/b9_f1Svg";
import Pietro2Svg from "./floors/b9_f2Svg";
import Pietro3Svg from "./floors/b9_f3Svg";
import Pietro4Svg from "./floors/b9_f4Svg";

import ctiSvg from "./floors/ctiSvg";
import iFizykiSvg from "./floors/iFizykiSvg";

interface BuildingFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingCode: string;
  buildingName: string;
  defaultFloor?: string;
  highlightedRoomId?: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
  floor: string;
}

const floorsOrder = ["Parter", "Piętro 1", "Piętro 2", "Piętro 3", "Piętro 4"];

const buildingFloorSvgs: Record<string, Record<string, React.FC<React.SVGProps<SVGSVGElement>>>> = {
  B9: {
    Parter: ParterSvg,
    "Piętro 1": Pietro1Svg,
    "Piętro 2": Pietro2Svg,
    "Piętro 3": Pietro3Svg,
    "Piętro 4": Pietro4Svg
  },
  B19: {
    Parter: ctiSvg,
  },
  B14: {
    Parter: iFizykiSvg,
  }
};

const BuildingFloorModal: React.FC<BuildingFloorModalProps> = ({
  isOpen,
  onClose,
  buildingCode,
  buildingName,
  defaultFloor = "Parter",
  highlightedRoomId,
}) => {
  const [selectedFloor, setSelectedFloor] = useState(defaultFloor);
  const [selectedRoom, setSelectedRoom] = useState<Room|null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { t } = useTranslation();

  // Resetuj wybrany pokój gdy modal się otwiera
  useEffect(() => {
    if (isOpen) {
      setSelectedFloor(defaultFloor);
      setSelectedRoom(null);
    }
  }, [isOpen, defaultFloor]);

  // Wybieramy mapę svg-ów dla aktualnego budynku
  const svgMapForThisBuilding = buildingFloorSvgs[buildingCode] || {};
  const SelectedSvg = svgMapForThisBuilding[selectedFloor];

  // Dostępne piętra dla danego budynku
  const availableFloors = floorsOrder.filter(floor => svgMapForThisBuilding[floor]);

  // Hook do obsługi klików na polygony
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const rooms = Array.from(svgEl.querySelectorAll<SVGElement>("polygon.room[id]"));

    // Podświetl wybrany pokój z animacją
    if (highlightedRoomId) {
      const highlighted = svgEl.querySelector<SVGElement>(`polygon.room#${highlightedRoomId}`);
      if (highlighted) {
        // Dodaj klasę CSS dla animacji pulsacji
        highlighted.classList.add("room-highlight-animation");
        
        // Po animacji zostaw trwałe podświetlenie
        setTimeout(() => {
          highlighted.classList.remove("room-highlight-animation");
          highlighted.classList.add("room-highlighted");
          highlighted.setAttribute("stroke", "#8b0002");
          highlighted.setAttribute("stroke-width", "3");
          highlighted.setAttribute("fill", "#8b0002");
          highlighted.setAttribute("fill-opacity", "0.4");
        }, 2000); // 2 sekundy animacji
      }
    }

    rooms.forEach(el => {
      el.style.cursor = "pointer";
      
      const onClick = () => {
        setSelectedRoom({
          id: el.id,
          name: el.getAttribute("data-name") || el.id,
          type: el.getAttribute("data-type") || "Pokój",
          floor: selectedFloor, 
        });
      };
      
      const onMouseOver = () => {
        if (el.id !== highlightedRoomId && !el.classList.contains("room-highlighted")) {
          el.setAttribute("fill-opacity", "0.5");
        }
      };
      
      const onMouseOut = () => {
        if (el.id !== highlightedRoomId && !el.classList.contains("room-highlighted")) {
          el.setAttribute("fill-opacity", "0.2");
        }
      };

      el.addEventListener("click", onClick);
      el.addEventListener("mouseover", onMouseOver);
      el.addEventListener("mouseout", onMouseOut);
    });

    // Cleanup
    return () => {
      rooms.forEach(el => {
        const newEl = el.cloneNode(true) as SVGElement;
        el.parentNode?.replaceChild(newEl, el);
      });
    };
  }, [selectedFloor, buildingCode, highlightedRoomId]);

  // Obsługa klawisza Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedRoom) {
          setSelectedRoom(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, selectedRoom, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Główny modal z planem budynku - bez onClick na overlay */}
      <div className="modal-overlay modal-overlay-right">
        <div className="building-floor-modal building-floor-modal-right" onClick={(e) => e.stopPropagation()}>
          <div className="building-floor-modal-title">
            {buildingName}
          </div>

          {availableFloors.length > 1 && (
            <div className="floor-selector-horizontal">
              {availableFloors.map(floor => (
                <button
                  key={floor}
                  className={`floor-button ${selectedFloor === floor ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedFloor(floor);
                    setSelectedRoom(null);
                  }}
                >
                  {t(`floor.${floor}`)}
                </button>
              ))}
            </div>
          )}

          <div className="floor-plan">
            <div className={`floor-plan-container ${buildingCode === "B9" ? "b9-small" : ""}`}>
              {SelectedSvg ? (
                <SelectedSvg ref={svgRef} className="floor-plan-svg" />
              ) : (
                <p style={{ padding: "40px", color: "#666", textAlign: "center" }}>
                  Brak planu dla tego piętra.
                </p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="close-button" onClick={onClose}>
              {t("modal.close")}
            </button>
          </div>
        </div>
      </div>

      {/* Modal szczegółów pokoju */}
      {selectedRoom && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="room-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="building-floor-modal-title">
              {t("modal.details.title")}
            </div>
            <div style={{ marginBottom: "1rem" }}>
            <p><strong>{t("modal.details.name")}</strong> {selectedRoom.name}</p>
            <p><strong>{t("modal.details.type")}</strong> {selectedRoom.type}</p>
            <p><strong>{t("modal.details.floor")}</strong> {selectedRoom.floor}</p>
            </div>
            <div className="modal-footer">
              <button className="close-button" onClick={() => setSelectedRoom(null)}>
                {t("modal.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BuildingFloorModal;