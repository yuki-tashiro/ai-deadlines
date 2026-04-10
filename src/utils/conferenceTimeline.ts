import { Conference, Deadline } from "@/types/conference";
import { getAllDeadlines } from "@/utils/deadlineUtils";
import { getDeadlineInLocalTime } from "@/utils/dateUtils";
import { isValid, parseISO, setYear } from "date-fns";

export type TimelineSort = "upcoming-deadline" | "alphabetical" | "conference-date";

export interface TimelineSeriesRow {
  seriesKey: string;
  title: string;
  tags: string[];
  referenceEntry: Conference | null;
  referenceYear: number | null;
  currentDeadline: Date | null;
  historicalDeadlines: TimelineHistoricalDeadline[];
  conferenceStart: Date | null;
  conferenceEnd: Date | null;
}

export interface TimelineHistoricalDeadline {
  sourceYear: number;
  originalDate: Date;
  positionDate: Date;
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

function stripTrailingYear(value: string): string {
  return value.replace(/\s*(?:\(|-|_)?(?:19|20)\d{2}\)?\s*$/i, "").trim();
}

function baseIdWithoutYear(id: string): string {
  return id.toLowerCase().replace(/([_-]?20\d{2}|[_-]?\d{2})$/, "");
}

function getSeriesKey(conf: Conference): string {
  const idBase = conf.id ? baseIdWithoutYear(conf.id) : "";
  const fullNameBase = conf.full_name ? normalizeText(stripTrailingYear(conf.full_name)) : "";
  const titleBase = normalizeText(stripTrailingYear(conf.title));
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

  if (datedDeadlines.length === 0) return null;

  const submissionLike = datedDeadlines.filter(({ raw }) => {
    const type = raw.type.toLowerCase();
    const label = raw.label.toLowerCase();
    return SUBMISSION_HINTS.some((hint) => type.includes(hint) || label.includes(hint));
  });
  if (submissionLike.length > 0) return submissionLike[0].parsed;

  const mainFallback = datedDeadlines.find(({ raw }) => !NON_MAIN_DEADLINE_TYPES.has(raw.type.toLowerCase()));
  if (mainFallback) return mainFallback.parsed;

  return datedDeadlines[0].parsed;
}

function chooseReferenceEntry(entries: Conference[], referenceYear: number): Conference | null {
  const sorted = [...entries].sort((a, b) => a.year - b.year);
  const exact = sorted.find((entry) => entry.year === referenceYear);
  if (exact) return exact;

  const nextFuture = sorted.find((entry) => entry.year > referenceYear);
  if (nextFuture) return nextFuture;

  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}

function mapMonthDayToYear(date: Date, year: number): Date {
  // Show historical variation as month/day points on one shared yearly position.
  const mapped = setYear(date, year);

  if (mapped.getMonth() !== date.getMonth()) {
    return new Date(year, date.getMonth() + 1, 0, date.getHours(), date.getMinutes(), date.getSeconds());
  }

  return mapped;
}

export function buildConferenceTimelineRows(
  conferences: Conference[],
  referenceDate: Date,
  selectedTags: Set<string>,
  searchQuery: string,
  sortBy: TimelineSort,
): TimelineSeriesRow[] {
  const referenceYear = referenceDate.getFullYear();

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
      const chosenEntry = chooseReferenceEntry(series.entries, referenceYear);
      const chosenYear = chosenEntry?.year ?? null;

      const currentDeadline = chosenEntry ? pickRepresentativeDeadline(chosenEntry) : null;
      const conferenceStart = chosenEntry ? parseConferenceDate(chosenEntry.start) : null;
      const conferenceEnd = chosenEntry ? parseConferenceDate(chosenEntry.end) : null;

      const historicalDeadlines = series.entries
        .filter((entry) => entry.year >= referenceYear - 5 && entry.year < referenceYear)
        .map((entry) => {
          const historicalDeadline = pickRepresentativeDeadline(entry);
          if (!historicalDeadline) return null;

          return {
            sourceYear: entry.year,
            originalDate: historicalDeadline,
            positionDate: mapMonthDayToYear(historicalDeadline, referenceYear),
          };
        })
        .filter((deadline): deadline is TimelineHistoricalDeadline => deadline !== null)
        .sort((a, b) => a.sourceYear - b.sourceYear || a.positionDate.getTime() - b.positionDate.getTime());

      return {
        seriesKey: series.key,
        title: series.title,
        tags: Array.from(series.tags),
        referenceEntry: chosenEntry,
        referenceYear: chosenYear,
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

    // Rows with deadlines come first. Inside that group, show farther-future first,
    // then move toward already-passed dates to improve scanability.
    const aHasDeadline = a.currentDeadline !== null;
    const bHasDeadline = b.currentDeadline !== null;
    if (aHasDeadline !== bHasDeadline) return aHasDeadline ? -1 : 1;

    const aTime = a.currentDeadline?.getTime() ?? Number.NEGATIVE_INFINITY;
    const bTime = b.currentDeadline?.getTime() ?? Number.NEGATIVE_INFINITY;
    return bTime - aTime || a.title.localeCompare(b.title);
  });
}
