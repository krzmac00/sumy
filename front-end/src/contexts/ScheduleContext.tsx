import { SchedulePlan } from "@/types/SchedulePlan";
import { createContext, useContext, useEffect, useState } from "react";

interface ScheduleContextType {
  schedules: SchedulePlan[];
  setSchedules: (schedules: SchedulePlan[]) => void;
  selectedSchedule: SchedulePlan | null;
  setSelectedSchedule: (schedule: SchedulePlan | null) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useScheduleContext = (): ScheduleContextType => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error("useScheduleContext must be used within a ScheduleProvider");
  }
  return context;
};

const mockSchedules: SchedulePlan[] = [
  { id: 1, name: "Spring 2025", description: "Main semester schedule", code: "SP25" },
  { id: 2, name: "Exam Week", description: "Final exams", code: "EXWEEK" },
];

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<SchedulePlan[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<SchedulePlan | null>(null);

  useEffect(() => {
    const local = localStorage.getItem("timetable_schedules");
    const parsed = local ? JSON.parse(local) : mockSchedules;
    setSchedules(parsed);
    if (parsed.length > 0) setSelectedSchedule(parsed[0]);
  }, []);

  return (
    <ScheduleContext.Provider
      value={{ schedules, setSchedules, selectedSchedule, setSelectedSchedule }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};