import { format, setMonth, startOfYear, endOfYear } from "date-fns";
import { TimelineSeriesRow } from "@/utils/conferenceTimeline";
import ConferenceTimelineRow from "@/components/ConferenceTimelineRow";

interface ConferenceTimelineProps {
  rows: TimelineSeriesRow[];
  selectedYear: number;
}

const ConferenceTimeline = ({ rows, selectedYear }: ConferenceTimelineProps) => {
  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
  const monthTicks = Array.from({ length: 12 }, (_, month) => setMonth(yearStart, month));

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[160px_1fr] gap-4 pb-2 text-xs text-neutral-500">
            <div>Conference</div>
            <div className="relative h-5">
              {monthTicks.map((tick) => (
                <span
                  key={tick.getMonth()}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${(tick.getMonth() / 11) * 100}%` }}
                >
                  {format(tick, "MMM")}
                </span>
              ))}
            </div>
          </div>

          <div>
            {rows.map((row) => (
              <ConferenceTimelineRow key={row.seriesKey} row={row} yearStart={yearStart} yearEnd={yearEnd} />
            ))}
            {rows.length === 0 && (
              <div className="py-8 text-center text-sm text-neutral-500">No conferences match current filters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConferenceTimeline;
