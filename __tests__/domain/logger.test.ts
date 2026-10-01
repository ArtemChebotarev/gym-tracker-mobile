import { ConflictError, StorageUnavailableError } from '@domain/errors';
import { createLogger } from '@domain/logger';
import type { LogEntry, LogSink } from '@domain/logging';

function setup(sinks: LogSink[] = []) {
  const written: LogEntry[] = [];
  const collector: LogSink = { write: (entry) => written.push(entry) };
  const all = [collector, ...sinks];
  const logger = createLogger({
    appVersion: '1.0.0',
    sessionId: 'session-1',
    getSinks: () => all,
    now: () => '2026-10-01T10:00:00.000Z',
  });
  return { logger, written, all };
}

describe('createLogger', () => {
  test('report picks the level from what failed', () => {
    const { logger, written } = setup();

    logger.report('a', new ConflictError('dup'));
    logger.report('b', new StorageUnavailableError('down'));
    logger.report('c', new Error('boom'));

    expect(written.map((entry) => entry.level)).toEqual(['warn', 'error', 'error']);
  });

  test('error is an error whatever failed', () => {
    const { logger, written } = setup();

    logger.error('a', new ConflictError('dup'));

    expect(written[0]).toMatchObject({ level: 'error', errorKind: 'conflict' });
  });

  test('warn writes a business warning stamped with the run', () => {
    const { logger, written } = setup();

    logger.warn('x', { id: '1' });

    expect(written[0]).toEqual({
      appVersion: '1.0.0',
      sessionId: 'session-1',
      ts: '2026-10-01T10:00:00.000Z',
      level: 'warn',
      event: 'x',
      context: { id: '1' },
    });
  });

  test('a sink that throws neither breaks the caller nor starves the next sink', () => {
    const second: LogEntry[] = [];
    const broken: LogSink = {
      write: () => {
        throw new Error('disk full');
      },
    };
    const { logger, written, all } = setup([broken, { write: (entry) => second.push(entry) }]);

    expect(() => logger.error('x', new Error('boom'))).not.toThrow();

    expect(written).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(all).toHaveLength(3);
  });

  test('reads the sinks on every write, so one installed later still gets what follows', () => {
    const sinks: LogSink[] = [];
    const logger = createLogger({ appVersion: 'v', sessionId: 's', getSinks: () => sinks });
    logger.warn('before');
    const late: LogEntry[] = [];
    sinks.push({ write: (entry) => late.push(entry) });

    logger.warn('after');

    expect(late.map((entry) => entry.event)).toEqual(['after']);
  });
});
