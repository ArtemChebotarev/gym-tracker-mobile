// StatTile — see 08.0 · Design SDK, "Компоненты": a single label+value tile, always laid out
// by the caller in a grid of three (08.0: "Всегда в сетке по 3") — this component owns one
// tile, not the grid. `value` is a pre-formatted short string ("Значение короткое, без единиц
// где очевидно"); StatTile does no formatting of its own.

import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type StatTileProps = {
  label: string;
  value: string;
};

export function StatTile({ label, value }: StatTileProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/field'],
    paddingVertical: SPACING['space/row'],
    paddingHorizontal: SPACING['space/gap'],
    gap: SPACING['space/gap-tight'],
  },
  label: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/primary'],
  },
});
