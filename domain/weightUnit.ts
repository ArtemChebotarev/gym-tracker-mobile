// The unit a weight is counted in (GT-269). A mesocycle is counted in one unit from end to end:
// its targets, its logged sets and its body weight are numbers in that unit, never converted. A
// kilogram is not stored and then shown as pounds — a conversion on every step would turn a
// 135 lb target into 134.9 and lose the plates a gym actually has.

export const WEIGHT_UNITS = ['kg', 'lb'] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];

/**
 * Every weight the app held before GT-269 was in kilograms, so a block or a setting that names no
 * unit is in kilograms.
 */
export const DEFAULT_WEIGHT_UNIT: WeightUnit = 'kg';
