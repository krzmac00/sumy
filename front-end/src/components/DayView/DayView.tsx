import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import './DayView.css';

const DayView: React.FC = () => {
  const { i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const locale = i18n.language === 'pl' ? pl : enUS;

  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getCurrentTimePosition = (): number => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour < 8) return -1;
    if (currentHour >= 20) return -1;
    
    const hoursFromStart = currentHour - 8;
    const minutesFraction = currentMinute / 60;
    
    return (hoursFromStart + minutesFraction) * 60;
  };

  const timePosition = getCurrentTimePosition();

  return (
    <div className="day-view">
      <div className="day-view-header">
        <h2>{format(currentDate, 'EEEE, d MMMM yyyy', { locale })}</h2>
      </div>
      <div className="day-view-timeline">
        {hours.map((hour) => (
          <div key={hour} className="hour-row">
            <div className="hour-label">{formatHour(hour)}</div>
            <div className="hour-content">
              <div className="hour-line" />
            </div>
          </div>
        ))}
        
        {timePosition >= 0 && (
          <div 
            className="current-time-indicator" 
            style={{ top: `${timePosition}px` }}
          >
            <div className="current-time-dot" />
            <div className="current-time-line" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView;