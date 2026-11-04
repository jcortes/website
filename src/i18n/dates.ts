import type { Locale } from "./ui";

/**
 * "2021-10" → "Oct 2021", "2011" → "2011". Month names are capitalized in
 * every locale so that dates read the same as in a CV ("May 2026").
 */
export function formatYearMonth(locale: Locale, value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!month) return String(year);
  const name = new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  }).format(Date.UTC(year!, month - 1));
  return `${name.charAt(0).toLocaleUpperCase(locale)}${name.slice(1)} ${year}`;
}

/** One end of a period: a date (with its machine-readable value) or "present". */
export interface PeriodBound {
  label: string;
  /** For `<time datetime>`; absent for "present". */
  datetime?: string;
}

/**
 * The bounds to show for a period: start and end, start and `present` (the
 * localized word) while ongoing, or just the start when both are the same.
 * The About page and the CV PDF both use it, so they always agree.
 */
export function periodBounds(
  locale: Locale,
  period: { start: string; end?: string },
  present: string,
): PeriodBound[] {
  const start = {
    label: formatYearMonth(locale, period.start),
    datetime: period.start,
  };
  if (period.end === period.start) return [start];
  const end = period.end
    ? { label: formatYearMonth(locale, period.end), datetime: period.end }
    : { label: present };
  return [start, end];
}

/** "Oct 2021 – May 2026", "May 2026 – present" or "2007". */
export function formatPeriod(
  locale: Locale,
  period: { start: string; end?: string },
  present: string,
): string {
  return periodBounds(locale, period, present)
    .map((bound) => bound.label)
    .join(" – ");
}
