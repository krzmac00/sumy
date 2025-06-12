import { useState, useEffect } from "react";
import {
  Calendar as BigCalendar,
  Views,
  dateFnsLocalizer,
  View,
  ToolbarProps,
  EventProps,
  Event as CalendarEvent,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { parse, startOfWeek, format, getDay } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { pl } from "date-fns/locale/pl";
import { useTranslation } from "react-i18next";

import { CategoryKey } from "@/enums/CategoryKey";
import { RepeatType } from "@/enums/RepeatType";
import { CustomCalendarEvent } from "@/types/event";
import { SchedulePlan } from "@/types/SchedulePlan";
import { scheduleAPI } from "@/services/api";

import "./Calendar.css";
import TimetableModal from "./TimetableModal";
import TimetableCreator from "./TimetableCreator";
import TimetableSelector from "./TimetableSelector";

const DragAndDropCalendar = withDragAndDrop(BigCalendar as any);

export const Timetable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locales = { en: enGB, pl };
  const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
  const culture = i18n.language.substring(0, 2);

  const timetableCategories = Object.values(CategoryKey).slice(0, 3) as CategoryKey[];
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(timetableCategories);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());

  const [schedules, setSchedules] = useState<SchedulePlan[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<SchedulePlan | null>(null);
  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);
  const [localScheduleEvents, setLocalScheduleEvents] = useState<CustomCalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    scheduleAPI.getAll().then(setSchedules).catch(console.error);
  }, []);

  const refreshEvents = () => {
    if (!selectedSchedule) { 
      return;
    }

    scheduleAPI.getEvents(selectedSchedule.id).then((fetchedEvents: any[]) => {
      const baseEvents: CustomCalendarEvent[] = fetchedEvents.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));

      const endOfView = new Date(date);
      endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));

      const expanded = baseEvents.flatMap((e) => [e, ...expandEvent(e, endOfView)]);
      setEvents(expanded);
    });
  };

  useEffect(() => {
    if (selectedSchedule) {
      refreshEvents();
    }
  }, [date, view, selectedSchedule]);

  const expandEvent = (event: CustomCalendarEvent, endOfView: Date): CustomCalendarEvent[] => {
    const events: CustomCalendarEvent[] = [];
    const duration = event.end.getTime() - event.start.getTime();

    if (event.repeatType === RepeatType.Weekly) {
      let current = new Date(event.start);
      while (true) {
        current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (current > endOfView) break;
        events.push({
          ...event,
          id: `${event.id}-weekly-${current.toISOString()}`,
          start: new Date(current),
          end: new Date(current.getTime() + duration),
        });
      }
    }

    if (event.repeatType === RepeatType.Monthly) {
      const baseStart = new Date(event.start);
      const dayOfWeek = baseStart.getDay();
      const nth = Math.floor((baseStart.getDate() - 1) / 7) + 1;

      let current = new Date(baseStart);
      while (true) {
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);

        let weekdayCount = 0;
        while (current.getMonth() === baseStart.getMonth()) {
          if (current.getDay() === dayOfWeek) {
            weekdayCount++;
            if (weekdayCount === nth) {
              break;
            }
          }
          current.setDate(current.getDate() + 1);
        }

        if (current > endOfView) {
          break;
        }

        events.push({
          ...event,
          id: `${event.id}-monthly-${current.toISOString()}`,
          start: new Date(current),
          end: new Date(current.getTime() + duration),
        });
      }
    }

    return events;
  };

  const handleModalSave = async (data: Omit<CustomCalendarEvent, "id">) => {
    const newEvent: CustomCalendarEvent = {
      ...data,
      id: Date.now(),
    };

    const endOfView = new Date(date);
    endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));
    const expanded = [newEvent, ...expandEvent(newEvent, endOfView)];

    if (!selectedSchedule) {
      setLocalScheduleEvents((prev) => [...prev, ...expanded]);
    } else {
      try {
        await scheduleAPI.addEvent(selectedSchedule.id, newEvent);
        setEvents((prev) => [...prev, ...expanded]);
      } catch (err) {
        console.error("Failed to add event:", err);
      }
    }

    setPendingSlot(null);
    setModalOpen(false);
  };

  const toggleCategory = (cat: CategoryKey) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const s = new Date(start);
    s.setHours(8, 0, 0, 0);
    const e = new Date(s);
    e.setHours(9, 0, 0, 0);
    setPendingSlot({ start: s, end: e });
    setModalOpen(true);
  };

  const handleEventDrop = ({ event, start }: any) => {
    const ev = event as CustomCalendarEvent;
    const duration = ev.end.getTime() - ev.start.getTime();
    const updated = { ...ev, start: new Date(start), end: new Date(start.getTime() + duration) };

    const endOfView = new Date(date);
    endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));

    const updateEvents = (prev: CustomCalendarEvent[]) => {
      const idStr = ev.id.toString().split("-")[0];
      return [...prev.filter((e) => !e.id.toString().startsWith(idStr)), updated, ...expandEvent(updated, endOfView)];
    };

    if (!selectedSchedule) {
      setLocalScheduleEvents((prev) => updateEvents(prev));
    } else {
      scheduleAPI.updateEvent(selectedSchedule.id, updated).then(() => {
        setEvents((prev) => updateEvents(prev));
      });
    }
  };

  const handleEventResize = ({ event, start, end }: any) => {
    const ev = event as CustomCalendarEvent;
    const updated = { ...ev, start: new Date(start), end: new Date(end) };

    const endOfView = new Date(date);
    endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));

    const updateEvents = (prev: CustomCalendarEvent[]) => {
      const idStr = ev.id.toString().split("-")[0];
      return [...prev.filter((e) => !e.id.toString().startsWith(idStr)), updated, ...expandEvent(updated, endOfView)];
    };

    if (!selectedSchedule) {
      setLocalScheduleEvents((prev) => updateEvents(prev));
    } else {
      setEvents((prev) => updateEvents(prev));
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const ev = event as CustomCalendarEvent;
    const baseId = ev.id.toString().split("-")[0];
    if (!window.confirm(t("calendar.deleteClass", { title: ev.title }))) {
      return
    };

    const removeEvents = (prev: CustomCalendarEvent[]) =>
      prev.filter((e) => !e.id.toString().startsWith(baseId));

    if (!selectedSchedule) {
      setLocalScheduleEvents((prev) => removeEvents(prev));
    } else {
      setEvents((prev) => removeEvents(prev));
    }
  };

  function CustomToolbar(toolbar: ToolbarProps) {
    const prev = () => toolbar.onNavigate("PREV");
    const next = () => toolbar.onNavigate("NEXT");
    const views = Array.isArray(toolbar.views)
      ? (toolbar.views as View[])
      : (Object.keys(toolbar.views) as View[]);

    return (
      <>
        <div className="rbc-toolbar">
          <div className="rbc-btn-group">
            {views.map((v) => (
              <button
                key={v}
                className={`rbc-btn ${v === toolbar.view ? "rbc-active" : ""}`}
                onClick={() => toolbar.onView(v)}
              >
                {t(`calendar.${v.toLowerCase()}`, v)}
              </button>
            ))}
          </div>
          <span className="rbc-toolbar-label">{toolbar.label}</span>
          <div className="rbc-btn-group">
            <button className="rbc-btn" onClick={prev}>
              {t("calendar.previous", "Back")}
            </button>
            <button className="rbc-btn" onClick={next}>
              {t("calendar.next", "Next")}
            </button>
          </div>
        </div>

        <div className="rbc-toolbar rbc-category-toolbar">
          {timetableCategories.map((cat) => (
            <button
              key={cat}
              className={`rbc-btn ${selectedCategories.includes(cat) ? "rbc-active" : ""}`}
              onClick={() => toggleCategory(cat)}
            >
              {t(`calendar.category.${cat}`, cat)}
            </button>
          ))}
        </div>
      </>
    );
  }

  function EventRenderer({ event }: EventProps<CalendarEvent>) {
    const { t } = useTranslation();
    const customEvent = event as CustomCalendarEvent;
    const categoryShort = t(`calendar.categoryShort.${customEvent.category}`, "").toUpperCase();

    return (
      <span>
        <strong>
          {customEvent.title} {categoryShort ? `(${categoryShort})` : ""}
        </strong>
        {customEvent.room && (
          <div style={{ fontSize: "0.85em", opacity: 0.8 }}>
            {t("calendar.room", "Room")}: {customEvent.room}
          </div>
        )}
        {customEvent.teacher && (
          <div style={{ fontSize: "0.85em", opacity: 0.8 }}>
            {t("calendar.teacher", "Teacher")}: {customEvent.teacher}
          </div>
        )}
      </span>
    );
  }

  const activeEvents = selectedSchedule ? events : localScheduleEvents;
  const filtered = activeEvents.filter((e) => selectedCategories.includes(e.category));

  return (
    <>
      <div style={{ display: "flex", gap: "16px", padding: "8px", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 50%" }}>
          <TimetableSelector
            schedules={schedules}
            selected={selectedSchedule?.id ?? null}
            onSelect={(id) => {
              if (id === null) {
                setSelectedSchedule(null);
              } else {
                const found = schedules.find((s) => s.id === id) || null;
                setSelectedSchedule(found);
              }
            }}
          />
        </div>

        <div style={{ flex: "1 1 50%" }}>
          <TimetableCreator
            selectedSchedule={selectedSchedule}
            onCreated={async (newSchedule) => {
              await Promise.all(
                localScheduleEvents.map((e) =>
                  scheduleAPI.addEvent(newSchedule.id, { ...e, id: -1 })
                )
              );

              setSchedules((prev) => [...prev, newSchedule]);
              setLocalScheduleEvents([]);
              setSelectedSchedule(newSchedule);
            }}
            onUpdated={(updatedSchedule) => {
              setSchedules((prev) =>
                prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s))
              );
              setSelectedSchedule(updatedSchedule);
            }}
            onDeleted={(id) => {
              setSchedules((prev) => prev.filter((s) => s.id !== id));
              if (selectedSchedule?.id === id) {
                setSelectedSchedule(null);
                setEvents([]);
              }
            }}
          />
        </div>
      </div>

      <DragAndDropCalendar
        localizer={localizer}
        culture={culture}
        events={filtered}
        view={view}
        date={date}
        onNavigate={setDate}
        onView={setView}
        selectable
        resizable
        step={15}
        timeslots={2}
        min={new Date(1, 1, 1, 8)}
        max={new Date(1, 1, 1, 22)}
        views={[Views.MONTH, Views.WEEK]}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        components={{
          toolbar: CustomToolbar,
          event: EventRenderer,
        }}
        eventPropGetter={(evt) => ({
          style: { backgroundColor: (evt as CustomCalendarEvent).color },
        })}
        style={{ height: 650 }}
      />

      {pendingSlot && (
        <TimetableModal
          isOpen={modalOpen}
          defaultStart={pendingSlot.start}
          defaultEnd={pendingSlot.end}
          categories={timetableCategories}
          scheduleId={selectedSchedule ? selectedSchedule.id : -1}
          onCancel={() => {
            setModalOpen(false);
            setPendingSlot(null);
          }}
          onSave={handleModalSave}
        />
      )}
    </>
  );
};

export default Timetable;
