import { format } from "date-fns";

export const formatDisplayDate = (date: Date): string => format(date, "MMMM d, yyyy");

export const formatDisplayDateTime = (date: Date): string => format(date, "MMMM d, yyyy HH:mm");

export const formatDisplayDateRange = (start: Date, end: Date): string => {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const sameDay = sameMonth && start.getDate() === end.getDate();

  if (sameDay) {
    return formatDisplayDate(start);
  }

  if (sameMonth) {
    return `${format(start, "MMMM d")}–${format(end, "d, yyyy")}`;
  }

  if (sameYear) {
    return `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`;
  }

  return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
};
