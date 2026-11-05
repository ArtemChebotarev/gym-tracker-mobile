// Styles behind components/MesocyclesScreen.tsx — see the code-style skill and
// ExerciseLibraryScreenStyles.ts's `addIcon` for why the "+" button is styled this way.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { circle } from '@design/shapes';

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
  // Between groups: what SectionGap leaves between Library's groups.
  content: {
    paddingBottom: SPACING['space/section'],
    gap: SPACING['space/row'],
  },
  activeCard: {
    marginTop: SPACING['space/list-block-gap'],
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['accent/border'],
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/sheet'],
    paddingVertical: SPACING['space/sheet'],
    gap: SPACING['space/row'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
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
    gap: SPACING['space/dots'],
  },
  weekDot: {
    ...circle(SIZES['size/dot-large']),
    backgroundColor: COLORS['surface/control-active'],
  },
  weekDotDone: {
    backgroundColor: COLORS['accent/border'],
  },
  weekDotCurrent: {
    backgroundColor: COLORS.accent,
  },
  activeCaption: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/muted'],
  },
});
