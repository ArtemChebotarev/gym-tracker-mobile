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
