/**
 * Deterministic formatters for values rendered during SSR.
 *
 * `toLocaleDateString()` and `toLocaleString()` with no arguments use the
 * host's locale and timezone. The server and the browser rarely agree, so a
 * date rendered inline produced "4/9/2026" on the server and "9/4/2026" in the
 * client — a hydration mismatch that makes React discard the server-rendered
 * tree and re-render the whole branch.
 *
 * Pinning both the locale and the timezone makes the two renders identical.
 * Use these anywhere a date or a large number is rendered directly; inside an
 * event handler or an effect, the host locale is fine and preferable.
 */

const LOCALE = "en-US";
const TZ = "UTC";

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Sep 3, 2026" */
export function formatDate(value: DateInput, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  });
}

/** "September 3, 2026" */
export function formatDateLong(value: DateInput, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  });
}

/** "1,234" */
export function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString(LOCALE);
}
