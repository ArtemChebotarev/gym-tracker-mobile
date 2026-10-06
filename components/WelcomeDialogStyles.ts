import { StyleSheet } from 'react-native';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: SPACING['space/dialog'],
  },
  title: {
    maxWidth: SIZES['size/dialog-title'],
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
    textAlign: 'center',
  },
  steps: {
    marginVertical: SPACING['space/dialog'],
    gap: SPACING['space/sheet'],
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING['space/row'],
  },
  stepIcon: {
    width: SIZES['size/control-inline'],
    alignItems: 'center',
    paddingTop: SPACING['space/xxs'],
  },
  stepText: {
    flex: 1,
    gap: SPACING['space/xxs'],
  },
  stepTitle: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  stepBody: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
});
