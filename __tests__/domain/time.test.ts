import { nowAsUtcIso, parseUtcIso } from '@domain/time';

const UTC_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const TIMEZONES = ['UTC', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Kathmandu'];

describe('nowAsUtcIso', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  test.each(TIMEZONES)('returns a UTC ISO string regardless of local timezone (%s)', (tz) => {
    process.env.TZ = tz;
    const knownInstantMs = Date.UTC(2026, 0, 15, 12, 30, 45, 678);
    jest.useFakeTimers().setSystemTime(knownInstantMs);

    expect(nowAsUtcIso()).toBe('2026-01-15T12:30:45.678Z');

    jest.useRealTimers();
  });

  test.each(TIMEZONES)('matches the UTC ISO format (%s)', (tz) => {
    process.env.TZ = tz;
    expect(nowAsUtcIso()).toMatch(UTC_ISO_PATTERN);
  });
});

describe('parseUtcIso', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  test.each(TIMEZONES)('round-trips to the same instant regardless of local timezone (%s)', (tz) => {
    process.env.TZ = tz;
    const iso = '2026-01-15T12:30:45.678Z';

    const parsed = parseUtcIso(iso);

    expect(parsed.getTime()).toBe(Date.UTC(2026, 0, 15, 12, 30, 45, 678));
    expect(parsed.toISOString()).toBe(iso);
  });

  test('throws on an invalid timestamp', () => {
    expect(() => parseUtcIso('not-a-date')).toThrow();
  });
});
