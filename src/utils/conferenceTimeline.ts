import { Conference, Deadline } from "@/types/conference";
import { getAllDeadlines } from "@/utils/deadlineUtils";
import { getDeadlineInLocalTime } from "@/utils/dateUtils";
import { isValid, parseISO } from "date-fns";

export type TimelineSort = "upcoming-deadline" | "alphabetical" | "conference-date";

export interface TimelineSeriesRow {
  seriesKey: string;
  title: string;
  tags: string[];
  selectedYearEntry: Conference | null;
  selectedYear: number | null;
  currentDeadline: Date | null;
  historicalDeadlines: Date[];
  conferenceStart: Date | null;
  conferenceEnd: Date | null;
}

interface TimelineSeriesInternal {
  key: string;
  title: string;
  tags: Set<string>;
  entries: Conference[];
}

const NON_MAIN_DEADLINE_TYPES = new Set([
  "abstract",
  "supplementary",
  "notification",
  "camera_ready",
  "commitment",
  "review_release",
  "rebuttal_start",
  "rebuttal_end",
  "final_decision",
]);

const SUBMISSION_HINTS = ["submission", "paper", "manuscript", "full paper"];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function baseIdWithoutYear(id: string): string {
  return id.toLowerCase().replace(/([_-]?20\d{2}|[_-]?\d{2})$/, "");
}

function getSeriesKey(conf: Conference): string {
  const idBase = conf.id ? baseIdWithoutYear(conf.id) : "";
  const fullNameBase = conf.full_name ? normalizeText(conf.full_name) : "";
  const titleBase = normalizeText(conf.title);

  return idBase || fullNameBase || titleBase;
}

function parseConferenceDate(dateString?: string): Date | null {
  if (!dateString || dateString === "TBD") return null;
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : null;
}

function toDatedDeadline(deadline: Deadline, conf: Conference): { raw: Deadline; parsed: Date } | null {
  const parsed = getDeadlineInLocalTime(deadline.date, deadline.timezone || conf.timezone);
  if (!parsed || !isValid(parsed)) return null;
  return { raw: deadline, parsed };
}

function pickRepresentativeDeadline(conf: Conference): Date | null {
  const datedDeadlines = getAllDeadlines(conf)
    .map((deadline) => toDatedDeadline(deadline, conf))
    .filter((entry): entry is { raw: Deadline; parsed: Date } => entry !== null)
    .sort((a, b) => a.parsed.getTime() - b.parsed.getTime());

  if (datedDeadlines.length === 0) {
    return null;
  }

  const submissionLike = datedDeadlines.filter(({ raw }) => {
    const type = raw.type.toLowerCase();
    const label = raw.label.toLowerCase();
    return SUBMISSION_HINTS.some((hint) => type.includes(hint) || label.includes(hint));
  });

  if (submissionLike.length > 0) {
    return submissionLike[0].parsed;
  }

  const mainFallback = datedDeadlines.find(({ raw }) => !NON_MAIN_DEADLINE_TYPES.has(raw.type.toLowerCase()));
  if (mainFallback) {
    return mainFallback.parsed;
  }

  return datedDeadlines[0].parsed;
}

function chooseSelectedYearEntry(entries: Conference[], selectedYear: number): Conference | null {
  const sorted = [...entries].sort((a, b) => a.year - b.year);
  const exact = sorted.find((entry) => entry.year === selectedYear);
  if (exact) return exact;

  // Deterministic fallback: nearest future year first, otherwise the latest past year.
  const nextFuture = sorted.find((entry) => entry.year > selectedYear);
  if (nextFuture) return nextFuture;

  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}

export function buildConferenceTimelineRows(
  conferences: Conference[],
  selectedYear: number,
  selectedTags: Set<string>,
  searchQuery: string,
  sortBy: TimelineSort,
): TimelineSeriesRow[] {
  const grouped = conferences.reduce<Map<string, TimelineSeriesInternal>>((acc, conf) => {
    const key = getSeriesKey(conf);
    const existing = acc.get(key);

    if (!existing) {
      acc.set(key, {
        key,
        title: conf.title,
        tags: new Set(conf.tags || []),
        entries: [conf],
      });
      return acc;
    }

    existing.entries.push(conf);
    (conf.tags || []).forEach((tag) => existing.tags.add(tag));
    return acc;
  }, new Map());

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const rows = Array.from(grouped.values())
    .filter((series) => {
      if (selectedTags.size > 0) {
        const hasTag = Array.from(series.tags).some((tag) => selectedTags.has(tag));
        if (!hasTag) return false;
      }

      if (!normalizedSearch) return true;

      return (
        series.title.toLowerCase().includes(normalizedSearch) ||
        series.entries.some((entry) => (entry.full_name || "").toLowerCase().includes(normalizedSearch))
      );
    })
    .map<TimelineSeriesRow>((series) => {
      const chosenEntry = chooseSelectedYearEntry(series.entries, selectedYear);
      const currentDeadline = chosenEntry ? pickRepresentativeDeadline(chosenEntry) : null;
      const conferenceStart = chosenEntry ? parseConferenceDate(chosenEntry.start) : null;
      const conferenceEnd = chosenEntry ? parseConferenceDate(chosenEntry.end) : null;

      const historicalDeadlines = series.entries
        .filter((entry) => entry.year >= selectedYear - 5 && entry.year < selectedYear)
        .map((entry) => pickRepresentativeDeadline(entry))
        .filter((date): date is Date => date !== null)
        .sort((a, b) => a.getTime() - b.getTime());

      return {
        seriesKey: series.key,
        title: series.title,
        tags: Array.from(series.tags),
        selectedYearEntry: chosenEntry,
        selectedYear: chosenEntry?.year ?? null,
        currentDeadline,
        historicalDeadlines,
        conferenceStart,
        conferenceEnd,
      };
    });

  return rows.sort((a, b) => {
    if (sortBy === "alphabetical") {
      return a.title.localeCompare(b.title);
    }

    if (sortBy === "conference-date") {
      const aTime = a.conferenceStart?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.conferenceStart?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime || a.title.localeCompare(b.title);
    }

    const aTime = a.currentDeadline?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.currentDeadline?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aTime - bTime || a.title.localeCompare(b.title);
  });
}
