import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // The line under the title on a plate that has one — power by level: read before the steps, so
  // in the steps' own size and colour rather than the note's quieter one.
  intro: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  // Rows are spaced like every plate's on the workout screen: `space/dots` between them.
  rows: {
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
});
