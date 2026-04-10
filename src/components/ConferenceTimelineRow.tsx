import { format } from "date-fns";
import { TimelineSeriesRow } from "@/utils/conferenceTimeline";

interface ConferenceTimelineRowProps {
  row: TimelineSeriesRow;
  yearStart: Date;
  yearEnd: Date;
}

const toPercent = (date: Date, yearStart: Date, yearEnd: Date) => {
  const total = yearEnd.getTime() - yearStart.getTime();
  if (total <= 0) return 0;
  const value = ((date.getTime() - yearStart.getTime()) / total) * 100;
  return Math.min(100, Math.max(0, value));
};

const ConferenceTimelineRow = ({ row, yearStart, yearEnd }: ConferenceTimelineRowProps) => {
  const conferenceBar =
    row.conferenceStart && row.conferenceEnd
      ? {
          left: toPercent(row.conferenceStart < yearStart ? yearStart : row.conferenceStart, yearStart, yearEnd),
          right: toPercent(row.conferenceEnd > yearEnd ? yearEnd : row.conferenceEnd, yearStart, yearEnd),
        }
      : null;

  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-neutral-200 py-3 text-sm">
      <div>
        <p className="font-medium text-neutral-900">{row.title}</p>
        {row.selectedYear && row.selectedYear !== yearStart.getFullYear() && (
          <p className="text-xs text-neutral-500">Using {row.selectedYear} entry</p>
        )}
      </div>

      <div className="relative h-8 rounded bg-neutral-100">
        {conferenceBar && (
          <div
            className="absolute top-1.5 h-5 rounded bg-blue-500/60"
            style={{
              left: `${conferenceBar.left}%`,
              width: `${Math.max(conferenceBar.right - conferenceBar.left, 1)}%`,
            }}
            title={
              row.conferenceStart && row.conferenceEnd
                ? `Conference: ${format(row.conferenceStart, "MMM d")} - ${format(row.conferenceEnd, "MMM d")}`
                : undefined
            }
          />
        )}

        {row.historicalDeadlines.map((deadline, index) => (
          <span
            key={`${row.seriesKey}-history-${index}-${deadline.toISOString()}`}
            className="absolute top-3.5 h-2 w-2 -translate-x-1/2 rounded-full bg-red-400/40"
            style={{ left: `${toPercent(deadline, yearStart, yearEnd)}%` }}
            title={`Historical deadline: ${format(deadline, "yyyy MMM d")}`}
          />
        ))}

        {row.currentDeadline && (
          <span
            className="absolute top-2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-red-500 shadow"
            style={{ left: `${toPercent(row.currentDeadline, yearStart, yearEnd)}%` }}
            title={`Selected deadline: ${format(row.currentDeadline, "yyyy MMM d")}`}
          />
        )}
      </div>
    </div>
  );
};

export default ConferenceTimelineRow;
