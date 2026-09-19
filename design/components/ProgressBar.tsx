// ProgressBar — a thin `accent` fill over a `border/divider` track, 3pt tall (08.7 · Тренировка,
// "Шапка": the workout's share of done set rows). The caller passes the ratio already computed;
// values outside 0..1 are clamped so a bad ratio never overflows the track.

import { StyleSheet, View } from 'react-native';
import { COLORS } from '../tokens';

export type ProgressBarProps = {
  /** Filled share, 0..1. */
  value: number;
  accessibilityLabel: string;
};

// No token for this yet — 08.7 specifies the bar as 3px.
const HEIGHT = 3;

function toPercent(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 100);
}

export function ProgressBar({ value, accessibilityLabel }: ProgressBarProps) {
  const percent = toPercent(value);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    backgroundColor: COLORS['border/divider'],
    overflow: 'hidden',
  },
  fill: {
    height: HEIGHT,
    backgroundColor: COLORS.accent,
  },
});
