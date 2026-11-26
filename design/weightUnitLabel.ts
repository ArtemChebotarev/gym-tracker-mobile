// The weight unit picker's options (GT-269): the bare unit — `kg | lb` — as every weight in the app
// prints it, in `WEIGHT_UNITS` order.

import { WEIGHT_UNITS } from '@domain/weightUnit';

export const WEIGHT_UNIT_OPTIONS = WEIGHT_UNITS.map((unit) => ({ value: unit, label: unit }));
