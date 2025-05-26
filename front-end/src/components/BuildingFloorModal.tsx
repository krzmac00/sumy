// src/components/BuildingFloorModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "@headlessui/react";
import "./BuildingFloorModal.css";

// Import SVG przez SVGR
import ParterSvg from "./floors/b9_f0Svg";
import Pietro3Svg from "./floors/b9_f3Svg";
// import { ReactComponent as Pietro1Svg } from "../assets/b9_f1.svg";
// import { ReactComponent as Pietro2Svg } from "../assets/b9_f2.svg";
// import { ReactComponent as Pietro3Svg } from "../assets/b9_f3.svg";
// import { ReactComponent as Pietro4Svg } from "../assets/b9_f4.svg";

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
}

const floorsOrder = ["Parter", "Piętro 1", "Piętro 2", "Piętro 3", "Piętro 4"];

const buildingFloorSvgs: Record<string, Record<string, React.FC<React.SVGProps<SVGSVGElement>>>> = {
  B9: {
    Parter: ParterSvg,
    // "Piętro 1": Pietro1Svg,
    "Piętro 3": Pietro3Svg
  },
  B19: {
    Parter: ctiSvg,
    // kolejne piętra CTI 
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
  const [selectedRoom, setSelectedRoom]   = useState<Room|null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 2. wybieramy mapę svg-ów dla aktualnego budynku (lub {} jeśli nie ma)
  const svgMapForThisBuilding = buildingFloorSvgs[buildingCode] || {};
  const SelectedSvg = svgMapForThisBuilding[selectedFloor];

  // 3. Hook do klików polygonów
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const rooms = Array.from(svgEl.querySelectorAll<SVGElement>("polygon.room[id]"));

    if (highlightedRoomId) {
      const highlighted = svgEl.querySelector<SVGElement>(`polygon.room#${highlightedRoomId}`);
      if (highlighted) {
        highlighted.setAttribute("stroke", "red");
        highlighted.setAttribute("stroke-width", "4");
        highlighted.setAttribute("fill-opacity", "0.6");
      }
    }

    rooms.forEach(el => {
      el.style.cursor = "pointer";
      const onClick = () => {
        setSelectedRoom({
          id: el.id,
          name: el.getAttribute("data-name") || el.id,
        });
      };
      el.addEventListener("click", onClick);
      el.addEventListener("mouseover", () => el.setAttribute("fill-opacity", "0.5"));
      el.addEventListener("mouseout",  () => {
        // Jeśli to nie jest podświetlony, przywróć
        if (el.id !== highlightedRoomId) el.setAttribute("fill-opacity", "0.2");
      });
    });

    // 🧹 Clean up
    return () => {
      rooms.forEach(el => el.replaceWith(el.cloneNode(true)));
    };
  }, [selectedFloor, buildingCode, highlightedRoomId]);


  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="building-floor-modal">
          <Dialog.Title className="building-floor-modal-title">
            {buildingName}
          </Dialog.Title>

          <div className="floor-selector-horizontal">
            {floorsOrder.map(floor => (
              <button
                key={floor}
                className={`floor-button ${selectedFloor===floor?"selected":""}`}
                onClick={() => {
                  setSelectedFloor(floor);
                  setSelectedRoom(null);
                }}
              >
                {floor}
              </button>
            ))}
          </div>

          <div className="floor-plan">
            <div className="floor-plan-container">
              {SelectedSvg
                ? <SelectedSvg ref={svgRef} className="floor-plan-svg" />
                : <p>Brak planu dla tego piętra.</p>
              }
            </div>
          </div>

          <div className="modal-footer">
            <button className="close-button" onClick={onClose}>
              Zamknij
            </button>
          </div>
        </Dialog.Panel>

        {selectedRoom && (
          <Dialog open onClose={() => setSelectedRoom(null)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="building-floor-modal">
                <Dialog.Title className="building-floor-modal-title">
                  Szczegóły sali
                </Dialog.Title>
                <p><strong>ID:</strong> {selectedRoom.id}</p>
                <p><strong>Nazwa:</strong> {selectedRoom.name}</p>
                <div className="modal-footer">
                  <button className="close-button" onClick={() => setSelectedRoom(null)}>
                    Zamknij
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </div>
    </Dialog>
  );
};

export default BuildingFloorModal;