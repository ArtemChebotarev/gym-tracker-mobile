import {
  demoTimerCapsule,
  exportErrorMessage,
  importConfirmMessage,
  importErrorMessage,
} from '@components/DebugRouteLogic';
import { BackupRefusedError, type BackupRefusal } from '@domain/backup';
import { SharingUnavailableError } from '@state/shareFile';

describe('exportErrorMessage', () => {
  test('says what to do instead of showing the exception', () => {
    expect(exportErrorMessage(new Error('EACCES: permission denied'), 'data')).toBe(
      "Couldn't export your data. Try again.",
    );
    expect(exportErrorMessage(new Error('x'), 'log')).toBe("Couldn't export your log. Try again.");
  });

  test('a device without a share sheet gets its own words, since trying again will not help', () => {
    expect(exportErrorMessage(new SharingUnavailableError(), 'data')).toBe(
      "Sharing isn't available on this device.",
    );
  });
});

describe('importConfirmMessage', () => {
  test('names the file and says it cannot be undone', () => {
    const message = importConfirmMessage('hybro-backup-2026-10-12.json');

    expect(message).toContain('hybro-backup-2026-10-12.json');
    expect(message).toContain("can't be undone");
  });
});

describe('importErrorMessage', () => {
  const refused = (reason: BackupRefusal) =>
    importErrorMessage(new BackupRefusedError(reason, 'x'));

  test('every refusal has its own words, and says the data was not touched', () => {
    const different = refused('different-version');
    const present = refused('has-user-data');
    const broken = refused('not-a-backup');

    expect(new Set([different, present, broken]).size).toBe(3);
    expect(different).toMatch(/different version/);
    expect(present).toMatch(/Reinstall the app/);
    for (const message of [different, present, broken]) {
      expect(message).toMatch(/Your data was not changed\.$/);
    }
  });

  test('a file that is not JSON, not a backup, or empty reads as the same broken file', () => {
    expect(refused('not-json')).toBe(refused('not-a-backup'));
    expect(refused('no-data')).toBe(refused('not-a-backup'));
  });

  test('anything else gets the general text rather than the exception', () => {
    expect(importErrorMessage(new Error('SQLITE_IOERR'))).toBe(
      'Something went wrong while restoring. Try again. Your data was not changed.',
    );
  });
});

describe('demoTimerCapsule', () => {
  test('Pause and Resume swap it between running and paused, Skip puts it away', () => {
    const show = jest.fn();
    const clear = jest.fn();
    const running = demoTimerCapsule('running', { show, clear });

    expect(running.state).toBe('running');
    running.onPause?.();
    expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'paused' }));
    running.onResume?.();
    expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'running' }));
    running.onSkip?.();
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
