// Styles behind components/ExerciseDetailScreen.tsx — see the code-style skill.
//
// Laid out after 08.6's mockup (02-exercise-detail.html), with every value taken from
// design/tokens.ts: the mockup predates the type scale of task 101, so its pixel sizes are read as
// which *token* they meant, not copied as numbers — its 11pt section label is `type/label`, its
// 13pt card row is `type/body`, and both land a step larger on a real phone.
//
// A pushed screen, so it owns its top safe-area inset and screen padding the way RootScreen does
// for a tab — but not RootScreen itself: that component is the *root* screens' frame (its title
// uses `type/screen-title`, whose one documented use in 08.0 · Design SDK is "Заголовок корневого
// экрана"), and it has no place for the back button 08.6 puts in this screen's header. The
// exercise's name is `type/entity-title` instead, the token for a named entity's own screen — and
// the mockup's own 24pt title.
//
// Colors run a step brighter than the mockup's (Artem's review on 107): its `--t-4`/`--t-5` greys
// are our `text/faint`/`text/disabled`, which disappear on a real phone at this size. Section
// labels, set labels and the quiet tails use `text/muted`, values `text/primary`.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
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
    gap: SPACING['space/gap'],
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
  // The group chip and the Catalog/Custom badge sit side by side, so they are the same pill: the
  // same padding and the same `type/caption` Badge and Chip both use (08.0 · Design SDK — a chip's
  // label and a badge's share that scale). Only the fill and the dot differ. Equal height also
  // keeps them level whatever the row does, since Badge pins itself with `alignSelf: flex-start`
  // and would otherwise ignore the row's `alignItems: center`. The workout card's group chip
  // (08.7) stays on `type/label` — it stands alone above a card rather than next to a badge.
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING['space/gap-tight'],
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
  },
  groupDot: {
    ...circle(SIZES['size/dot']),
  },
  groupLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
  },
  content: {
    gap: SPACING['space/xl'],
    paddingBottom: SPACING['space/section'],
  },
  tiles: {
    flexDirection: 'row',
    gap: SPACING['space/gap-tight'],
  },
  /** A block: its label row, then its card. */
  block: {
    gap: SPACING['space/gap-tight'],
  },
  /** `LAST SESSION` on the left, `Week 3 · Day 1 · 10 Aug` on the right. */
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
  // Same size as the label beside it, but never uppercased — `type/label` carries the transform,
  // and `Week 3 · Day 1 · 10 Aug` is a date, not a section heading.
  blockMeta: {
    flexShrink: 1,
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/muted'],
  },
  // No border of its own: rows are separated by hairlines inside it (08.0: "Разделитель между
  // строками, а не рамка вокруг каждой"), the card's fill does the framing.
  card: {
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/xs'],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderBottomColor: COLORS['border/divider-subtle'],
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/muted'],
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
  },
  /** The ` · 2 RIR` / ` · 3 sets` tail inside a value. */
  rowValueTail: {
    color: COLORS['text/muted'],
  },
  earlierLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/secondary'],
  },
  link: {
    alignSelf: 'center',
    paddingVertical: SPACING['space/md'],
    paddingHorizontal: SPACING['space/screen'],
  },
  linkLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS.accent,
  },
  linkPressed: {
    opacity: OPACITY['opacity/pressed'],
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
