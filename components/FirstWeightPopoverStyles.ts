import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // The line under the title on a plate that has one — power by level: read before the steps, so
  // in the steps' own size and colour rather than the note's quieter one.
  intro: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  // `type/label` is the SDK's one capitalized section header (08.0).
  sectionLabel: {
    marginTop: SPACING['space/row'],
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  // The one block that is logged, in the accent the plate keeps for what its meaning rests on.
  workingLabel: {
    marginTop: SPACING['space/gap-tight'],
    color: COLORS.accent,
  },
  // Rows are spaced like every plate's on the workout screen: `space/dots` between them.
  rows: {
    marginTop: SPACING['space/gap-tight'],
    gap: SPACING['space/dots'],
  },
  // As big as the lines above it, only quieter: at caption size the note read as fine print next to
  // the ladder it qualifies (Artem, 06.10.2026).
  note: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/muted'],
  },
  separator: {
    marginTop: SPACING['space/gap'],
    height: BORDER_WIDTHS['border/default'],
    backgroundColor: COLORS['border/default'],
  },
});
