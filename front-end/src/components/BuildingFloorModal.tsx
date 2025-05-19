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

const BuildingFloorModal: React.FC<BuildingFloorModalProps> = ({
  isOpen,
  onClose,
  buildingName,
  floorImages,
  defaultFloor = "Piętro 1"
}) => {
  const [selectedFloor, setSelectedFloor] = useState(defaultFloor);

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
            <img
              src={floorImages[selectedFloor]}
              alt={`Plan piętra ${selectedFloor}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="close-button">Zamknij</button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>

  );
};

export default BuildingFloorModal;
