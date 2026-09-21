// Pure helpers behind the Today tab (app/(tabs)/index.tsx, `TodayScreen`) — see the code-style
// skill; they live here because every file under app/ is a route.

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
 * The EmptyState copy for `reason` — an invitation, not an apology (08.0, "EmptyState"). Without an
 * active mesocycle it invites creating one (08, "Сегодня"); with the block done it closes it (052 —
 * the same Finish the last workout offers, so leaving that screen isn't a dead end); otherwise it
 * leads to the mesocycles.
 */
export function todayEmptyCopy(reason: TodayEmptyReason): {
  title: string;
  description: string;
  actionLabel: string;
} {
  switch (reason) {
    case 'noActiveMesocycle':
      return {
        title: 'Plan your training block',
        description: 'Create a mesocycle and start it — its workouts show up here.',
        actionLabel: 'Create mesocycle',
      };
    case 'allDone':
      return {
        title: 'Block complete',
        description: 'Every workout of this mesocycle is done. Finish it to close the block.',
        actionLabel: 'Finish mesocycle',
      };
    case 'unavailable':
      return {
        title: 'Pick another workout',
        description: "This workout isn't available anymore. Choose another day to train.",
        actionLabel: 'Open mesocycles',
      };
  }
}

/**
 * The Finish mesocycle confirmation's message (052). Finishing loses nothing — it is the block
 * ending the way it was meant to — but it can't be taken back, and the block is where the next one
 * is copied from (04, Flow C), so the confirmation says where it goes rather than warning.
 */
export const FINISH_MESOCYCLE_CONFIRMATION =
  "Every workout is done. The block moves to Completed, with all of it kept — you can start the next one from any of its weeks. This can't be undone.";
