// ProgressRing — see 08.0 · Design SDK, "Кольцо прогресса": a track and an arc over it, the arc
// starting at twelve o'clock and going clockwise, with whatever the caller puts in the middle. The
// timers' one way of showing how much of a phase is left (10.1 FR-5, FR-6): small in the
// TimerCapsule, large on the interval timer's screen.
//
// It only draws: the caller passes the share already worked out and the colours, which say what the
// time is — FR-6 keeps `brand/orange` for running time only.
//
// Given `runsOutAt`, the arc runs down to nothing by that moment by itself, smoothly, on the UI
// thread (Reanimated): redrawing it a few times a second from JS made it step (Artem, 20.10.2026).
// Every new `progress` starts it again from there, so it never drifts from the time it shows.

import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { circle, ring } from '../shapes';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = {
  /** Outer diameter, pt. */
  size: number;
  strokeWidth: number;
  /** The share of the ring the arc covers now, 0..1 — clamped. Nothing is drawn at 0. */
  progress: number;
  /** When given (epoch ms), the arc runs down from `progress` to nothing by then, smoothly. */
  runsOutAt?: number;
  /** The arc's colour. */
  color: string;
  trackColor: string;
  /** For a test to find the arc. */
  arcTestID?: string;
  /** Centred in the ring: an icon, the time. */
  children?: ReactNode;
};

function clamp(progress: number): number {
  return Math.min(1, Math.max(0, progress));
}

export function ProgressRing({
  size,
  strokeWidth,
  progress,
  runsOutAt,
  color,
  trackColor,
  arcTestID,
  children,
}: ProgressRingProps) {
  const geometry = ring(size, strokeWidth);
  const share = clamp(progress);
  const arc = {
    cx: geometry.center,
    cy: geometry.center,
    r: geometry.radius,
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    // The arc starts at twelve o'clock, as a clock's hand does, not at three.
    rotation: -90,
    origin: `${geometry.center}, ${geometry.center}`,
  };
  return (
    <View style={[circle(size), styles.ring]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={geometry.center}
          cy={geometry.center}
          r={geometry.radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {runsOutAt === undefined ? (
          share > 0 && (
            <Circle
              {...arc}
              testID={arcTestID}
              strokeDasharray={`${share * geometry.circumference} ${geometry.circumference}`}
            />
          )
        ) : (
          <RunningArc
            arc={arc}
            arcTestID={arcTestID}
            circumference={geometry.circumference}
            share={share}
            runsOutAt={runsOutAt}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

/** The arc of a ring that runs down by itself — see `runsOutAt`. */
function RunningArc({
  arc,
  arcTestID,
  circumference,
  share,
  runsOutAt,
}: {
  arc: Record<string, unknown>;
  arcTestID: string | undefined;
  circumference: number;
  share: number;
  runsOutAt: number;
}) {
  const shown = useSharedValue(share);

  useEffect(() => {
    cancelAnimation(shown);
    shown.value = share;
    const left = runsOutAt - Date.now();
    if (left > 0) {
      shown.value = withTiming(0, { duration: left, easing: Easing.linear });
    }
  }, [shown, share, runsOutAt]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - shown.value),
    // A round cap would leave a dot at nothing.
    strokeOpacity: shown.value > 0 ? 1 : 0,
  }));

  return (
    <AnimatedCircle
      {...arc}
      testID={arcTestID}
      strokeDasharray={`${circumference} ${circumference}`}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
