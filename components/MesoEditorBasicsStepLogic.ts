// Pure, non-JSX logic behind MesoEditorBasicsStep.tsx — see the code-style skill, "Screens keep
// the same split, one level up". `canContinueFromBasics` is used by the route
// (app/meso-editor/new.tsx) to gate the shared footer's Continue button, not by this step's own
// content component.

import {
  validateMesocycleDaysPerWeek,
  validateMesocycleLengthWeeks,
} from '@domain/mesocycleValidators';

/**
 * Gates the Continue button (task 075 DoD: "Continue заблокирован при пустом Name") — reuses
 * the 015 validators so the same 3..8 / 1..7 bounds gate the button as gate the domain model,
 * rather than a second hand-copied range check.
 */
export function canContinueFromBasics(name: string, lengthWeeks: number, daysPerWeek: number): boolean {
  if (name.trim().length === 0) {
    return false;
  }
  try {
    validateMesocycleLengthWeeks(lengthWeeks);
    validateMesocycleDaysPerWeek(daysPerWeek);
    return true;
  } catch {
    return false;
  }
}

/** Mockup (01-new-meso-basics.html): the Mesocycle length stepper shows "6 weeks", not "6". */
export function formatMesocycleLengthValue(lengthWeeks: number): string {
  return `${lengthWeeks} ${lengthWeeks === 1 ? 'week' : 'weeks'}`;
}

/** Mockup (01-new-meso-basics.html): the Days per week stepper shows "4 days", not "4". */
export function formatDaysPerWeekValue(daysPerWeek: number): string {
  return `${daysPerWeek} ${daysPerWeek === 1 ? 'day' : 'days'}`;
}
