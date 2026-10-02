import { logFileName } from '@state/useExportLogs';

describe('logFileName', () => {
  test('carries the date and a .json extension that previews open', () => {
    expect(logFileName(new Date('2026-10-01T23:30:00.000Z'))).toBe('hybro-log-2026-10-01.json');
  });
});
