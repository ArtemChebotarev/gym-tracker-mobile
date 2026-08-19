// Intentional violation of 07 · Persistence Layer Contract, rule 1: the dependency arrow points
// inward only, so domain/ must not depend on storage/. Checked by scripts/verify-boundaries.js —
// do not fix, do not lint in normal runs.
import { violation } from '../../storage/localStorageAdapter';

export { violation };
