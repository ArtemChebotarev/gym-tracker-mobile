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

const MS_PER_SEC = 1000;

/**
 * Milliseconds until a countdown with `remainingMs` left next shows a different whole second — when
 * a timer should look at the clock again (Artem, 20.10.2026). Looking on a
 * fixed beat instead showed each second for anything from 0.75 s to 1.25 s, and the time moved in
 * jerks.
 */
export function msUntilSecondChanges(remainingMs: number): number {
  const fraction = remainingMs % MS_PER_SEC;
  return fraction > 0 ? fraction : MS_PER_SEC;
}
