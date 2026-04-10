import { format } from "date-fns";
import { TimelineSeriesRow } from "@/utils/conferenceTimeline";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConferenceTimelineRowProps {
  row: TimelineSeriesRow;
  rangeStart: Date;
  rangeEnd: Date;
  nowPercent: number;
  referenceYear: number;
}

const toPercent = (date: Date, rangeStart: Date, rangeEnd: Date) => {
  const total = rangeEnd.getTime() - rangeStart.getTime();
  if (total <= 0) return 0;
  const value = ((date.getTime() - rangeStart.getTime()) / total) * 100;
  return Math.min(100, Math.max(0, value));
};

const ConferenceTimelineRow = ({ row, rangeStart, rangeEnd, nowPercent, referenceYear }: ConferenceTimelineRowProps) => {
  const conferenceBar =
    row.conferenceStart && row.conferenceEnd
      ? {
          left: toPercent(row.conferenceStart < rangeStart ? rangeStart : row.conferenceStart, rangeStart, rangeEnd),
          right: toPercent(row.conferenceEnd > rangeEnd ? rangeEnd : row.conferenceEnd, rangeStart, rangeEnd),
        }
      : null;

  return (
    <div className="contents text-sm">
      <div className="sticky left-0 z-10 border-b border-neutral-200 bg-white py-3 pr-3">
        <p className="font-medium text-neutral-900">{row.title}</p>
        {row.referenceYear && row.referenceYear !== referenceYear && (
          <p className="text-xs text-neutral-500">Using {row.referenceYear} entry</p>
        )}
      </div>

      <div className="relative border-b border-neutral-200 py-3">
        <div className="relative h-12 rounded bg-neutral-100">
          <div
            className="pointer-events-none absolute top-0 h-8 w-[2px] -translate-x-1/2 bg-emerald-600/80"
            style={{ left: `${nowPercent}%` }}
          />

          {conferenceBar && (
            <div
              className="absolute top-1.5 h-5 rounded bg-blue-500/60"
              style={{
                left: `${conferenceBar.left}%`,
                width: `${Math.max(conferenceBar.right - conferenceBar.left, 1)}%`,
              }}
              title={
                row.conferenceStart && row.conferenceEnd
                  ? `Conference: ${format(row.conferenceStart, "yyyy-MM-dd")} - ${format(row.conferenceEnd, "yyyy-MM-dd")}`
                  : undefined
              }
            />
          )}

          <TooltipProvider>
            {row.historicalDeadlines.map((deadline, index) => (
              <Tooltip key={`${row.seriesKey}-history-${index}-${deadline.originalDate.toISOString()}`}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 appearance-none rounded-full border-0 bg-red-400/50 p-0"
                    style={{ left: `${toPercent(deadline.positionDate, rangeStart, rangeEnd)}%` }}
                    aria-label={`${deadline.sourceYear} deadline`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{`${deadline.sourceYear} deadline: ${format(deadline.originalDate, "yyyy-MM-dd")}`}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>

          {row.currentDeadline && (
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${toPercent(row.currentDeadline, rangeStart, rangeEnd)}%` }}
            >
              <span
                className="block h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow"
                title={`Reference deadline: ${format(row.currentDeadline, "yyyy-MM-dd")}`}
              />
              <span
                className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-red-700 shadow-sm ring-1 ring-red-200"
              >
                {format(row.currentDeadline, "yyyy-MM-dd")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConferenceTimelineRow;
