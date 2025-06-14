import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { scheduleAPI } from "@/services/api";
import { SchedulePlan } from "@/types/SchedulePlan";

interface TimetableCreatorProps {
  onCreated?: (schedule: SchedulePlan) => void;
  onUpdated?: (schedule: SchedulePlan) => void;
  onDeleted?: (id: number) => void;
  selectedSchedule: SchedulePlan | null;
}

const TimetableCreator: React.FC<TimetableCreatorProps> = ({
  onCreated,
  onUpdated,
  onDeleted,
  selectedSchedule,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const isCreating = selectedSchedule === null;

  useEffect(() => {
    setTitle(selectedSchedule?.name ?? "");
  }, [selectedSchedule]);

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      const newSchedule = await scheduleAPI.create({
        name: title.trim(),
        description: "",
        code: "",
      });
      setTitle("");
      alert(t("calendar.scheduleCreated", "New timetable created. Events cleared."));
      onCreated?.(newSchedule);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Schedule creation failed");
    }
  };

  const handleUpdate = async () => {
    if (!title.trim() || !selectedSchedule) return;

    try {
      await scheduleAPI.update(selectedSchedule.id, { name: title.trim() });
      alert(t("calendar.scheduleUpdated", "Schedule updated."));
      onUpdated?.({ ...selectedSchedule, name: title.trim() });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Schedule update failed");
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) {
      return;
    }

    const confirmed = window.confirm(
      t("calendar.deleteScheduleConfirm", "Are you sure you want to delete this schedule?")
    );

    if (!confirmed) {
      return;
    }

    try {
      await scheduleAPI.delete(selectedSchedule.id);
      alert(t("calendar.scheduleDeleted", "Schedule deleted."));
      onDeleted?.(selectedSchedule.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Schedule deletion failed");
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
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
        }}
      />

      {isCreating ? (
        <div style={{ display: "flex", gap: "8px" }}>
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
      ) : (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleUpdate}
            disabled={!selectedSchedule}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: selectedSchedule ? "#10b981" : "#ccc",
              color: "white",
              fontWeight: 600,
              cursor: selectedSchedule ? "pointer" : "not-allowed",
            }}
          >
            {t("calendar.update", "Update")}
          </button>

          <button
            onClick={handleDelete}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#ef4444",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("calendar.delete", "Delete")}
          </button>
        </div>
      )}
    </div>
  );
};

export default TimetableCreator;
