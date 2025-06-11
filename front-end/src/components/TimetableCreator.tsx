import { useScheduleContext } from "@/contexts/ScheduleContext";
import { useTranslation } from "react-i18next";
import { SchedulePlan } from "@/types/SchedulePlan";
import { useState } from "react";

const generateId = () => Math.floor(Math.random() * 100000);

const TimetableCreator: React.FC = () => {
  const { t } = useTranslation();
  const { schedules, setSchedules, setSelectedSchedule } = useScheduleContext();
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    const newSchedule: SchedulePlan = {
      id: generateId(),
      name: title.trim(),
      description: "",
      code: "",
    };
    const updated = [...schedules, newSchedule];
    setSchedules(updated);
    setSelectedSchedule(newSchedule);
    localStorage.setItem("timetable_schedules", JSON.stringify(updated));
    localStorage.setItem(`timetable_events_${newSchedule.id}`, JSON.stringify([]));
    setTitle("");
    alert(t("calendar.scheduleCreated", "New timetable created. Events cleared."));
  };

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        gap: "8px",
        alignItems: "center",
        borderTop: "1px solid #e5e7eb",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
      }}
    >
      <input
        type="text"
        placeholder={t("calendar.scheduleTitle", "Schedule title")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontSize: "1rem",
          flex: 1,
        }}
      />
      <button
        onClick={handleCreate}
        disabled={!title.trim()}
        style={{
          padding: "8px 14px",
          borderRadius: "6px",
          border: "none",
          backgroundColor: title.trim() ? "#2563eb" : "#ccc",
          color: "white",
          fontWeight: 600,
          cursor: title.trim() ? "pointer" : "not-allowed",
        }}
      >
        {t("calendar.create", "Create")}
      </button>
    </div>
  );
};

export default TimetableCreator;
