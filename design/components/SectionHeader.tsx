// SectionHeader — see 08.0 · Design SDK, "Компоненты": a sticky header combining a muscle-group
// category dot, the section name, and a count. Background is `surface/raised` specifically so
// a sticky header doesn't blend into the page while scrolling (08.0: "чтобы не сливаться при
// скролле"). `dotColor` is supplied by the caller (e.g. via design/muscleGroupColor.ts), the
// same pattern Chip uses for its static-variant dot — this file has no literal color of its own.
//
// The band bleeds to the edge of the padded container it sits in (`edge` names that padding) and
// puts its text back at the content's own edge, so the title lines up with a row's title and the
// count with a row's chevron instead of both being inset a second time inside the band (GT-146).
// That needs the list to reach the container's edge too, or the scroll view clips the bleed: the
// lists give themselves the same negative margin and re-pad their content — see `listBleed`.

import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { circle } from '../shapes';

/** The padding of the container the header sits in: a screen's, or a bottom sheet's. */
export type SectionHeaderEdge = 'screen' | 'sheet';

/**
 * `card`: the text sits a card's inner padding in from the content edge, so it lines up with the
 * text *inside* the cards under the header rather than with the cards' own edge (the exercise
 * History tab).
 */
export type SectionHeaderInset = 'none' | 'card';

export type SectionHeaderProps = {
  title: string;
  count: number;
  dotColor?: string;
  /** Defaults to `screen`. */
  edge?: SectionHeaderEdge;
  /** Defaults to `none` — the text on the content's own edge, where a row's text starts. */
  inset?: SectionHeaderInset;
};

const EDGE_SPACING = { screen: SPACING['space/screen'], sheet: SPACING['space/sheet'] } as const;

/**
 * What a list holding `SectionHeader`s adds so its scroll view spans the container's padding
 * and its content is re-padded by the same amount: spread `style` on the list and `content` into
 * its `contentContainerStyle`.
 */
export function listBleed(edge: SectionHeaderEdge = 'screen') {
  const spacing = EDGE_SPACING[edge];
  return {
    style: { marginHorizontal: -spacing },
    content: { paddingHorizontal: spacing },
  } as const;
}

export function SectionHeader({
  title,
  count,
  dotColor,
  edge = 'screen',
  inset = 'none',
}: SectionHeaderProps) {
  const spacing = EDGE_SPACING[edge];
  const textInset = spacing + (inset === 'card' ? SPACING['space/row'] : 0);
  return (
    <View style={[styles.container, { marginHorizontal: -spacing, paddingHorizontal: textInset }]}>
      <View style={styles.leading}>
        {dotColor !== undefined && (
          <View testID="section-header-dot" style={[styles.dot, { backgroundColor: dotColor }]} />
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS['surface/raised'],
    paddingVertical: SPACING['space/row'],
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  dot: {
    ...circle(SIZES['size/dot']),
  },
  title: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/secondary'],
  },
  count: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/faint'],
  },
});
