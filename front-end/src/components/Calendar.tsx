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
import Modal from "react-modal";
import { parse, startOfWeek, format, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { pl } from "date-fns/locale/pl";
import { useTranslation } from "react-i18next";
import { CategoryKey } from "@/enums/CategoryKey";
import { ColorKey } from "@/enums/ColorKey";
import { RepeatType } from "@/enums/RepeatType";
import { CustomCalendarEvent } from "@/types/event";
import { eventAPI } from "@/services/api";

Modal.setAppElement("#root");
const DragAndDropCalendar = withDragAndDrop(BigCalendar as any);

const Calendar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locales = { en: enUS, pl };
  const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
  const culture = i18n.language.substring(0, 2);

  const allCategories = Object.values(CategoryKey) as CategoryKey[];
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(allCategories);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());

  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);

  useEffect(() => {
    eventAPI
      .getAll()
      .then((loadedEvents: any) => setEvents(loadedEvents))
      .catch((err: any) => console.error("Failed to load events:", err));
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<CategoryKey>(allCategories[0]);

  const toggleCategory = (cat: CategoryKey) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const filtered = events.filter((e) => e.category && selectedCategories.includes(e.category));

  const handleEventDrop = ({ event, start, end }: any) => {
    const ev = event as CustomCalendarEvent;
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
    const updated = { ...ev, start: new Date(start), end: new Date(end) };

    eventAPI
      .update(ev.id, updated)
      .then((savedEvent: any) => {
        setEvents((prev) => prev.map((e) => (e.id === savedEvent.id ? savedEvent : e)));
      })
      .catch((err: any) => console.error("Failed to resize event:", err));
  };

  const handleSelectSlot = ({ start, end }: any) => {
    setPendingSlot({ start: new Date(start), end: new Date(end) });
    setNewTitle("");
    setNewCategory(allCategories[0]);
    setModalOpen(true);
  };

  const handleModalSave = () => {
    if (!pendingSlot) return;

    const newEvent: Omit<CustomCalendarEvent, "id"> = {
      title: newTitle,
      description: "",
      start: pendingSlot.start,
      end: new Date(pendingSlot.start.getTime() + 30 * 60 * 1000),
      category: newCategory,
      color: ColorKey.Blue,
      repeatType: RepeatType.None,
    };

    eventAPI
      .create(newEvent)
      .then((savedEvent: any) => {
        setEvents((prev) => [...prev, savedEvent]);
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
    if (window.confirm(t("calendar.deleteClass", { title: ev.title }))) {
      eventAPI
        .delete(ev.id)
        .then(() => {
          setEvents((prev) => prev.filter((e) => e.id !== ev.id));
        })
        .catch((err: any) => console.error("Failed to delete event:", err));
    }
  };

  const handleNavigate = (d: Date) => setDate(d);
  const handleView = (v: View) => setView(v);

  function CustomToolbar(toolbar: ToolbarProps) {
    const { t } = useTranslation();
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
    const { t } = useTranslation();
    const customEvent = event as CustomCalendarEvent; // 👈 safely cast

    return (
      <span>
        <strong>{customEvent.title}</strong>
        <div style={{ fontSize: "0.85em", opacity: 0.75 }}>
          {t(`calendar.category.${customEvent.category}`, customEvent.category as string)}
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
          event: EventRenderer
        }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
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
        </div>
      </Modal>
    </>
  );
};

export default Calendar;
