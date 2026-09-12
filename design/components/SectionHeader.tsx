// SectionHeader — see 08.0 · Design SDK, "Компоненты": a sticky header combining a muscle-group
// category dot, the section name, and a count. Background is `surface/raised` specifically so
// a sticky header doesn't blend into the page while scrolling (08.0: "чтобы не сливаться при
// скролле"). `dotColor` is supplied by the caller (e.g. via design/muscleGroupColor.ts), the
// same pattern Chip uses for its static-variant dot — this file has no literal color of its own.

import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';

export type SectionHeaderProps = {
  title: string;
  count: number;
  dotColor?: string;
};

export function SectionHeader({ title, count, dotColor }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
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
    paddingHorizontal: SPACING['space/screen'],
    paddingVertical: SPACING['space/row'],
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
