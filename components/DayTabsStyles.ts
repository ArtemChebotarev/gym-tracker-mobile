// Styles for DayTabs.tsx — see AGENTS.md, "Code organization".

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  tabs: {
    flexGrow: 0,
  },
  tabsContent: {
    flexDirection: 'row',
    gap: SPACING['space/gap-tight'],
  },
  tab: {
    height: SIZES['size/chip'],
    justifyContent: 'center',
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/pill'],
    backgroundColor: COLORS['surface/card'],
    paddingHorizontal: SPACING['space/pill-x'],
  },
  tabActive: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
  label: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/secondary'],
  },
  labelActive: {
    color: COLORS.accent,
  },
});
