// Styles for MesoEditorReorderDaysSheet.tsx. A row is the Days step's exercise row — the same height
// (the drag's row height), divider, handle and lifted state — with the day and its exercises where
// the exercise's name and group would be.

import { StyleSheet } from 'react-native';

import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  RADII,
  SHADOWS,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '@design/tokens';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    height: SIZES['size/exercise-row'],
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderBottomColor: COLORS['border/divider'],
  },
  // The open tab's place: the tab's own accent tint, a step quieter than the tab itself.
  rowOpen: {
    backgroundColor: COLORS['accent/bg'],
    borderRadius: RADII['radius/control'],
    borderBottomColor: 'transparent',
  },
  rowDragging: {
    backgroundColor: COLORS['surface/card'],
    borderBottomColor: 'transparent',
    ...SHADOWS['shadow/lifted'],
    zIndex: 1,
  },
  handle: {
    width: SIZES['size/control-inline'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleGlyph: {
    fontSize: ICON_SIZES['icon/small'],
    color: COLORS['text/secondary'],
  },
  main: {
    flex: 1,
  },
  dayTitleOpen: {
    color: COLORS.accent,
  },
  dayTitle: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  summary: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/secondary'],
    marginTop: SPACING['space/xxs'],
  },
});
