import { ConflictError, NotFoundError, StorageUnavailableError } from '@domain/errors';
import {
  buildFailureEntry,
  buildWarningEntry,
  logLinesToJsonArray,
  errorKindOf,
  levelOfErrorKind,
  MAX_LOG_MESSAGE_LENGTH,
} from '@domain/loggingBuilders';

const META = { appVersion: '1.0.0', sessionId: 'session-1', ts: '2026-10-01T10:00:00.000Z' };

describe('errorKindOf', () => {
  test.each([
    [new StorageUnavailableError('down'), 'storage-unavailable'],
    [new ConflictError('dup'), 'conflict'],
    [new NotFoundError('gone'), 'not-found'],
    [new Error('boom'), 'unknown'],
    ['a string', 'unknown'],
  ])('%p is %s', (error, kind) => {
    expect(errorKindOf(error)).toBe(kind);
  });
});

describe('levelOfErrorKind', () => {
  test('the errors the app expects are warnings, everything else is an error', () => {
    expect(levelOfErrorKind('conflict')).toBe('warn');
    expect(levelOfErrorKind('not-found')).toBe('warn');
    expect(levelOfErrorKind('storage-unavailable')).toBe('error');
    expect(levelOfErrorKind('unknown')).toBe('error');
  });
});

describe('buildFailureEntry', () => {
  test('carries the event, the kind, the message and the run it belongs to', () => {
    const entry = buildFailureEntry('error', 'mutation.startMesocycle', new Error('boom'), META, {
      mesocycleId: 'm1',
    });

    expect(entry).toEqual({
      ...META,
      level: 'error',
      event: 'mutation.startMesocycle',
      errorKind: 'unknown',
      message: 'boom',
      context: { mesocycleId: 'm1' },
    });
  });

  test('keeps the failure an adapter normalized away', () => {
    const entry = buildFailureEntry(
      'error',
      'e',
      new ConflictError('conflict', { cause: new Error('UNIQUE constraint failed') }),
      META,
    );

    expect(entry.cause).toBe('UNIQUE constraint failed');
  });

  test('cuts a message that would fill the file on its own', () => {
    const entry = buildFailureEntry(
      'error',
      'e',
      new Error('x'.repeat(MAX_LOG_MESSAGE_LENGTH + 50)),
      META,
    );

    expect(entry.message).toHaveLength(MAX_LOG_MESSAGE_LENGTH + 1);
    expect(entry.message?.endsWith('…')).toBe(true);
  });

  test('describes something that is not an Error by its text', () => {
    expect(buildFailureEntry('error', 'e', 'plain', META).message).toBe('plain');
  });

  test('has no context key when there is none', () => {
    expect('context' in buildFailureEntry('error', 'e', new Error('x'), META)).toBe(false);
  });
});

describe('buildWarningEntry', () => {
  test('is a warning without an error', () => {
    expect(buildWarningEntry('session.notFound', META, { sessionId: 's1' })).toEqual({
      ...META,
      level: 'warn',
      event: 'session.notFound',
      context: { sessionId: 's1' },
    });
  });
});

describe('logLinesToJsonArray', () => {
  test('turns JSON Lines into one valid JSON array, oldest first', () => {
    const lines = `${JSON.stringify({ event: 'a' })}\n${JSON.stringify({ event: 'b' })}\n`;

    expect(JSON.parse(logLinesToJsonArray(lines))).toEqual([{ event: 'a' }, { event: 'b' }]);
  });

  test('skips a line cut off by a crash and keeps the rest', () => {
    const lines = `${JSON.stringify({ event: 'a' })}\n{"event":"b","mess`;

    expect(JSON.parse(logLinesToJsonArray(lines))).toEqual([{ event: 'a' }]);
  });

  test('an empty log is an empty array', () => {
    expect(JSON.parse(logLinesToJsonArray(''))).toEqual([]);
  });
});
