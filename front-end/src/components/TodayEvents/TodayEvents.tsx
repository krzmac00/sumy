import React, { useEffect, useState } from 'react';
import { CustomCalendarEvent } from '@/types/event';
import { eventAPI, scheduleAPI } from '@/services/api';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { CategoryKey } from '@/enums/CategoryKey';
import './TodayEvents.css';

interface TodayEventsProps {
  scheduleId?: number | null;
}

const TodayEvents: React.FC<TodayEventsProps> = ({ scheduleId }) => {
  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedEvents, setCompletedEvents] = useState<Set<string | number>>(new Set());
  const { i18n, t } = useTranslation();
  const locale = i18n.language === 'pl' ? pl : enUS;

  // Load completed events from localStorage on mount
  useEffect(() => {
    const storedCompleted = localStorage.getItem('completedTodayEvents');
    if (storedCompleted) {
      try {
        const parsed = JSON.parse(storedCompleted);
        const today = format(new Date(), 'yyyy-MM-dd');
        if (parsed.date === today && Array.isArray(parsed.events)) {
          setCompletedEvents(new Set(parsed.events));
        }
      } catch (error) {
        console.error('Failed to load completed events:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchTodayEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  const fetchTodayEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const today = new Date();
      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);
      
      // Fetch both user events and schedule events
      const [userEventsResponse, scheduleEventsResponse] = await Promise.all([
        eventAPI.getAll(),
        scheduleId ? scheduleAPI.getEvents(scheduleId) : Promise.resolve({ results: [] })
      ]);
      
      // Combine events - eventAPI.getAll() returns array directly, not { results: [...] }
      const allEvents = [
        ...(Array.isArray(userEventsResponse) ? userEventsResponse : []),
        ...(scheduleEventsResponse.results || [])
      ];
      
      // Filter for today's events
      const todayEvents = allEvents.filter(event => {
        const eventStart = typeof event.start === 'string' ? parseISO(event.start) : event.start;
        const eventEnd = typeof event.end === 'string' ? parseISO(event.end) : event.end;
        
        return isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
               isWithinInterval(eventEnd, { start: dayStart, end: dayEnd });
      });
      
      // Sort by start time
      todayEvents.sort((a, b) => {
        const startA = typeof a.start === 'string' ? parseISO(a.start) : a.start;
        const startB = typeof b.start === 'string' ? parseISO(b.start) : b.start;
        return startA.getTime() - startB.getTime();
      });
      
      setEvents(todayEvents);
    } catch (err) {
      console.error('Failed to fetch today\'s events:', err);
      setError(t('todayEvents.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
  };

  const getCategoryLabel = (category: CategoryKey) => {
    return t(`calendar.category.${category}`, category);
  };

  const toggleEventCompletion = (eventId: string | number) => {
    setCompletedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      
      // Save to localStorage
      const today = format(new Date(), 'yyyy-MM-dd');
      localStorage.setItem('completedTodayEvents', JSON.stringify({
        date: today,
        events: Array.from(newSet)
      }));
      
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="today-events-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="today-events-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="today-events-container">
      <div className="today-header">
        <h2>{format(new Date(), 'EEEE, d MMMM', { locale })}</h2>
        <span className="event-count">
          {t('todayEvents.eventCount', { count: events.length })}
        </span>
      </div>
      
      {events.length === 0 ? (
        <div className="no-events">
          <p>{t('todayEvents.noEvents')}</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map((event) => {
            const isCompleted = completedEvents.has(event.id);
            
            return (
              <div 
                key={event.id} 
                className={`event-item ${isCompleted ? 'completed' : ''}`}
                style={{ borderLeftColor: event.color }}
              >
                <div className="event-checkbox">
                  <input
                    type="checkbox"
                    id={`event-${event.id}`}
                    checked={isCompleted}
                    onChange={() => toggleEventCompletion(event.id)}
                    aria-label={t('todayEvents.markAsDone', 'Mark as done')}
                  />
                </div>
                
                <div className="event-time">
                  <span className="start-time">{formatTime(event.start)}</span>
                  <span className="time-separator">-</span>
                  <span className="end-time">{formatTime(event.end)}</span>
                </div>
                
                <div className="event-details">
                  <h3 className="event-title">{event.title}</h3>
                  
                  <div className="event-meta">
                    <span className="event-category">
                      {getCategoryLabel(event.category)}
                    </span>
                    
                    {event.room && (
                      <span className="event-room">
                        <i className="icon-location"></i> {event.room}
                      </span>
                    )}
                    
                    {event.teacher && (
                      <span className="event-teacher">
                        <i className="icon-person"></i> {event.teacher}
                      </span>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodayEvents;