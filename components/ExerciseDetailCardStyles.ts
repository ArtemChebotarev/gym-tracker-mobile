// Styles behind components/ExerciseDetailCard.tsx — see the code-style skill.
//
// Laid out after 08.6's mockup (02-exercise-detail.html), with every value taken from
// design/tokens.ts: the mockup predates the type scale of task 101, so its pixel sizes are read as
// which *token* they meant, not copied as numbers — its 11pt section label is `type/label` and its
// 13pt card row is `type/body`, and both land a step larger on a real phone.
//
// Colors run a step brighter than the mockup's (Artem's review on 107): its `--t-4`/`--t-5` greys
// are our `text/faint`/`text/disabled`, which disappear on a real phone at this size.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  /** The label row, then the card under it. */
  block: {
    gap: SPACING['space/gap-tight'],
  },
  /** `LAST SESSION` on the left, `Week 3 · Day 1 · 10 Aug` on the right. */
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACING['space/gap'],
  },
  label: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  // Same weight as the label beside it, but never uppercased — `type/label` carries the transform,
  // and `Week 3 · Day 1 · 10 Aug` is a date, not a section heading.
  meta: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderBottomColor: COLORS['border/divider-subtle'],
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
  },
  /** `Set 1` — a counter beside its value. */
  rowLabelMuted: {
    color: COLORS['text/muted'],
  },
  /** `W2 · D1 · 3 Aug` — a fact in its own right, so a step brighter than a counter. */
  rowLabelStrong: {
    color: COLORS['text/secondary'],
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
});
