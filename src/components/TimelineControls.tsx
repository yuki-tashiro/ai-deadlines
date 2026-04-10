import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimelineSort } from "@/utils/conferenceTimeline";

interface TimelineControlsProps {
  sortBy: TimelineSort;
  onSortChange: (sort: TimelineSort) => void;
  selectedTags: Set<string>;
  tagOptions: string[];
  onToggleTag: (tag: string) => void;
}

const formatTag = (tag: string) =>
  tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const TimelineControls = ({
  sortBy,
  onSortChange,
  selectedTags,
  tagOptions,
  onToggleTag,
}: TimelineControlsProps) => {
  return (
    <div className="relative z-30 space-y-3 rounded-lg bg-white p-4 shadow">
      <div className="w-[220px]">
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as TimelineSort)}>
          <SelectTrigger className="bg-white shadow-sm border-neutral-300">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="z-[80] border-neutral-200 bg-white shadow-lg">
            <SelectItem value="upcoming-deadline">Upcoming deadline</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="conference-date">Conference date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {tagOptions.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTags.has(tag)
                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
            onClick={() => onToggleTag(tag)}
          >
            {formatTag(tag)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimelineControls;
