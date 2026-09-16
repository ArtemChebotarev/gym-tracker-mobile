// Styles for MesoEditorReviewStep.tsx — see the code-style skill, "Screens keep the same split,
// one level up". The header/progress-bar/footer chrome's own styles live in
// design/components/WizardScreen.tsx — only this step's own content styling stays here.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

// Same 4px content top padding and 8px group dot as steps 1 and 2 (MesoEditorBasicsStepStyles.ts,
// MesoEditorDaysStepStyles.ts) — kept identical so the content doesn't shift between steps.
const CONTENT_PADDING_TOP = 4;
const DOT_SIZE = 8;
const CARD_BORDER_WIDTH = 1;
const SUMMARY_META_MARGIN_TOP = 4;
const CHEVRON_SIZE = 20;

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: CONTENT_PADDING_TOP,
    paddingBottom: SPACING['space/section'],
    gap: SPACING['space/section'],
  },
  card: {
    backgroundColor: COLORS['surface/card'],
    borderWidth: CARD_BORDER_WIDTH,
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
    marginTop: SUMMARY_META_MARGIN_TOP,
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
    fontSize: CHEVRON_SIZE,
    color: COLORS['text/faint'],
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap'],
    borderTopWidth: CARD_BORDER_WIDTH,
    borderTopColor: COLORS['border/divider'],
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
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
