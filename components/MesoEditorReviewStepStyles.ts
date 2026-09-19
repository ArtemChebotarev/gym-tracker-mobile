// Styles for MesoEditorReviewStep.tsx — see the code-style skill, "Screens keep the same split,
// one level up". The header/progress-bar/footer chrome's own styles live in
// design/components/WizardScreen.tsx — only this step's own content styling stays here.

import { StyleSheet } from 'react-native';

import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  RADII,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '@design/tokens';
import { circle } from '@design/shapes';

// Same 4px content top padding and group dot as steps 1 and 2 (MesoEditorBasicsStepStyles.ts,
// MesoEditorDaysStepStyles.ts) — kept identical so the content doesn't shift between steps.

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/xs'],
    paddingBottom: SPACING['space/section'],
    gap: SPACING['space/section'],
  },
  card: {
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/sheet'],
    paddingVertical: SPACING['space/row'],
  },
  summaryName: {
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  summaryMeta: {
    marginTop: SPACING['space/xs'],
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/muted'],
  },
  sectionLabel: {
    marginBottom: -SPACING['space/gap'],
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING['space/gap'],
  },
  dayTitle: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/primary'],
  },
  chevron: {
    fontSize: ICON_SIZES['icon/chevron'],
    color: COLORS['text/faint'],
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap'],
    borderTopWidth: BORDER_WIDTHS['border/default'],
    borderTopColor: COLORS['border/divider'],
  },
  dot: {
    ...circle(SIZES['size/dot-large']),
  },
  exerciseName: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  exerciseSets: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/muted'],
  },
});
