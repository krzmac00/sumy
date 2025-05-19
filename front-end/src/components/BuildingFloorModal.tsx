import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import './BuildingFloorModal.css';

interface BuildingFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingName: string;
  floorImages: { [key: string]: string }; // np. { "Piętro 1": "/images/b9_f1.png", ... }
  defaultFloor?: string;
}

const floorsOrder = ["Parter", "Piętro 1", "Piętro 2", "Piętro 3", "Piętro 4"];

const lectureRooms = {
  "Piętro 1": [
    { id: "F2", name: "Aula F2", x: 145, y: 120, width: 100, height: 64 },
    { id: "F3", name: "Aula F3", x: 300, y: 120, width: 136, height: 64 },
  ],
  // Dodaj inne piętra w razie potrzeby
};

const BuildingFloorModal: React.FC<BuildingFloorModalProps> = ({
  isOpen,
  onClose,
  buildingName,
  floorImages,
  defaultFloor = "Piętro 1"
}) => {
  const [selectedFloor, setSelectedFloor] = useState(defaultFloor);
  const [selectedRoom, setSelectedRoom] = useState<null | { id: string, name: string }>(null);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="building-floor-modal">
          <Dialog.Title className="building-floor-modal-title">{buildingName}</Dialog.Title>

          {/* Floor Selector Above */}
          <div className="floor-selector-horizontal">
            {floorsOrder.map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`floor-button ${selectedFloor === floor ? 'selected' : ''}`}
              >
                {floor}
              </button>
            ))}
          </div>

          {/* Floor Plan Image */}
          <div className="floor-plan">
            <div className="floor-plan-container">
              <img
                src={floorImages[selectedFloor]}
                alt={`Plan piętra ${selectedFloor}`}
                className="floor-plan-image"
              />

              {/* Overlay clickable rooms */}
              {(lectureRooms[selectedFloor] || []).map(room => (
                <div
                  key={room.id}
                  className="room-overlay"
                  style={{
                    left: room.x,
                    top: room.y,
                    width: room.width,
                    height: room.height,
                  }}
                  title={room.name}
                  onClick={() => setSelectedRoom(room)}
                />
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="close-button">Zamknij</button>
          </div>
        </Dialog.Panel>

        {selectedRoom && (
          <Dialog open={true} onClose={() => setSelectedRoom(null)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="building-floor-modal">
                <Dialog.Title className="building-floor-modal-title">Szczegóły sali</Dialog.Title>
                <p><strong>ID:</strong> {selectedRoom.id}</p>
                <p><strong>Nazwa:</strong> {selectedRoom.name}</p>
                <div className="modal-footer">
                  <button onClick={() => setSelectedRoom(null)} className="close-button">Zamknij</button>
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
