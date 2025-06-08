import { useState, useEffect } from "react";
import Modal from "react-modal";
import DatePicker from "react-datepicker";
import { useTranslation } from "react-i18next";
import { enGB } from "date-fns/locale/en-GB";
import { pl } from "date-fns/locale/pl";

import { CategoryKey } from "@/enums/CategoryKey";
import { RepeatType } from "@/enums/RepeatType";

import "react-datepicker/dist/react-datepicker.css";
import "./Calendar.css";

Modal.setAppElement("#root");

interface CalendarModalProps {
  isOpen: boolean;
  defaultStart: Date;
  defaultEnd: Date;
  categories: CategoryKey[];
  onSave: (data: {
    title: string;
    category: CategoryKey;
    repeatType: RepeatType;
    start: Date;
    end: Date;
    schedule_plan: number | null,
    is_template: boolean | null,
    room: string | null,
    teacher: string | null
  }) => void;
  onCancel: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  defaultStart,
  defaultEnd,
  categories,
  onSave,
  onCancel,
}) => {
  const { t, i18n } = useTranslation();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryKey>(categories[0]);
  const [repeatType, setRepeatType] = useState<RepeatType>(RepeatType.None);
  const [start, setStart] = useState<Date>(defaultStart);
  const [end, setEnd] = useState<Date>(defaultEnd);
  const [room, setRoom] = useState("");
  const [teacher, setTeacher] = useState("");

  useEffect(() => {
    setStart(defaultStart);
    setEnd(defaultEnd);
  }, [defaultStart, defaultEnd]);

  const inputStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    width: "100%",
  };

  const selectStyle = inputStyle;

  const buttonStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    border: "1px solid #ccc",
    background: "#f4f4f4",
  };

  const saveButtonBaseStyle: React.CSSProperties = {
    ...buttonStyle,
    border: "none",
    background: "#2563eb",
    color: "#fff",
  };

  const isSaveButtonDisabled =
    category === CategoryKey.Timetable
      ? !title || !room || !teacher
      : !title;

  const handleSave = () => {
    if (!title) { 
      return;
    }

    if (end <= start) {
      alert(t("calendar.invalidRange", "End date must be after start date"));
      return;
    }

    onSave({
      title,
      category,
      repeatType,
      start,
      end,
      schedule_plan: null,
      is_template: null,
      room: category === CategoryKey.Timetable ? room : null,
      teacher: category === CategoryKey.Timetable ? teacher : null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCancel}
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryKey)}
          style={selectStyle}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {t(`calendar.category.${cat}`, cat)}
            </option>
          ))}
        </select>

        <select
          value={repeatType}
          onChange={(e) => setRepeatType(e.target.value as RepeatType)}
          style={selectStyle}
        >
          {Object.values(RepeatType).map((type) => (
            <option key={type} value={type}>
              {t(`calendar.repeat.${type}`, type)}
            </option>
          ))}
        </select>

        {category === CategoryKey.Timetable && (
          <>
            <input
              type="text"
              placeholder={t("calendar.enterRoom", "Enter room")}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder={t("calendar.enterTeacher", "Enter teacher")}
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label>{t("calendar.startDate", "Start date")}</label>
          <DatePicker
            selected={start}
            onChange={(date) => date && setStart(date)}
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            timeCaption={t("calendar.time", "Time")}
            className="custom-datepicker"
            locale={i18n.language.startsWith("pl") ? pl : enGB}
            wrapperClassName="date-picker-wrapper"
            minTime={new Date(new Date(start).setHours(8, 0))}
            maxTime={new Date(new Date(start).setHours(22, 0))}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label>{t("calendar.endDate", "End date")}</label>
          <DatePicker
            selected={end}
            onChange={(date) => date && setEnd(date)}
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            timeCaption={t("calendar.time", "Time")}
            className="custom-datepicker"
            locale={i18n.language.startsWith("pl") ? pl : enGB}
            wrapperClassName="date-picker-wrapper"
            minTime={new Date(new Date(start).setHours(8, 0))}
            maxTime={new Date(new Date(start).setHours(22, 0))}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px" }}>
        <button onClick={onCancel} style={cancelButtonStyle}>
          {t("calendar.cancel", "Cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaveButtonDisabled}
          style={{
            ...saveButtonBaseStyle,
            cursor: isSaveButtonDisabled ? "not-allowed" : "pointer",
            opacity: isSaveButtonDisabled ? 0.6 : 1,
          }}
        >
          {t("calendar.save", "Save")}
        </button>
      </div>
    </Modal>
  );
};


export default CalendarModal;
