// Pure helpers behind the Today tab (app/(tabs)/index.tsx, `TodayScreen`) — see the code-style
// skill; they live here because every file under app/ is a route.

import { PLAN_MESOCYCLE_LABEL } from '@components/MesocyclesScreenLogic';
import { CheckIcon } from '@design/icons/CheckIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { InfoIcon } from '@design/icons/InfoIcon';
import { TabTodayIcon } from '@design/icons/TabTodayIcon';

/**
 * The alert title when a set can't be logged because another session is `in_progress` (05,
 * "Жизненный цикл сессии").
 */
export function formatInProgressConflict(session: {
  weekNumber: number;
  dayNumber: number;
}): string {
  return `Finish Week ${session.weekNumber} Day ${session.dayNumber} first`;
}

/**
 * Why the Today tab has no session to show: no active mesocycle, the active one has nothing left
 * (`getTodayWorkout`, 099), or the session couldn't be loaded — a picked day that no longer exists.
 */
export type TodayEmptyReason = 'noActiveMesocycle' | 'allDone' | 'unavailable';

/**
 * The EmptyState for `reason` — an invitation, not an apology (08.0.1, "Empty states"). Without an
 * active cycle it invites planning one (08, "Сегодня") — through the same creation-method sheet
 * the `+` on 08.3 raises, since finished cycles may well exist to copy even when none is running;
 * with the cycle done it closes it (052 — the same Finish the last workout offers, so leaving that
 * screen isn't a dead end); otherwise it leads to the cycles.
 */
export function todayEmptyCopy(reason: TodayEmptyReason): {
  icon: IconComponent;
  title: string;
  description: string;
  actionLabel: string;
} {
  switch (reason) {
    case 'noActiveMesocycle':
      return {
        icon: TabTodayIcon,
        title: 'Start your next training cycle',
        description: 'Plan one and its workouts will show up here.',
        actionLabel: PLAN_MESOCYCLE_LABEL,
      };
    case 'allDone':
      return {
        icon: CheckIcon,
        title: 'Training cycle complete',
        description: 'Every workout is done. Finish it to move it to Completed.',
        actionLabel: 'Finish cycle',
      };
    case 'unavailable':
      return {
        icon: InfoIcon,
        title: 'Pick another workout',
        description: "This workout isn't available anymore. Choose another day to train.",
        actionLabel: 'Open cycles',
      };
  }
}

/**
 * The Finish mesocycle confirmation's message (052). Finishing loses nothing — it is the cycle
 * ending the way it was meant to — and the cycle is where the next one is copied from (04, Flow C),
 * so the confirmation says where it goes rather than warning.
 */
export const FINISH_MESOCYCLE_CONFIRMATION =
  "Every workout is done. The cycle moves to Completed — you can start the next one from any of its weeks.";
