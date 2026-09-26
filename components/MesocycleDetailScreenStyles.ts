// Styles behind components/MesocycleDetailScreen.tsx — see the code-style skill.
//
// Laid out after 08.9's mockup (08.9-meso-detail.html), with every value taken from
// design/tokens.ts. Its pixel sizes are read as which token they meant, the way the Exercise
// screen reads 08.6's: the 24pt title is `type/entity-title`, the uppercase section label
// `type/label`. Greys run a step brighter than the mockup's, as on every screen since Artem's
// review on 107 — `text/faint` and `text/disabled` disappear on a real phone.

import { StyleSheet } from 'react-native';

import { circle } from '@design/shapes';
import { BORDER_WIDTHS, COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/screen'],
    gap: SPACING['space/gap'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    gap: SPACING['space/xl'],
    paddingBottom: SPACING['space/section'],
  },
  heading: {
    gap: SPACING['space/xs'],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING['space/gap'],
  },
  title: {
    flexShrink: 1,
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  subtitle: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  tiles: {
    flexDirection: 'row',
    gap: SPACING['space/gap-tight'],
  },
  /** A block: its label, then its card. */
  block: {
    gap: SPACING['space/gap-tight'],
  },
  /** `WORKOUTS` on the left, `tap to open` on the right. */
  blockLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACING['space/gap'],
  },
  blockLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  // The mockup's `text/faint`, a step brighter like every quiet line since Artem's review on 107.
  blockHint: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/muted'],
  },
  card: {
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/field'],
    padding: SPACING['space/row'],
    gap: SPACING['space/xs'],
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/xs'],
  },
  groupColumn: {
    width: SIZES['size/group-column'],
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/dots'],
  },
  groupDot: {
    ...circle(SIZES['size/dot']),
  },
  groupLabel: {
    flexShrink: 1,
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/secondary'],
  },
  weekHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/muted'],
  },
  volumeCell: {
    flex: 1,
    height: SIZES['size/volume-cell'],
    borderRadius: RADII['radius/small'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeCellLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/primary'],
  },
  /** A week with no set of the group: a dashed outline around a dash (08.9). */
  volumeCellEmpty: {
    borderWidth: BORDER_WIDTHS['border/default'],
    borderStyle: 'dashed',
    borderColor: COLORS['border/default'],
  },
  volumeCellEmptyLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/muted'],
  },
  empty: {
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/field'],
    paddingVertical: SPACING['space/section'],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
    textAlign: 'center',
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
