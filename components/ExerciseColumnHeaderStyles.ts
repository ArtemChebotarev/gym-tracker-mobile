// Styles behind components/ExerciseColumnHeader.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // The column header, on the set rows' grid (WorkoutSetRowStyles.ts): Weight · Reps · indicator ·
  // Log, centered, with Log flush right.
  // Tall enough to hold the ⓘ's full tap target: iOS delivers no touch outside a parent's own
  // frame, so a `hitSlop` on the button alone would be cut off by a row the height of its label.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    minHeight: SIZES['size/tap-target'],
    marginTop: SPACING['space/gap-tight'],
  },
  valueColumn: {
    flex: 1,
    textAlign: 'center',
  },
  // A header that carries an ⓘ beside its label — Weight's first-weight how-to (08.11) and Reps'
  // weight-swap ranges (08.7.1). It stretches to the row's full height so the button inside it is a
  // whole 44pt tall to the touch.
  infoHeader: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/dots'],
  },
  indicatorColumn: {
    width: SIZES['size/indicator-column'],
  },
  logColumn: {
    width: SIZES['size/log-column'],
    textAlign: 'right',
  },
  // `type/label` without its uppercase transform — the header stays `Weight, kg`, not `WEIGHT, KG`.
  columnLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    color: COLORS['text/muted'],
  },
});
