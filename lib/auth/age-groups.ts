export const ADULT_AGE_GROUPS = ["adult_18_64", "adult_19_64", "senior_65_plus"] as const;

export const AGE_GROUPS = [
  { label: "18 – 64", value: "adult_18_64" },
  { label: "65+", value: "senior_65_plus" },
] as const;

export function isAdultAgeGroup(value: string) {
  return ADULT_AGE_GROUPS.some((group) => group === value);
}
