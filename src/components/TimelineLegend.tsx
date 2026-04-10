const TimelineLegend = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span>Reference year deadline</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-400/50" />
        <span>Past 5 years (hover to see year/date)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-8 rounded bg-blue-500/60" />
        <span>Conference date range</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded bg-white px-1 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200">yyyy-mm-dd</span>
        <span>Main deadline label (always visible)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-4 w-[2px] bg-emerald-600" />
        <span>Now (AoE)</span>
      </div>
    </div>
  );
};

export default TimelineLegend;
