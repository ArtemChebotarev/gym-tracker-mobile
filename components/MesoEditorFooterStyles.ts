// Styles for MesoEditorFooter.tsx — see the code-style skill, "Screens keep the same split, one
// level up".

import { StyleSheet } from 'react-native';

import { COLORS, LINE_HEIGHTS, SPACING, TYPOGRAPHY } from '@design/tokens';

// Mockup (02-new-meso-days.html) uses a 10px gap between the hint and the button (there, the
// hint sits below; moved above per caller review — see MesoEditorFooter.tsx's own comment — so
// this is now a bottom margin instead of a top one, same value). `line-height/hint` fixes the
// hint's rendered height (rather than leaving it to the font's natural line height) so
// `hintPlaceholder`, standing in for it on steps with no hint, reserves exactly the same space —
// that match is the whole point of the placeholder, so it can't be left to chance.
const HINT_LINE_HEIGHT = LINE_HEIGHTS['line-height/hint'];
const HINT_MARGIN_BOTTOM = SPACING['space/row'];

export const styles = StyleSheet.create({
  hint: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    lineHeight: HINT_LINE_HEIGHT,
    color: COLORS['text/faint'],
    textAlign: 'center',
    marginBottom: HINT_MARGIN_BOTTOM,
  },
  hintPlaceholder: {
    height: HINT_LINE_HEIGHT,
    marginBottom: HINT_MARGIN_BOTTOM,
  },
});
