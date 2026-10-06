import { StyleSheet } from 'react-native';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // As tall as the round buttons beside it (36), so the title row doesn't grow; `hitSlop` on the
  // button makes up the rest of the 44pt touch area.
  button: {
    minHeight: SIZES['size/icon-button'],
    justifyContent: 'center',
  },
  paragraph: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
});
