// What the debug route (task 070) tells the user when an export fails (task 141.2; 08.0.2 ·
// Error handling). The cause is in the log; the screen says it in words the user can act on,
// not as the exception's own text.

import { SharingUnavailableError } from '@state/shareFile';

export function exportErrorMessage(error: Error, what: 'data' | 'log'): string {
  if (error instanceof SharingUnavailableError) {
    return "Sharing isn't available on this device.";
  }
  return `Couldn't export your ${what}. Try again.`;
}
