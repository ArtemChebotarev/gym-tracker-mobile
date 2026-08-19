// Intentional violation: domain/ must not depend on app/ (screens) — the dependency arrow points
// inward only. Checked by scripts/verify-boundaries.js — do not fix, do not lint in normal runs.
import { violation } from '../../app/HomeScreen';

export { violation };
