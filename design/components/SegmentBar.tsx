// SegmentBar — see 08.0 · Design SDK, "Сегменты": a row of equal bars over one track colour, each
// filled from the left by its own share in its own colour. The interval timer's rounds across the
// top of its screen (10.1 FR-6; canvas 2.x): the done ones full, the running one partly.
//
// It only draws: the caller says how full each bar is and in what colour. Given `fullAt`, a bar
// fills up to the end by that moment by itself, smoothly, on the UI thread (Reanimated) — redrawn
// a few times a second from JS it moved in steps (Artem, 20.10.2026), as ProgressRing did.

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { roundedBar } from '../shapes';
import { COLORS, SIZES, SPACING } from '../tokens';

export type Segment = {
  /** The share filled now, 0..1 — clamped. */
  fill: number;
  color: string;
  /** When given (epoch ms), the bar fills from `fill` up to the end by then, smoothly. */
  fullAt?: number;
};

export type SegmentBarProps = {
  segments: readonly Segment[];
  accessibilityLabel: string;
};

function clamp(share: number): number {
  return Math.min(1, Math.max(0, share));
}

export function SegmentBar({ segments, accessibilityLabel }: SegmentBarProps) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.row}>
      {segments.map((segment, index) => (
        <View key={index} testID="segment" style={styles.track}>
          {segment.fullAt === undefined ? (
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.round(clamp(segment.fill) * 100)}%`,
                  backgroundColor: segment.color,
                },
              ]}
            />
          ) : (
            <FillingBar fill={clamp(segment.fill)} color={segment.color} fullAt={segment.fullAt} />
          )}
        </View>
      ))}
    </View>
  );
}

/** A bar that fills up by itself — see `fullAt`. */
function FillingBar({ fill, color, fullAt }: { fill: number; color: string; fullAt: number }) {
  const shown = useSharedValue(fill);

  useEffect(() => {
    cancelAnimation(shown);
    shown.value = fill;
    const left = fullAt - Date.now();
    if (left > 0) {
      shown.value = withTiming(1, { duration: left, easing: Easing.linear });
    }
  }, [shown, fill, fullAt]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${shown.value * 100}%` }));

  return <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING['space/xs'],
  },
  track: {
    flex: 1,
    ...roundedBar(SIZES['size/round-segment']),
    backgroundColor: COLORS['surface/control-active'],
    overflow: 'hidden',
  },
  fill: {
    ...roundedBar(SIZES['size/round-segment']),
  },
});
