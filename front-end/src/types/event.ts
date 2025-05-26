import { CategoryKey } from "@/enums/CategoryKey";
import { RepeatType } from "@/enums/RepeatType";
import { Event as CalendarEvent } from "react-big-calendar";

export interface CustomCalendarEvent extends CalendarEvent {
  id: number | string;
  description: string;
  category?: CategoryKey;
  color?: string;
  repeatType: RepeatType;
}
