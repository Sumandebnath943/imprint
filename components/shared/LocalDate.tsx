"use client";

import { useHydrated } from "@/hooks/useHydrated";

export default function LocalDate({ value, locale, options }: {
  value: string;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const hydrated = useHydrated();
  const date = new Date(value);
  const label = hydrated
    ? date.toLocaleDateString(locale, options)
    : date.toLocaleDateString(locale ?? "en-GB", { ...options, timeZone: options?.timeZone ?? "UTC" });
  return <time dateTime={value}>{label}</time>;
}
