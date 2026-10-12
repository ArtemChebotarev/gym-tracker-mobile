// What the debug route (task 070) tells the user when an export fails (task 141.2; 08.0.2 ·
// Error handling). The cause is in the log; the screen says it in words the user can act on,
// not as the exception's own text.

import { SharingUnavailableError } from '@state/shareFile';

export const IMPORT_CONFIRM_TITLE = 'Restore this backup?';

/** What the confirmation says before a restore (task 123): which file, and what it will do. */
export function importConfirmMessage(fileName: string): string {
  return `${fileName} will be restored into this app. This only works in an app with no data of its own, and it can't be undone.`;
}

/** Task 124 gives each refusal its own words; until then every failure reads the same. */
export function importErrorMessage(): string {
  return 'Your data was not changed.';
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
