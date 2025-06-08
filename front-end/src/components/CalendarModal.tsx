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

  useEffect(() => {
    setStart(defaultStart);
    setEnd(defaultEnd);
  }, [defaultStart, defaultEnd]);

  const handleSave = () => {
    if (!title) return;
    if (end <= start) {
      alert(t("calendar.invalidRange", "End date must be after start date"));
      return;
    }

    onSave({ title, category, repeatType, start, end });
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
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "1rem",
            width: "100%",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryKey)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "1rem",
            width: "100%",
          }}
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
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
        <button
          onClick={onCancel}
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
          onClick={handleSave}
          disabled={!title}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: title ? "pointer" : "not-allowed",
            opacity: title ? 1 : 0.6,
          }}
        >
          {t("calendar.save", "Save")}
        </button>
      </div>
    </Modal>
  );
};

export default CalendarModal;
