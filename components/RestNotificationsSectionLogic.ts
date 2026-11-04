// Which face the `Notifications` section of Settings shows (GT-219): the accent plate while
// notifications are off, the quiet row once its cross has put it away, and the row saying they are on.

import type { NotificationStatus } from '@state/restSignal';

export type RestNotificationsView = 'plate' | 'off' | 'on';

export function restNotificationsView(
  status: NotificationStatus,
  plateHidden: boolean,
): RestNotificationsView {
  if (status === 'granted') {
    return 'on';
  }
  return plateHidden ? 'off' : 'plate';
}
