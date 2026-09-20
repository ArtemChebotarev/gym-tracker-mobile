// Styles behind components/ExerciseDetailScreen.tsx — see the code-style skill.
//
// A pushed screen, so it owns its top safe-area inset and screen padding the way RootScreen does
// for a tab — but not RootScreen itself: that component is the *root* screens' frame (its title
// uses `type/screen-title`, whose one documented use in 08.0 · Design SDK is "Заголовок корневого
// экрана"), and it has no place for the back button 08.6 puts in this screen's header. The
// exercise's name is an `type/entity-title` instead, the token for a named entity's own screen.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { circle } from '@design/shapes';

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
  heading: {
    gap: SPACING['space/gap-tight'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  headingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING['space/gap-tight'],
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/chip-y'],
  },
  groupDot: {
    ...circle(SIZES['size/dot']),
  },
  groupLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
  },
  content: {
    gap: SPACING['space/section'],
    paddingBottom: SPACING['space/section'],
  },
  tiles: {
    flexDirection: 'row',
    gap: SPACING['space/gap-tight'],
  },
  card: {
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/control'],
    padding: SPACING['space/sheet'],
    gap: SPACING['space/gap'],
  },
  cardTitle: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING['space/gap'],
  },
  setNumber: {
    width: SIZES['size/indicator-column'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
  },
  setValue: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/primary'],
  },
  // 08.6's empty state is a line plus a caption, with nothing to press — not the Design SDK's
  // EmptyState, which always renders an action ("EmptyState всегда рендерит действие") and would
  // have to invent one here.
  empty: {
    gap: SPACING['space/gap-tight'],
    paddingVertical: SPACING['space/section'],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/secondary'],
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
    textAlign: 'center',
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
