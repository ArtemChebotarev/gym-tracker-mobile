// Intentional violation of 07 · Persistence Layer Contract, rule 9: usecases/ must not depend on
// UI (React Native). Checked by scripts/verify-boundaries.js — do not fix, do not lint in normal runs.
import { View } from 'react-native';

export const violation = View;
