import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // `type/label` is the SDK's one capitalized section header (08.0).
  sectionLabel: {
    marginTop: SPACING['space/row'],
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  ladder: {
    marginTop: SPACING['space/gap-tight'],
    gap: SPACING['space/gap-tight'],
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  stepText: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  summary: {
    marginTop: SPACING['space/md'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  summaryLead: {
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
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
