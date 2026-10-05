// Styles for TemplatePreviewSheet.tsx — see AGENTS.md, "Code organization". Row metrics follow
// 08.10's mockup (`templates-variant3.html`, frame 3).

import { StyleSheet } from 'react-native';

import { circle } from '@design/shapes';
import { BORDER_WIDTHS, COLORS, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // The sheet's footer lines its buttons up on the right (08.0); this one spans it (08.10's mockup).
  footerButton: {
    flex: 1,
  },
  tabsContent: {
    // The ScrollView clips its content, so this leaves room for the tabs' tap-target slop above.
    paddingTop: SPACING['space/xs'],
    paddingBottom: SPACING['space/xs'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/row'],
    paddingVertical: SPACING['space/row'],
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderBottomColor: COLORS['border/divider-subtle'],
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  number: {
    width: SIZES['size/order-column'],
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    color: COLORS['text/faint'],
  },
  dot: {
    ...circle(SIZES['size/dot-large']),
  },
  main: {
    flex: 1,
  },
  group: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  exercise: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/faint'],
    marginTop: SPACING['space/xxs'],
  },
  sets: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
});
