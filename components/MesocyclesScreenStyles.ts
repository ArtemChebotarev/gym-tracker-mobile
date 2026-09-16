// Styles behind components/MesocyclesScreen.tsx — see the code-style skill and
// ExerciseLibraryScreenStyles.ts's `addIcon` for why the "+" button is styled this way.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

// No token exists for these — same exception MesoEditorReviewStepStyles.ts takes for its card
// border and dot size.
const CARD_BORDER_WIDTH = 1;
const WEEK_DOT_SIZE = 8;
const WEEK_DOTS_GAP = 5;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  addIcon: {
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['accent/on'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
  content: {
    paddingBottom: SPACING['space/section'],
    gap: SPACING['space/section'],
  },
  group: {
    gap: SPACING['space/gap'],
  },
  groupLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  activeCard: {
    backgroundColor: COLORS['surface/card'],
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: COLORS['accent/border'],
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/sheet'],
    paddingVertical: SPACING['space/sheet'],
    gap: SPACING['space/row'],
  },
  pressed: {
    opacity: 0.7,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING['space/gap'],
  },
  activeName: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  weekDots: {
    flexDirection: 'row',
    gap: WEEK_DOTS_GAP,
  },
  weekDot: {
    width: WEEK_DOT_SIZE,
    height: WEEK_DOT_SIZE,
    borderRadius: WEEK_DOT_SIZE / 2,
    backgroundColor: COLORS['surface/control-active'],
  },
  weekDotDone: {
    backgroundColor: COLORS['accent/border'],
  },
  weekDotCurrent: {
    backgroundColor: COLORS.accent,
  },
  activeCaption: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/muted'],
  },
  menuItem: {
    paddingVertical: SPACING['space/row'],
    borderBottomWidth: CARD_BORDER_WIDTH,
    borderBottomColor: COLORS['border/divider'],
  },
  menuItemLabel: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/primary'],
  },
  menuItemLabelDanger: {
    color: COLORS.danger,
  },
});
