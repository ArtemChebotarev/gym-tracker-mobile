// Intentional violation of 07 · Persistence Layer Contract, rule 1: usecases/ must not depend on
// storage/ directly. Checked by scripts/verify-boundaries.js — do not fix, do not lint in normal runs.
import { violation } from '../../storage/localStorageAdapter';

export { violation };
