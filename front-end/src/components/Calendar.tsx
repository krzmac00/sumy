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
import { eventAPI, scheduleAPI } from "@/services/api";
import "./Calendar.css";
import CalendarModal from "./CalendarModal";
import TimetableSelector from "./TimetableSelector";
import { SchedulePlan } from "@/types/SchedulePlan";

const DragAndDropCalendar = withDragAndDrop(BigCalendar as any);

export const Calendar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locales = { en: enGB, pl };
  const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
  const culture = i18n.language.substring(0, 2);

  const allCategories = Object.values(CategoryKey) as CategoryKey[];
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(allCategories);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ start: Date; end: Date } | null>(null);

  const [schedules, setSchedules] = useState<SchedulePlan[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<SchedulePlan | null>(null);

  const isCategoryFromTimeTable = (categoryKey: CategoryKey) => {
    return categoryKey === CategoryKey.TimetableLecture ||
      categoryKey === CategoryKey.TimetableLaboratory ||
      categoryKey === CategoryKey.TimetableTutorials;
  }

  useEffect(() => {
    scheduleAPI.getAll().then(setSchedules).catch(console.error);
  }, []);

  useEffect(() => {
    const endOfView = new Date(date);
    endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));

    const fetchGlobalAndScheduleEvents = async () => {
      try {
        const [rawEvents, scheduleEvents] = await Promise.all([
          eventAPI.getAll(),
          selectedSchedule ? scheduleAPI.getEvents(selectedSchedule.id) : Promise.resolve([]),
        ]);

        const normalize = (event: any): CustomCalendarEvent => ({
          id: event.id,
          title: event.title,
          description: event.description,
          start: new Date(event.start),
          end: new Date(event.end),
          category: event.category,
          color: event.color,
          repeatType: event.repeat_type || event.repeatType || RepeatType.None,
          schedule_plan: event.schedule_plan,
          is_template: event.is_template,
          room: event.room,
          teacher: event.teacher,
        });

        const allRawEvents = [...rawEvents, ...scheduleEvents];
        const normalizedEvents: CustomCalendarEvent[] = [];

        allRawEvents.forEach((event) => {
          const base = normalize(event);
          normalizedEvents.push(base);
          normalizedEvents.push(...expandEvent(base, endOfView));
        });

        setEvents(normalizedEvents);
      } catch (err) {
        console.error("Failed to load events:", err);
      }
    };

    fetchGlobalAndScheduleEvents();
  }, [date, view, selectedSchedule]);

  const expandEvent = (event: CustomCalendarEvent, endOfView: Date): CustomCalendarEvent[] => {
    if (!event.start || !event.end) return [];
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
        while (current.getMonth() === current.getMonth()) {
          if (current.getDay() === dayOfWeek) {
            weekdayCount += 1;
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
    const clickedDate = new Date(start);

    const startDate = new Date(clickedDate);
    startDate.setHours(8, 0, 0, 0); // 08:00

    const endDate = new Date(clickedDate);
    endDate.setHours(9, 0, 0, 0); // 09:00

    setPendingSlot({ start: startDate, end: endDate });
    setModalOpen(true);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setPendingSlot(null);
  };

  const handleModalSave = (data: {
    title: string;
    category: CategoryKey;
    repeatType: RepeatType;
    start: Date;
    end: Date;
    schedule_plan: number | null;
    is_template: boolean | null;
    room: string | null;
    teacher: string | null;
  }) => {
    const {
      title,
      category,
      repeatType,
      start,
      end,
      schedule_plan,
      is_template,
      room,
      teacher,
    } = data;

    const newEvent: Omit<CustomCalendarEvent, "id"> = {
      title,
      description: "",
      start,
      end,
      category,
      repeatType,
      schedule_plan,
      is_template,
      room,
      teacher,
      color: ""
    };

    eventAPI
      .create(newEvent)
      .then((savedEvent: CustomCalendarEvent) => {
        const expandedEvents: CustomCalendarEvent[] = [savedEvent];
        const endOfView = new Date(date);
        endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));
        expandedEvents.push(...expandEvent(savedEvent, endOfView));

        setEvents((prev) => [...prev, ...expandedEvents]);
        handleModalCancel();
      })
      .catch((err: any) => console.error("Failed to create event:", err));
  };

  const handleEventDrop = ({ event, start }: any) => {
    const ev = event as CustomCalendarEvent;

    const baseId = typeof ev.id === "string" && ev.id.includes("-")
      ? parseInt(ev.id.split("-")[0])
      : (typeof ev.id === "number" ? ev.id : NaN);

    if (!Number.isFinite(baseId)) return;

    const originalBase = events.find(e => {
      const id = typeof e.id === "number" ? e.id : parseInt((e.id as string).split("-")[0]);
      return id === baseId && typeof e.id === "number";
    });

    if (!originalBase || !originalBase.start || !originalBase.end) return;

    const deltaMs = new Date(start).getTime() - new Date(ev.start!).getTime();

    const updatedBase: CustomCalendarEvent = {
      ...originalBase,
      start: new Date(originalBase.start.getTime() + deltaMs),
      end: new Date(originalBase.end.getTime() + deltaMs),
    };

    eventAPI
      .update(baseId, updatedBase)
      .then((savedEvent: any) => {
        const endOfView = new Date(date);
        endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));
        setEvents(prev => {
          const idStr = savedEvent.id.toString();
          return [
            ...prev.filter(e => {
              const eId = typeof e.id === "number" ? e.id.toString() : e.id;
              return !eId.startsWith(idStr);
            }),
            savedEvent,
            ...expandEvent(savedEvent, endOfView),
          ];
        });
      })
      .catch((err: any) => console.error("Failed to update recurring event:", err));
  };

  const handleEventResize = ({ event, start, end }: any) => {
    const ev = event as CustomCalendarEvent;
    if (typeof ev.id !== "number") return;

    const updated = { ...ev, start: new Date(start), end: new Date(end) };

    eventAPI
      .update(ev.id, updated)
      .then((savedEvent: any) => {
        const endOfView = new Date(date);
        endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));

        setEvents((prev) => {
          const baseId = savedEvent.id.toString();
          return [
            ...prev.filter((e) => {
              const eId = typeof e.id === "number" ? e.id.toString() : e.id;
              return !eId.startsWith(baseId);
            }),
            savedEvent,
            ...expandEvent(savedEvent, endOfView),
          ];
        });
      })
      .catch((err: any) => console.error("Failed to resize event:", err));
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const ev = event as CustomCalendarEvent;
    const numericId = typeof ev.id === "number" ? ev.id : parseInt((ev.id as string).split("-")[0]);

    if (!Number.isFinite(numericId)) return;

    if (window.confirm(t("calendar.deleteClass", { title: ev.title }))) {
      eventAPI
        .delete(numericId)
        .then(() => {
          setEvents((prev) => prev.filter((e) => {
            const eId = typeof e.id === "number" ? e.id : parseInt((e.id as string).split("-")[0]);
            return eId !== numericId;
          }));
        })
        .catch((err: any) => console.error("Failed to delete event:", err));
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
            <button className="rbc-btn" onClick={prev}>
              {t("calendar.previous", "Back")}
            </button>
            <button className="rbc-btn" onClick={next}>
              {t("calendar.next", "Next")}
            </button>
          </div>
        </div>
        <div className="rbc-toolbar rbc-category-toolbar">
          {allCategories.slice(0, 3).map((cat) => (
            <button
              key={cat}
              className={`rbc-btn ${selectedCategories.includes(cat) ? "rbc-active" : ""}`}
              onClick={() => toggleCategory(cat)}
            >
              {t(`calendar.category.${cat}`, cat)}
            </button>
          ))}
        </div>

        <div className="rbc-toolbar rbc-category-toolbar">
          {allCategories.slice(3).map((cat) => (
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

    const isTimetableCategory = isCategoryFromTimeTable(customEvent.category);

    const shortLabel = isTimetableCategory
      ? t(`calendar.categoryShort.${customEvent.category}`, "")
      : "";

    const repeatTypeLabel =
      customEvent.repeatType !== RepeatType.None
        ? ` (${t(`calendar.repeat.${customEvent.repeatType}`, customEvent.repeatType)})`
        : "";

    return (
      <span>
        <strong>
          {customEvent.title}
          {shortLabel && ` (${shortLabel})`}
        </strong>

        {!isTimetableCategory && (
          <div style={{ fontSize: "0.85em", opacity: 0.8 }}>
            {t(`calendar.category.${customEvent.category}`, customEvent.category)}
          </div>
        )}

        {repeatTypeLabel && (
          <div style={{ fontSize: "0.85em", opacity: 0.8 }}>{repeatTypeLabel}</div>
        )}

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

  return (
    <>
      <div style={{ display: "flex", gap: "16px", padding: "8px", alignItems: "flex-start" }}>
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
        <CalendarModal
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

export default Calendar;
