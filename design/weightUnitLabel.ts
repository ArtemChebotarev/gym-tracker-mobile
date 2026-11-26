// Weight unit display labels (GT-269) — the one place a unit becomes what a picker shows. A
// `Record<WeightUnit, T>` like design/equipmentLabel.ts, so a new unit fails to compile here until
// it is given a label. Weights themselves print the bare unit (`80 kg × 8`); a picker names it.

import { WEIGHT_UNITS, type WeightUnit } from '@domain/weightUnit';

const LABEL_BY_WEIGHT_UNIT: Record<WeightUnit, string> = {
  kg: 'Kilograms (kg)',
  lb: 'Pounds (lb)',
};

export function getWeightUnitLabel(unit: WeightUnit): string {
  return LABEL_BY_WEIGHT_UNIT[unit];
}

/** The options of a unit picker, in `WEIGHT_UNITS` order. */
export const WEIGHT_UNIT_OPTIONS = WEIGHT_UNITS.map((unit) => ({
  value: unit,
  label: getWeightUnitLabel(unit),
}));
