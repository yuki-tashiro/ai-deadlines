import { TimelineSeriesRow } from "@/utils/conferenceTimeline";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDisplayDate, formatDisplayDateRange } from "@/utils/dateDisplay";
import { toPercent } from "@/utils/timelinePosition";

interface ConferenceTimelineRowProps {
  row: TimelineSeriesRow;
  rangeStart: Date;
  rangeEnd: Date;
  nowPercent: number;
  referenceYear: number;
}

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
            className="pointer-events-none absolute top-1/2 h-8 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-emerald-600/80"
            style={{ left: `${nowPercent}%` }}
          />

          {conferenceBar && (
            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `${conferenceBar.left}%`,
                width: `${Math.max(conferenceBar.right - conferenceBar.left, 1.2)}%`,
              }}
            >
              <span
                className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 shadow-sm ring-1 ring-blue-200"
              >
                {`Conference: ${formatDisplayDateRange(row.conferenceStart, row.conferenceEnd)}`}
              </span>
              <div
                className="h-2 w-full rounded-full bg-blue-500/65 shadow-sm ring-1 ring-blue-600/20"
                title={
                  row.conferenceStart && row.conferenceEnd
                    ? `Conference: ${formatDisplayDateRange(row.conferenceStart, row.conferenceEnd)}`
                    : undefined
                }
              />
            </div>
          )}

          <TooltipProvider>
            {row.historicalDeadlines.map((deadline, index) => (
              <Tooltip key={`${row.seriesKey}-history-${index}-${deadline.originalDate.toISOString()}`}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 appearance-none rounded-full border-0 bg-red-400/50 p-0"
                    style={{
                      left: `${toPercent(deadline.positionDate, rangeStart, rangeEnd)}%`,
                      top: "50%",
                    }}
                    aria-label={`${deadline.sourceYear} deadline`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{`${row.title} ${deadline.sourceYear} – ${formatDisplayDate(deadline.originalDate)}`}</p>
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
                title={`Deadline: ${formatDisplayDate(row.currentDeadline)}`}
              />
              <span
                className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-red-700 shadow-sm ring-1 ring-red-200"
              >
                {formatDisplayDate(row.currentDeadline)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConferenceTimelineRow;
