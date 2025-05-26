import { useState, useEffect } from "react";
import { Calendar as BigCalendar, Views, dateFnsLocalizer, Event as CalendarEvent, View, ToolbarProps, EventProps } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import Modal from "react-modal";
import { parse, startOfWeek, format, getDay } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { pl } from "date-fns/locale/pl";
import { useTranslation } from "react-i18next";
import { CategoryKey } from "@/enums/CategoryKey";
import { RepeatType } from "@/enums/RepeatType";
import { CustomCalendarEvent } from "@/types/event";
import { eventAPI } from "@/services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Calendar.css"

Modal.setAppElement("#root");
const DragAndDropCalendar = withDragAndDrop(BigCalendar as any);

const Calendar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locales = { en: enGB, pl };
  const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
  const culture = i18n.language.substring(0, 2);

  const allCategories = Object.values(CategoryKey) as CategoryKey[];
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(allCategories);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);
  const [newStart, setNewStart] = useState<Date>(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  });

  const [newEnd, setNewEnd] = useState<Date>(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });

  useEffect(() => {
    eventAPI
      .getAll()
      .then((rawEvents: any[]) => {
        const normalizedEvents: CustomCalendarEvent[] = [];

        const endOfView = new Date(date);
        endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));

        rawEvents.forEach((event) => {
          const base: CustomCalendarEvent = {
            id: event.id,
            title: event.title,
            description: event.description,
            start: new Date(event.start),
            end: new Date(event.end),
            category: event.category,
            color: event.color,
            repeatType: event.repeat_type as RepeatType,
          };

          normalizedEvents.push(base);

          if (base.repeatType === RepeatType.Weekly) {
            let current = new Date(base.start as Date);
            const endRepeat = new Date(endOfView);

            while (true) {
              current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
              if (current > endRepeat) break;

              normalizedEvents.push({
                ...base,
                id: `${base.id}-weekly-${current.toISOString()}`,
                start: new Date(current),
                end: new Date(current.getTime() + (base.end!.getTime() - base.start!.getTime())),
              });
            }
          }

          if (base.repeatType === RepeatType.Monthly) {
            const baseStart = base.start!;
            const baseEnd = base.end!;
            const eventDuration = baseEnd.getTime() - baseStart.getTime();

            const dayOfWeek = baseStart.getDay();
            const nth = Math.floor((baseStart.getDate() - 1) / 7) + 1;

            let current = new Date(baseStart);
            const endRepeat = new Date(endOfView);

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

              if (current > endRepeat) break;

              normalizedEvents.push({
                ...base,
                id: `${base.id}-monthly-${current.toISOString()}`,
                start: new Date(current),
                end: new Date(current.getTime() + eventDuration),
              });
            }
          }
        });

        setEvents(normalizedEvents);
      })
      .catch((err: any) => console.error("Failed to load events:", err));
  }, [date, view]);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<CategoryKey>(allCategories[0]);
  const [newRepeatType, setNewRepeatType] = useState<RepeatType>(RepeatType.None);

  const toggleCategory = (cat: CategoryKey) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const filtered = events.filter((e) => e.category && selectedCategories.includes(e.category));

  const handleEventDrop = ({ event, start, end }: any) => {
    const ev = event as CustomCalendarEvent;
    if (typeof ev.id !== "number") return;

    const updated = { ...ev, start: new Date(start), end: new Date(end) };

    eventAPI
      .update(ev.id, updated)
      .then((savedEvent: any) => {
        setEvents((prev) => prev.map((e) => (e.id === savedEvent.id ? savedEvent : e)));
      })
      .catch((err: any) => console.error("Failed to update event:", err));
  };

  const handleEventResize = ({ event, start, end }: any) => {
    const ev = event as CustomCalendarEvent;
    if (typeof ev.id !== "number") return;

    const updated = { ...ev, start: new Date(start), end: new Date(end) };

    eventAPI
      .update(ev.id, updated)
      .then((savedEvent: any) => {
        setEvents((prev) => prev.map((e) => (e.id === savedEvent.id ? savedEvent : e)));
      })
      .catch((err: any) => console.error("Failed to resize event:", err));
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const clickedDate = new Date(start);

    const startDate = new Date(clickedDate);
    startDate.setHours(8, 0, 0, 0); // 08:00:00

    const endDate = new Date(clickedDate);
    endDate.setHours(9, 0, 0, 0); // 09:00:00

    setPendingSlot({ start: startDate, end: endDate });
    setNewTitle("");
    setNewCategory(allCategories[0]);
    setNewRepeatType(RepeatType.None);
    setNewStart(startDate);
    setNewEnd(endDate);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    if (!pendingSlot) return;
    if (!newStart || !newEnd) return;

    const start = new Date(newStart);
    const end = new Date(newEnd);

    if (end <= start) {
      alert(t("calendar.invalidRange", "End date must be after start date"));
      return;
    }

    const newEvent: Omit<CustomCalendarEvent, "id"> = {
      title: newTitle,
      description: "",
      start,
      end,
      category: newCategory,
      color: '#2563eb',
      repeatType: newRepeatType,
    };

    eventAPI
      .create(newEvent)
      .then((savedEvent: CustomCalendarEvent) => {
        const expandedEvents: CustomCalendarEvent[] = [savedEvent];

        const endOfView = new Date(date);
        endOfView.setDate(endOfView.getDate() + (view === Views.MONTH ? 35 : 7));
        const duration = savedEvent.end!.getTime() - savedEvent.start!.getTime();

        if (savedEvent.repeatType === RepeatType.Weekly) {
          let current = new Date(savedEvent.start as Date);
          while (true) {
            current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (current > endOfView) break;

            expandedEvents.push({
              ...savedEvent,
              id: `${savedEvent.id}-weekly-${current.toISOString()}`,
              start: new Date(current),
              end: new Date(current.getTime() + duration),
            });
          }
        }

        if (savedEvent.repeatType === RepeatType.Monthly) {
          const baseStart = new Date(savedEvent.start as Date);
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

            expandedEvents.push({
              ...savedEvent,
              id: `${savedEvent.id}-monthly-${current.toISOString()}`,
              start: new Date(current),
              end: new Date(current.getTime() + duration),
            });
          }
        }

        setEvents((prev) => [...prev, ...expandedEvents]);
        setModalOpen(false);
        setPendingSlot(null);
      })
      .catch((err: any) => console.error("Failed to create event:", err));
  };


  const handleModalCancel = () => {
    setModalOpen(false);
    setPendingSlot(null);
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
    const repeatLabel =
      customEvent.repeatType !== RepeatType.None
        ? ` (${t(`calendar.repeat.${customEvent.repeatType}`, customEvent.repeatType)})`
        : "";

    return (
      <span>
        <strong>{customEvent.title}</strong>
        <div style={{ fontSize: "0.85em", opacity: 0.75 }}>
          {t(`calendar.category.${customEvent.category ?? "undefined"}`, customEvent.category ?? "")}
        </div>
        <div style={{ fontSize: "0.85em", opacity: 0.75 }}>
          {repeatLabel}
        </div>
      </span>
    );
  }

  return (
    <>
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
          toolbar: CustomToolbar,
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

      <Modal
        isOpen={modalOpen}
        onRequestClose={handleModalCancel}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          },
          content: {
            position: "static",
            inset: "auto",
            padding: "20px",
            border: "none",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            width: "380px",
            maxWidth: "90%",
          },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
            {t("calendar.newEvent", "New Event")}
          </h2>
          <input
            type="text"
            placeholder={t("calendar.enterClass", "Enter class title")}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              width: "100%",
            }}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as CategoryKey)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              width: "100%",
            }}
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {t(`calendar.category.${cat}`, cat)}
              </option>
            ))}
          </select>
          <select
            value={newRepeatType}
            onChange={(e) => setNewRepeatType(e.target.value as RepeatType)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              width: "100%",
            }}
          >
            {Object.values(RepeatType).map((type) => (
              <option key={type} value={type}>
                {t(`calendar.repeat.${type}`, type)}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <label>
              {t("calendar.startDate", "Start date")}
            </label>
            <DatePicker
              selected={newStart}
              onChange={(date) => date && setNewStart(date)}
              showTimeSelect
              timeIntervals={15}
              dateFormat="Pp"
              timeCaption={t("calendar.time", "Time")}
              className="custom-datepicker"
              locale={i18n.language.startsWith("pl") ? pl : enGB}
              wrapperClassName="date-picker-wrapper"
              minTime={new Date(new Date(newStart).setHours(8, 0))}
              maxTime={new Date(new Date(newStart).setHours(22, 0))}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <label>
              {t("calendar.endDate", "End date")}
            </label>
            <DatePicker
              selected={newEnd}
              onChange={(date) => date && setNewEnd(date)}
              showTimeSelect
              timeIntervals={15}
              dateFormat="Pp"
              timeCaption={t("calendar.time", "Time")}
              className="custom-datepicker"
              locale={i18n.language.startsWith("pl") ? pl : enGB}
              wrapperClassName="date-picker-wrapper"
              minTime={new Date(new Date(newStart).setHours(8, 0))}
              maxTime={new Date(new Date(newStart).setHours(22, 0))}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px" }}>
          <button
            onClick={handleModalCancel}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: "#f4f4f4",
              cursor: "pointer",
            }}
          >
            {t("calendar.cancel", "Cancel")}
          </button>
          <button
            onClick={handleModalSave}
            disabled={!newTitle}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              cursor: newTitle ? "pointer" : "not-allowed",
              opacity: newTitle ? 1 : 0.6,
            }}
          >
            {t("calendar.save", "Save")}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Calendar;
