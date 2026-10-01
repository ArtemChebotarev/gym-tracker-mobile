import type { LogEntry } from '@domain/logging';
import { createFileLogSink, type LogFile } from '@storage/fileLogSink';

function memoryFile(): LogFile & { text: string; exists: boolean } {
  const file = {
    text: '',
    exists: false,
    size: () => file.text.length,
    append(text: string) {
      file.exists = true;
      file.text += text;
    },
    read: () => file.text,
    overwrite(text: string) {
      file.exists = true;
      file.text = text;
    },
    delete() {
      file.exists = false;
      file.text = '';
    },
  };
  return file;
}

const entry = (event: string): LogEntry => ({
  ts: '2026-10-01T10:00:00.000Z',
  level: 'error',
  event,
  appVersion: '1.0.0',
  sessionId: 's',
});

const lineLength = (event: string) => `${JSON.stringify(entry(event))}\n`.length;

describe('createFileLogSink', () => {
  test('writes one JSON object per line', () => {
    const current = memoryFile();
    const sink = createFileLogSink(current, memoryFile());

    sink.write(entry('a'));
    sink.write(entry('b'));

    const lines = current.text.trimEnd().split('\n');
    expect(lines.map((line) => JSON.parse(line).event)).toEqual(['a', 'b']);
  });

  test('starts a new file once the current one would outgrow the limit', () => {
    const current = memoryFile();
    const previous = memoryFile();
    const sink = createFileLogSink(current, previous, lineLength('a') * 2);

    sink.write(entry('a'));
    sink.write(entry('b'));
    sink.write(entry('c'));

    expect(previous.text).toContain('"event":"a"');
    expect(previous.text).toContain('"event":"b"');
    expect(current.text).toContain('"event":"c"');
    expect(current.text).not.toContain('"event":"a"');
  });

  test('drops the oldest file when the second rotation comes', () => {
    const current = memoryFile();
    const previous = memoryFile();
    const sink = createFileLogSink(current, previous, lineLength('a'));

    ['a', 'b', 'c'].forEach((event) => sink.write(entry(event)));

    expect(previous.text).toContain('"event":"b"');
    expect(previous.text).not.toContain('"event":"a"');
    expect(current.text).toContain('"event":"c"');
  });

  test('an entry bigger than the limit still gets written into an empty file', () => {
    const current = memoryFile();
    const sink = createFileLogSink(current, memoryFile(), 1);

    sink.write(entry('big'));

    expect(current.text).toContain('"event":"big"');
  });

  test('readAll gives the previous file and then the current one, oldest first', () => {
    const sink = createFileLogSink(memoryFile(), memoryFile(), lineLength('a'));

    ['a', 'b'].forEach((event) => sink.write(entry(event)));

    const events = sink
      .readAll()
      .trimEnd()
      .split('\n')
      .map((line) => JSON.parse(line).event);
    expect(events).toEqual(['a', 'b']);
  });

  test('readAll of a log nobody wrote to is empty', () => {
    expect(createFileLogSink(memoryFile(), memoryFile()).readAll()).toBe('');
  });
});
