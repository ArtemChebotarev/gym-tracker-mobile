// Pure, non-JSX logic behind ExerciseHistoryTab.tsx — see the code-style skill.

import type { ExerciseHistoryMesocycle, ExerciseHistorySession } from '@domain/exerciseHistory';
import { parseUtcIso } from '@domain/time';
import { formatAbsoluteDate } from '@design/formatDate';

/** One SectionList section: a mesocycle and the sessions of it, newest first. */
export type ExerciseHistorySection = {
  mesoId: string;
  title: string;
  data: ExerciseHistorySession[];
};

export function buildHistorySections(
  groups: readonly ExerciseHistoryMesocycle[],
): ExerciseHistorySection[] {
  return groups.map((group) => ({
    mesoId: group.mesoId,
    title: group.name,
    data: group.sessions,
  }));
}

/**
 * A session's card label — `Week 3 · Day 1`. The date goes in the card's meta beside it rather
 * than into this line: the mesocycle's own name is already the section header above, so week and
 * day are what tells one card from another.
 */
export function formatHistorySessionLabel(session: ExerciseHistorySession): string {
  return `Week ${session.weekNumber} · Day ${session.dayNumber}`;
}

/** The right-hand side of that card's label row — `10 Aug`. */
export function formatHistorySessionDate(session: ExerciseHistorySession): string {
  return formatAbsoluteDate(parseUtcIso(session.completedAt));
}
