import { StyleSheet } from 'react-native';

import { SIZES } from '@design/tokens';

export const styles = StyleSheet.create({
  // As tall as the round buttons beside it (36), so the title row doesn't grow; `hitSlop` on the
  // button makes up the rest of the 44pt touch area.
  button: {
    minHeight: SIZES['size/icon-button'],
    justifyContent: 'center',
  },
});
