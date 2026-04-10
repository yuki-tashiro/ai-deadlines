import Header from "@/components/Header";
import ConferenceTimeline from "@/components/ConferenceTimeline";
import TimelineControls from "@/components/TimelineControls";
import TimelineLegend from "@/components/TimelineLegend";
import conferencesData from "@/utils/conferenceLoader";
import { Conference } from "@/types/conference";
import { TimelineSort, buildConferenceTimelineRows } from "@/utils/conferenceTimeline";
import { useMemo, useState } from "react";

const TimelinePage = () => {
  const currentYear = new Date().getFullYear();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sortBy, setSortBy] = useState<TimelineSort>("upcoming-deadline");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const allYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    (conferencesData as Conference[]).forEach((conf) => years.add(conf.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [currentYear]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    (conferencesData as Conference[]).forEach((conf) => {
      (conf.tags || []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, []);

  const timelineRows = useMemo(() => {
    return buildConferenceTimelineRows(
      conferencesData as Conference[],
      selectedYear,
      selectedTags,
      searchQuery,
      sortBy,
    );
  }, [selectedYear, selectedTags, searchQuery, sortBy]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      <Header onSearch={setSearchQuery} />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <TimelineControls
          selectedYear={selectedYear}
          availableYears={allYears}
          sortBy={sortBy}
          onYearChange={setSelectedYear}
          onSortChange={setSortBy}
          selectedTags={selectedTags}
          tagOptions={tagOptions}
          onToggleTag={handleToggleTag}
        />
        <TimelineLegend />
        <ConferenceTimeline rows={timelineRows} selectedYear={selectedYear} />
      </div>
    </div>
  );
};

export default TimelinePage;
