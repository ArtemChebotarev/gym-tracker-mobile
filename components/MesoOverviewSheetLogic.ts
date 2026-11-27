// Pure helpers behind components/MesoOverviewSheet.tsx — see the code-style skill.
//
// The cell helpers moved to MesoGridLogic.ts with the grid itself (task 127); the subtitle stays
// here because it is the sheet's, not the grid's.

import type { MesoGrid } from '@domain/mesoGrid';

import { formatMesocycleLengthValue } from './MesoEditorBasicsStepLogic';

/** The sheet's subtitle (08.7, "Лист «Обзор мезоцикла»"): `Week 6 of 7 · 4 days a week`. */
export function formatMesoOverviewSubtitle(
  grid: Pick<MesoGrid, 'currentWeekNumber' | 'lengthWeeks' | 'daysPerWeek'>,
): string {
  const days = grid.daysPerWeek === 1 ? '1 day' : `${grid.daysPerWeek} days`;
  return `Week ${grid.currentWeekNumber} of ${grid.lengthWeeks} · ${days} a week`;
}

/**
 * The caption under the sheet's Cycle length value (GT-240): how short the block may be made now,
 * or, once the deload has started, that the length is fixed.
 */
export function formatCycleLengthCaption(
  lengthWeeks: number,
  bounds: { min: number; max: number },
): string {
  if (bounds.min === lengthWeeks && bounds.max === lengthWeeks) {
    return 'The deload has started';
  }
  return `Shortest now: ${formatMesocycleLengthValue(bounds.min)}`;
}
