// Styles behind components/CardTimerAction.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // The negative margin takes back the card's bottom padding (ExerciseCardFrameStyles.ts), so the
  // block reaches the card's edge and its label stands midway between the divider and that edge.
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/gap-tight'],
    height: SIZES['size/tap-target'],
    marginBottom: -SPACING['space/gap-tight'],
    borderTopWidth: BORDER_WIDTHS['border/default'],
    borderTopColor: COLORS['border/divider-subtle'],
  },
  disabled: {
    opacity: OPACITY['opacity/dimmed'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  // The glyph sits a little high in its frame beside the text; this brings it level with the label.
  icon: {
    top: SPACING['space/icon-drop'],
  },
  label: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['brand/orange'],
  },
});
