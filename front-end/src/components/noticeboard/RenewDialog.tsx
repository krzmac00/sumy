import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Calendar, Info } from 'lucide-react';
import './RenewDialog.css';

interface RenewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (days: number) => void;
  currentExpiration: string;
  isRenewing?: boolean;
}

const RenewDialog: React.FC<RenewDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentExpiration,
  isRenewing = false 
}) => {
  const { t } = useTranslation();
  const [renewDays, setRenewDays] = useState(30);
  const [selectedOption, setSelectedOption] = useState<'preset' | 'custom'>('preset');

  if (!isOpen) return null;

  const presetOptions = [
    { days: 7, label: t('noticeboard.renew.oneWeek', '1 week') },
    { days: 14, label: t('noticeboard.renew.twoWeeks', '2 weeks') },
    { days: 30, label: t('noticeboard.renew.oneMonth', '1 month') },
    { days: 60, label: t('noticeboard.renew.twoMonths', '2 months') },
    { days: 90, label: t('noticeboard.renew.threeMonths', '3 months') }
  ];

  const calculateNewExpiration = () => {
    const current = new Date(currentExpiration);
    const newDate = new Date(current);
    newDate.setDate(newDate.getDate() + renewDays);
    return newDate;
  };

  const handlePresetClick = (days: number) => {
    setRenewDays(days);
    setSelectedOption('preset');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 90) {
      setRenewDays(value);
      setSelectedOption('custom');
    }
  };

  const handleConfirm = () => {
    onConfirm(renewDays);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="renew-dialog-enhanced">
        <div className="renew-dialog-header">
          <RefreshCw className="header-icon" size={24} />
          <h3>{t('noticeboard.renewAdvertisement')}</h3>
        </div>

        <div className="renew-dialog-body">
          <div className="current-expiration">
            <Calendar size={16} />
            <span>{t('noticeboard.currentExpiration')}: </span>
            <strong>{new Date(currentExpiration).toLocaleDateString('pl-PL')}</strong>
          </div>

          <div className="renew-options">
            <h4>{t('noticeboard.selectRenewalPeriod')}</h4>
            
            <div className="preset-options">
              {presetOptions.map(option => (
                <button
                  key={option.days}
                  className={`preset-button ${renewDays === option.days && selectedOption === 'preset' ? 'selected' : ''}`}
                  onClick={() => handlePresetClick(option.days)}
                  disabled={isRenewing}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="custom-option">
              <label>{t('noticeboard.customDays')}:</label>
              <input
                type="number"
                min="1"
                max="90"
                value={renewDays}
                onChange={handleCustomChange}
                onFocus={() => setSelectedOption('custom')}
                disabled={isRenewing}
                className={selectedOption === 'custom' ? 'selected' : ''}
              />
              <span className="days-label">{t('noticeboard.days')}</span>
            </div>
          </div>

          <div className="new-expiration">
            <Info size={16} />
            <span>{t('noticeboard.newExpiration')}: </span>
            <strong className="new-date">
              {calculateNewExpiration().toLocaleDateString('pl-PL')}
            </strong>
          </div>
        </div>

        <div className="dialog-actions">
          <button 
            className="cancel-button-advertisment" 
            onClick={onClose}
            disabled={isRenewing}
          >
            {t('common.cancel')}
          </button>
          <button 
            className="confirm-button renew-confirm" 
            onClick={handleConfirm}
            disabled={isRenewing}
          >
            {isRenewing ? (
              <>
                <RefreshCw className="spinning" size={16} />
                {t('noticeboard.renewing')}
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                {t('noticeboard.renewFor')} {renewDays} {t('noticeboard.days')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenewDialog;