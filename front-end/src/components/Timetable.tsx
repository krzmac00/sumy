import { useState, useEffect } from "react";
import {
  Calendar as BigCalendar,
  Views,
  dateFnsLocalizer,
  Event as CalendarEvent,
  View,
  ToolbarProps,
  EventProps,
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
import "./Calendar.css";
import TimetableModal from "./TimetableModal";
import TimetableCreator from "./TimetableCreator";

const DragAndDropCalendar = withDragAndDrop(BigCalendar as any);

export const Timetable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locales = { en: enGB, pl };
  const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
  const culture = i18n.language.substring(0, 2);

  const allCategories = Object.values(CategoryKey).slice(0, 3) as CategoryKey[];
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(allCategories);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [baseEvents, setBaseEvents] = useState<CustomCalendarEvent[]>([]);
  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ start: Date; end: Date } | null>(null);

  const refreshEvents = () => {
    const stored = localStorage.getItem("timetable_events");
    const saved = stored ? JSON.parse(stored) : [];

    const baseEvents: CustomCalendarEvent[] = saved.map((e: any) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));

    const endOfView = new Date(date);
    endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));
    const expanded = baseEvents.flatMap((e) => [e, ...expandEvent(e, endOfView)]);
    setBaseEvents(baseEvents);
    setEvents(expanded);
  };

  useEffect(() => {
    refreshEvents();
  }, [date, view]);

  const expandEvent = (event: CustomCalendarEvent, endOfView: Date): CustomCalendarEvent[] => {
    if (!event.start || !event.end) return [];
    const duration = event.end.getTime() - event.start.getTime();
    const events: CustomCalendarEvent[] = [];

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
            if (weekdayCount === nth) break;
          }
          current.setDate(current.getDate() + 1);
        }
        if (current > endOfView) break;
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

  const toggleCategory = (cat: CategoryKey) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filtered = events.filter((e) => e.category && selectedCategories.includes(e.category));

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const startDate = new Date(start);
    startDate.setHours(8, 0, 0, 0);
    const endDate = new Date(start);
    endDate.setHours(9, 0, 0, 0);
    setPendingSlot({ start: startDate, end: endDate });
    setModalOpen(true);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setPendingSlot(null);
  };

  const handleModalSave = (data: Omit<CustomCalendarEvent, "id">) => {
    const newId = Math.floor(Math.random() * 100000);
    const baseEvent: CustomCalendarEvent = { id: newId, ...data };
    const updatedBaseEvents = [...baseEvents, baseEvent];
    localStorage.setItem("timetable_events", JSON.stringify(updatedBaseEvents));
    setBaseEvents(updatedBaseEvents);
    refreshEvents();
    handleModalCancel();
  };

  const handleEventDrop = ({ event, start }: any) => {
    const ev = event as CustomCalendarEvent;
    const baseId = typeof ev.id === "string" && ev.id.includes("-")
      ? parseInt(ev.id.split("-")[0])
      : (typeof ev.id === "number" ? ev.id : NaN);
    if (!Number.isFinite(baseId)) return;

    const originalBase = baseEvents.find(e => e.id === baseId);
    if (!originalBase || !originalBase.start || !originalBase.end) return;

    const deltaMs = new Date(start).getTime() - new Date(ev.start!).getTime();
    const updatedBase = {
      ...originalBase,
      start: new Date(originalBase.start.getTime() + deltaMs),
      end: new Date(originalBase.end.getTime() + deltaMs),
    };

    const updatedBaseEvents = baseEvents.map(e => e.id === baseId ? updatedBase : e);
    localStorage.setItem("timetable_events", JSON.stringify(updatedBaseEvents));
    refreshEvents();
  };

  const handleEventResize = ({ event, start, end }: any) => {
    const ev = event as CustomCalendarEvent;
    const baseId = typeof ev.id === "string" && ev.id.includes("-")
      ? parseInt(ev.id.split("-")[0])
      : (typeof ev.id === "number" ? ev.id : NaN);
    if (!Number.isFinite(baseId)) return;

    const updatedBase = { ...baseEvents.find(e => e.id === baseId)!, start: new Date(start), end: new Date(end) };
    const updatedBaseEvents = baseEvents.map(e => e.id === baseId ? updatedBase : e);
    localStorage.setItem("timetable_events", JSON.stringify(updatedBaseEvents));
    refreshEvents();
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const ev = event as CustomCalendarEvent;
    const baseId = typeof ev.id === "string" ? parseInt(ev.id.split("-")[0]) : ev.id;
    if (window.confirm(t("calendar.deleteClass", { title: ev.title }) || "Delete event?")) {
      const updatedBaseEvents = baseEvents.filter(e => e.id !== baseId);
      localStorage.setItem("timetable_events", JSON.stringify(updatedBaseEvents));
      refreshEvents();
    }
  };

  const handleNavigate = (d: Date) => setDate(d);
  const handleView = (v: View) => setView(v);

  function CustomCalendarToolbar(toolbar: ToolbarProps) {
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
            <button className="rbc-btn" onClick={prev}>{t("calendar.previous", "Back")}</button>
            <button className="rbc-btn" onClick={next}>{t("calendar.next", "Next")}</button>
          </div>
        </div>
        <div className="rbc-toolbar rbc-category-toolbar">
          {allCategories.map((cat) => (
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
    const customEvent = event as CustomCalendarEvent;
    const repeatTypeLabel =
      customEvent.repeatType !== RepeatType.None
        ? ` (${t(`calendar.repeat.${customEvent.repeatType}`, customEvent.repeatType)})`
        : "";

    return (
      <span>
        <strong>{customEvent.title}</strong>
        <div style={{ fontSize: "0.85em", opacity: 0.8 }}>{repeatTypeLabel}</div>
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

  const handleScheduleCreated = () => {
    refreshEvents();
  };

  return (
    <>
      <TimetableCreator />

      <DragAndDropCalendar
        localizer={localizer}
        culture={culture}
        events={filtered}
        view={view}
        date={date}
        min={new Date(1, 1, 1, 8, 0, 0)}
        max={new Date(1, 1, 1, 22, 0, 0)}
        onNavigate={handleNavigate}
        onView={handleView}
        selectable
        resizable
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        components={{
          toolbar: CustomCalendarToolbar,
          event: EventRenderer,
        }}
        views={[Views.MONTH, Views.WEEK]}
        step={15}
        timeslots={2}
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
          categories={allCategories}
          onCancel={handleModalCancel}
          onSave={handleModalSave}
        />
      )}
    </>
  );
};

export default Timetable;
