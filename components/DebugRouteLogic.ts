// What the debug route (task 070) tells the user when an export fails (task 141.2; 08.0.2 ·
// Error handling). The cause is in the log; the screen says it in words the user can act on,
// not as the exception's own text.

import { BackupRefusedError } from '@domain/backup';
import { SharingUnavailableError } from '@state/shareFile';
import type { TimerCapsuleProps } from '@design/components/TimerCapsule';
import { HourglassIcon } from '@design/icons/HourglassIcon';

export const IMPORT_CONFIRM_TITLE = 'Restore this backup?';

/** What the confirmation says before a restore (task 123): which file, and what it will do. */
export function importConfirmMessage(fileName: string): string {
  return `${fileName} will be restored into this app. This only works in an app with no data of its own, and it can't be undone.`;
}

const NOT_CHANGED = 'Your data was not changed.';

/**
 * Why a restore was refused, in words the user can act on (task 124; 08.0.2 · Error handling).
 * Each rule that says no has its own text; anything else — a file that would not read, a failure
 * inside the restore itself — gets the general one, and the cause is in the log.
 */
export function importErrorMessage(error: Error): string {
  if (error instanceof BackupRefusedError) {
    switch (error.reason) {
      case 'different-version':
        return `This backup was made by a different version of the app. Restore it in the version that exported it. ${NOT_CHANGED}`;
      case 'has-user-data':
        return `This app already has data of its own, and a backup can only be restored into an empty one. Reinstall the app, then restore. ${NOT_CHANGED}`;
      case 'not-json':
      case 'not-a-backup':
      case 'no-data':
        return `This file isn't a Hybro backup, or it's damaged. Pick the file made by Export backup. ${NOT_CHANGED}`;
    }
  }
  return `Something went wrong while restoring. Try again. ${NOT_CHANGED}`;
}

export const IMPORT_SUCCESS_TITLE = 'Backup restored';
export const IMPORT_SUCCESS_MESSAGE = 'Your data is back in this app.';
export const IMPORT_ERROR_TITLE = "Couldn't restore this backup";

export function exportErrorMessage(error: Error, what: 'data' | 'log'): string {
  if (error instanceof SharingUnavailableError) {
    return "Sharing isn't available on this device.";
  }
  return `Couldn't export your ${what}. Try again.`;
}

/**
 * A made-up rest for the floating capsule (GT-85), so it can be looked at before the rest timer
 * (GT-86) drives it: Pause and Resume swap it between running and paused, Skip puts it away.
 */
export function demoTimerCapsule(
  state: 'running' | 'paused',
  actions: { show: (capsule: TimerCapsuleProps) => void; clear: () => void },
): TimerCapsuleProps {
  return {
    state,
    icon: HourglassIcon,
    title: '1:46',
    caption: state === 'paused' ? 'Paused · set 3 next' : 'Rest · set 3 next',
    progress: 0.88,
    onSkip: actions.clear,
    onPause: () => actions.show(demoTimerCapsule('paused', actions)),
    onResume: () => actions.show(demoTimerCapsule('running', actions)),
  };
}
