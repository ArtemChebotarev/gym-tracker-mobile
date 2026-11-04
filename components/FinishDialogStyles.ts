import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  title: {
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  subtitle: {
    marginTop: SPACING['space/xs'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  lead: {
    marginTop: SPACING['space/screen'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  // The list gives way first when the day doesn't fit the window (Dialog's `maxHeight`), and
  // never grows past its rows: a ScrollView grows by default.
  list: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: SPACING['space/row'],
    borderRadius: RADII['radius/field'],
    borderWidth: BORDER_WIDTHS['border/default'],
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
  plateRows: {
    paddingHorizontal: SPACING['space/md'],
    paddingVertical: SPACING['space/xs'],
  },
  plate: {
    marginTop: SPACING['space/sheet'],
    padding: SPACING['space/md'],
    borderRadius: RADII['radius/field'],
    borderWidth: BORDER_WIDTHS['border/default'],
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
  body: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  row: {
    minHeight: SIZES['size/finish-row'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/primary'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/footnote'].fontSize,
    color: COLORS['text/secondary'],
  },
  delta: {
    width: SIZES['size/finish-delta'],
    textAlign: 'right',
    fontSize: TYPOGRAPHY['type/footnote'].fontSize,
    color: COLORS.accent,
  },
  upNext: {
    marginTop: SPACING['space/screen'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  upNextDay: {
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  button: {
    marginTop: SPACING['space/sheet'],
  },
});
