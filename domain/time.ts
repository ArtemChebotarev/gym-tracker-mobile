export function nowAsUtcIso(): string {
  return new Date().toISOString();
}

export function parseUtcIso(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid UTC ISO timestamp: ${value}`);
  }
  return date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The UTC ISO instant exactly `days` × 24 hours before `iso`. */
export function daysBefore(iso: string, days: number): string {
  return new Date(parseUtcIso(iso).getTime() - days * MS_PER_DAY).toISOString();
}
