// Pure, non-JSX logic behind MesoEditorBasicsScreen.tsx — see the code-style skill, "Screens
// keep the same split, one level up".

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
