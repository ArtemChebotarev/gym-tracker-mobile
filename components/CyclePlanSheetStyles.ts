// Styles for CyclePlanSheet.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, OPACITY, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  section: {
    marginTop: SPACING['space/section'],
  },
  stepRow: {
    marginTop: SPACING['space/md'],
  },
  // Reset over Done, both the sheet's full width (Artem, 18.10.2026): the confirming action is
  // the wide one, the way back to the defaults a link above it.
  footer: {
    flex: 1,
    gap: SPACING['space/gap-tight'],
  },
  reset: {
    minHeight: SIZES['size/tap-target'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A link, the way "No heavier available" is one on the power card: secondary text, underlined.
  resetLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
