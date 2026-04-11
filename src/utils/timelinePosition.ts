export const toPercent = (date: Date, rangeStart: Date, rangeEnd: Date): number => {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  if (total <= 0) return 0;

  const value = ((date.getTime() - rangeStart.getTime()) / total) * 100;
  return Math.min(100, Math.max(0, value));
};
