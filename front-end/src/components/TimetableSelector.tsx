import { useTranslation } from "react-i18next";
import { SchedulePlan } from "@/types/SchedulePlan";

interface TimetableSelectorProps {
  schedules: SchedulePlan[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

export const TimetableSelector: React.FC<TimetableSelectorProps> = ({ schedules, selected, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 16 }}>
      <select
        value={selected ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onSelect(val ? parseInt(val) : null);
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
