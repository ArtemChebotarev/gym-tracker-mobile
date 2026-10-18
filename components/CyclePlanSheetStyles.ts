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
  note: {
    marginTop: SPACING['space/section'],
  },
  footer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  reset: {
    minHeight: SIZES['size/tap-target'],
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/gap-tight'],
  },
  resetLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  done: {
    flex: 1,
  },
});
