import { useEffect } from "react";
import { useScheduleContext } from "@/contexts/ScheduleContext";
import { useTranslation } from "react-i18next";

const TimetableSelector: React.FC = () => {
  const { t } = useTranslation();
  const { schedules, setSchedules, selectedSchedule, setSelectedSchedule } = useScheduleContext();

  useEffect(() => {
    const stored = localStorage.getItem("timetable_schedules");
    if (stored) {
      setSchedules(JSON.parse(stored));
    }
  }, []);

  return (
    <div style={{ padding: 10 }}>
      <label>{t("calendar.selectSchedule", "Select Timetable")}</label>
      <select
        value={selectedSchedule?.id ?? ""}
        onChange={(e) => {
          const id = parseInt(e.target.value);
          const found = schedules.find((s) => s.id === id) || null;
          setSelectedSchedule(found);
        }}
      >
        <option value="">{t("calendar.choose", "Choose a schedule")}</option>
        {schedules.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimetableSelector;