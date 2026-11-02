// Styles behind components/RestNotificationsSection.tsx. The section and its row are Settings' own
// (SettingsScreenStyles.ts); the plate is the accent surface of 08.0.

import { StyleSheet } from 'react-native';

import {
  BORDER_WIDTHS,
  COLORS,
  LINE_HEIGHTS,
  RADII,
  SPACING,
  TYPOGRAPHY,
} from '@design/tokens';

import { styles as settings } from './SettingsScreenStyles';

export const styles = StyleSheet.create({
  section: settings.section,
  sectionLabel: settings.sectionLabel,
  plate: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderRadius: RADII['radius/field'],
    padding: SPACING['space/md'],
  },
  hide: {
    position: 'absolute',
    top: SPACING['space/md'],
    right: SPACING['space/md'],
    zIndex: 1,
  },
  plateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  plateTitle: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  recommended: {
    borderColor: COLORS.accent,
    borderWidth: BORDER_WIDTHS['border/default'],
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/gap'],
  },
  recommendedLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    lineHeight: LINE_HEIGHTS['line-height/caption'],
    color: COLORS.accent,
  },
  plateText: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  plateAction: {
    marginTop: SPACING['space/row'],
  },
  row: {
    ...settings.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/row'],
    paddingVertical: SPACING['space/row'],
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/primary'],
  },
  rowDescription: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/muted'],
  },
  rowAction: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
});
