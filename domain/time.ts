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
