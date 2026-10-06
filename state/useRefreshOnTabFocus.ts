// Switching to a tab reads its data again — the way the app treats a tab switch is "refresh"
// (GT-38). The tabs stay mounted behind each other, so without this a query is only re-read when
// something invalidates it: planning a cycle on the Cycles tab changed nothing on Today until the
// app was restarted, because the creation only invalidated the cycle list.
//
// Every query is invalidated rather than the focused tab's own: what one tab shows is derived from
// what another one writes (Today's state from the cycle list), and a list of "this tab's keys"
// would be one more thing to forget when a screen gains a query. Only queries someone is watching
// are read again, so it costs a few reads of the local database; the old data stays on screen
// until the new arrives, so nothing flickers.
//
// Handed to the tab navigator as `screenListeners`, which also fires when a screen pushed over
// the tabs (the cycle wizard) is closed and a tab comes back into focus.

import { useQueryClient } from '@tanstack/react-query';

export function useRefreshOnTabFocus() {
  const queryClient = useQueryClient();

  return {
    focus: () => {
      void queryClient.invalidateQueries();
    },
  };
}
