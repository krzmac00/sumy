import { useState } from 'react';
import { Calendar as BigCalendar, Views, dateFnsLocalizer, Event as CalendarEvent, View, ToolbarProps, } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { parse, startOfWeek, format, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { pl } from 'date-fns/locale/pl';
import { useTranslation } from 'react-i18next';

const DragAndDropCalendar = withDragAndDrop(BigCalendar as any);

const locales = { en: enUS, pl };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface AppEvent extends CalendarEvent {
  id: number;
  description: string;
  category?: string;
  color?: string;
}

function CustomToolbar(toolbar: ToolbarProps) {
  const { t } = useTranslation();

  const goToBack = () => toolbar.onNavigate("PREV");
  const goToNext = () => toolbar.onNavigate("NEXT");

  const viewsArray: View[] = Array.isArray(toolbar.views)
    ? (toolbar.views as View[])
    : (Object.keys(toolbar.views) as View[]);

  return (
    <div className="rbc-toolbar">
      <div className="rbc-btn-group">
        <button type="button" onClick={goToBack}>
          {t("calendar.previous", "Back")}
        </button>
        <button type="button" onClick={goToNext}>
          {t("calendar.next", "Next")}
        </button>
      </div>
      <span className="rbc-toolbar-label">{toolbar.label}</span>
      <div className="rbc-btn-group">
        {viewsArray.map((view: View) => (
          <button
            key={view}
            type="button"
            className={view === toolbar.view ? "rbc-active" : ""}
            onClick={() => toolbar.onView(view)}
          >
            {t(`calendar.${view.toLowerCase()}`, view)}
          </button>
        ))}
      </div>
    </div>
  );
}

const Calendar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const culture = i18n.language.substring(0, 2);

  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<AppEvent[]>([
    {
      id: 1,
      title: "Class A",
      description: "Test 1",
      start: new Date(2025, 4, 10, 10, 30),
      end: new Date(2025, 4, 10, 12, 0),
      category: "exam",
      color: "#C41E3A",
    },
    {
      id: 2,
      title: "Class B",
      description: "Test 2",
      start: new Date(2025, 4, 10, 12, 15),
      end: new Date(2025, 4, 10, 13, 45),
      category: "club",
      color: "#008000",
    },
    {
      id: 3,
      title: "Class C",
      description: "Test 3",
      start: new Date(2025, 4, 11, 9, 0),
      end: new Date(2025, 4, 11, 10, 30),
      category: "private",
      color: "#0047AB",
    },
    {
      id: 4,
      title: "Class D",
      description: "Test 4",
      start: new Date(2025, 4, 11, 10, 45),
      end: new Date(2025, 4, 11, 12, 15),
      category: "student_council",
      color: "#FFD32C",
    },
    {
      id: 5,
      title: "Class E",
      description: "Test 5",
      start: new Date(2025, 4, 12, 14, 0),
      end: new Date(2025, 4, 12, 15, 30),
      category: "important",
      color: "#C41E3A",
    },
    {
      id: 6,
      title: "Class F",
      description: "Test 6",
      start: new Date(2025, 4, 12, 15, 45),
      end: new Date(2025, 4, 12, 17, 15),
      category: "university",
      color: "#008000",
    },
  ]);

  const handleEventDrop = ({ event, start, end }: any) => {
    const appEvent = event as AppEvent;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === appEvent.id ? { ...e, start: new Date(start), end: new Date(end) } : e
      )
    );
  };

  const handleEventResize = ({ event, start, end }: any) => {
    const appEvent = event as AppEvent;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === appEvent.id ? { ...e, start: new Date(start), end: new Date(end) } : e
      )
    );
  };

  const handleSelectSlot = ({ start, end }: any) => {
    const title = prompt(t("calendar.enterClass", "Enter class title"));
    if (!title) return;

    const category =
      prompt(t("calendar.enterCategory", "Category key (e.g. 'exam')"), "none") || "none";
    const color =
      prompt(t("calendar.enterColor", "Color key (e.g. '#FF0000')"), "#0000FF") || "#0000FF";

    const newId = events.length ? Math.max(...events.map((e) => e.id)) + 1 : 1;

    setEvents((prev) => [
      ...prev,
      {
        id: newId,
        title,
        description: "",
        start: new Date(start),
        end: new Date(end),
        category,
        color,
      },
    ]);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (window.confirm(t("calendar.deleteClass", { title: event.title }))) {
      setEvents((prev) => prev.filter((e) => e.id !== (event as AppEvent).id));
    }
  };

  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleView = (newView: View) => setView(newView);

  return (
    <DragAndDropCalendar
      localizer={localizer}
      culture={culture}
      events={events}
      view={view}
      date={date}
      onNavigate={handleNavigate}
      onView={handleView}
      min={new Date(0, 0, 0, 8, 0, 0)}
      max={new Date(0, 0, 0, 20, 0, 0)}
      selectable
      resizable
      onEventDrop={handleEventDrop}
      onEventResize={handleEventResize}
      onSelectSlot={handleSelectSlot}
      onSelectEvent={handleSelectEvent}
      components={{ toolbar: CustomToolbar }}
      views={[Views.MONTH, Views.WEEK, Views.DAY]}
      step={15}
      timeslots={2}
      eventPropGetter={(rawEvent) => {
        const ev = rawEvent as AppEvent;
        return {
          style: { backgroundColor: ev.color || "#0000FF" },
          title: `${ev.description}${ev.category ? ` — ${ev.category}` : ""}`,
        };
      }}
      style={{ height: 650 }}
    />
  );
}

export default Calendar;