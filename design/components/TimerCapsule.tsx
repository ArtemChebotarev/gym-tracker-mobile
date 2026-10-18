// TimerCapsule — see 08.0 · Design SDK, "Капсула таймера" (10.1 FR-5, FR-6; canvas 3.x,
// TimerCapsule): the floating plate over the tab bar that shows a running timer without blocking
// the screen under it. One component for the rest between sets and for a minimised interval
// timer — a progress ring, the time, a caption led by the phase's icon, and the actions.
//
// The ring is the pause control (Artem's review, 18.10.2026): running it shows pause, paused it
// shows play, and a tap on it does what it shows — the hand goes to the ring first, so a second
// pause button beside Skip only competed with it. The phase's icon (hourglass for rest) moved out
// of the ring to lead the caption, small and in the caption's grey, so it still says what kind of
// time this is without a second mark that looks tappable.
//
// It only draws: the caller passes the time already formatted, the share of the ring to fill and
// the phase's icon, and decides which actions the phase has — `onSkip` given shows Skip, `onPause`
// / `onResume` make the ring a toggle, `onDismiss` the cross of a finished timer. The orange of the ring
// is the one place a running timer is orange (`brand/orange`, FR-6: "только для бегущего
// времени"); paused, the ring and the time go grey, and a finished timer turns to the lime of done.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { CheckIcon } from '../icons/CheckIcon';
import { CloseIcon } from '../icons/CloseIcon';
import type { IconComponent } from '../icons/IconFrame';
import { PauseIcon } from '../icons/PauseIcon';
import { PlayIcon } from '../icons/PlayIcon';
import { circle, ring, roundedBar, tapTargetSlop } from '../shapes';
import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  LINE_HEIGHTS,
  OPACITY,
  SHADOWS,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '../tokens';

export type TimerCapsuleState = 'running' | 'paused' | 'finished';

export type TimerCapsuleProps = {
  state: TimerCapsuleState;
  /** The phase's icon at the head of the caption — `HourglassIcon` for rest. Not shown once finished. */
  icon: IconComponent;
  /** The time left, formatted (`1:46`); for a finished timer, what is over (`Rest is over`). */
  title: string;
  /** What the time is for: `Rest · set 3 next`. */
  caption: string;
  /** The share of the ring filled, 0..1 — the part of the phase still to run. Clamped. */
  progress: number;
  /** Shows Skip — rest only (FR-5: "Skip и Pause"). */
  onSkip?: () => void;
  /** Makes the ring a pause button while running. */
  onPause?: () => void;
  /** Makes the ring a play button while paused. */
  onResume?: () => void;
  /** Shows the cross that puts a finished timer away. */
  onDismiss?: () => void;
  /** Makes the capsule's body a button — a minimised interval timer opens on a tap (FR-6). */
  onPress?: () => void;
  /** Read for the body when `onPress` is given — `Open interval timer`. */
  accessibilityLabel?: string;
};

export function TimerCapsule({
  state,
  icon,
  title,
  caption,
  progress,
  onSkip,
  onPause,
  onResume,
  onDismiss,
  onPress,
  accessibilityLabel,
}: TimerCapsuleProps) {
  const finished = state === 'finished';
  const PhaseIcon = icon;
  const paused = state === 'paused';

  const body = (
    <>
      {finished ? (
        <DoneMark />
      ) : (
        <ProgressRing paused={paused} progress={progress} onToggle={paused ? onResume : onPause} />
      )}
      <View style={styles.text}>
        <Text
          style={[styles.title, finished && styles.finishedTitle, paused && styles.pausedTitle]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.captionRow}>
          {!finished && <PhaseIcon size={ICON_SIZES['icon/glyph']} color={COLORS['text/muted']} />}
          <Text style={styles.caption} numberOfLines={1}>
            {caption}
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <View
      accessibilityRole={finished ? 'summary' : 'timer'}
      style={[styles.capsule, finished && styles.finishedCapsule]}
    >
      {onPress === undefined ? (
        <View style={styles.body}>{body}</View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        >
          {body}
        </Pressable>
      )}
      {!finished && onSkip !== undefined && (
        <CapsuleButton accessibilityLabel="Skip" onPress={onSkip}>
          <Text style={styles.buttonLabel}>Skip</Text>
        </CapsuleButton>
      )}
      {finished && onDismiss !== undefined && (
        <CapsuleButton accessibilityLabel="Dismiss" onPress={onDismiss} quiet>
          <CloseIcon size={ICON_SIZES['icon/small']} color={COLORS['text/primary']} />
        </CapsuleButton>
      )}
    </View>
  );
}

const RING = ring(SIZES['size/timer-ring'], BORDER_WIDTHS['border/timer-ring']);

function ProgressRing({
  paused,
  progress,
  onToggle,
}: {
  paused: boolean;
  progress: number;
  /** Pause while running, resume while paused; absent, the ring only shows progress. */
  onToggle?: () => void;
}) {
  const filled = Math.min(1, Math.max(0, progress)) * RING.circumference;
  const Icon = paused ? PlayIcon : PauseIcon;
  return (
    <Pressable
      // Without a toggle the ring is only a picture of the time left, not a control.
      accessibilityRole={onToggle === undefined ? undefined : 'button'}
      accessibilityLabel={onToggle === undefined ? undefined : paused ? 'Resume' : 'Pause'}
      disabled={onToggle === undefined}
      onPress={onToggle}
      hitSlop={tapTargetSlop(SIZES['size/timer-ring'])}
      style={({ pressed }) => [styles.ring, pressed && styles.pressed]}
    >
      <Svg
        width={SIZES['size/timer-ring']}
        height={SIZES['size/timer-ring']}
        style={StyleSheet.absoluteFill}
      >
        <Circle
          cx={RING.center}
          cy={RING.center}
          r={RING.radius}
          fill="none"
          stroke={COLORS['timer/track']}
          strokeWidth={BORDER_WIDTHS['border/timer-ring']}
        />
        {filled > 0 && (
          <Circle
            testID="timer-capsule-arc"
            cx={RING.center}
            cy={RING.center}
            r={RING.radius}
            fill="none"
            stroke={paused ? COLORS['text/faint'] : COLORS['brand/orange']}
            strokeWidth={BORDER_WIDTHS['border/timer-ring']}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${RING.circumference}`}
            // The arc starts at twelve o'clock, as a clock's hand does, not at three.
            rotation={-90}
            origin={`${RING.center}, ${RING.center}`}
          />
        )}
      </Svg>
      {onToggle !== undefined && (
        <Icon size={ICON_SIZES['icon/small']} color={COLORS['text/primary']} />
      )}
    </Pressable>
  );
}

function DoneMark() {
  return (
    <View style={[styles.ring, styles.doneMark]}>
      <CheckIcon size={ICON_SIZES['icon/small']} color={COLORS['accent/on']} />
    </View>
  );
}

function CapsuleButton({
  accessibilityLabel,
  onPress,
  quiet = false,
  children,
}: {
  accessibilityLabel: string;
  onPress: () => void;
  /** No plate of its own — the cross on a finished capsule. */
  quiet?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        quiet && styles.quietButton,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const VALUE = TYPOGRAPHY['type/value'];
const BODY = TYPOGRAPHY['type/body'];
const FOOTNOTE = TYPOGRAPHY['type/footnote'];
const META = TYPOGRAPHY['type/meta'];

const styles = StyleSheet.create({
  capsule: {
    ...roundedBar(SIZES['size/timer-capsule']),
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    paddingLeft: SPACING['space/gap'],
    paddingRight: SPACING['space/gap-tight'],
    backgroundColor: COLORS['surface/popover'],
    ...SHADOWS['shadow/overlay'],
  },
  finishedCapsule: {
    backgroundColor: COLORS['accent/bg'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['accent/border'],
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  ring: {
    ...circle(SIZES['size/timer-ring']),
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneMark: {
    backgroundColor: COLORS.accent,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: VALUE.fontSize,
    fontWeight: VALUE.fontWeight,
    color: COLORS['text/primary'],
    // The digits keep their width as they count down, so the time doesn't jitter every second.
    fontVariant: ['tabular-nums'],
  },
  finishedTitle: {
    fontSize: BODY.fontSize,
  },
  pausedTitle: {
    color: COLORS['text/muted'],
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/xs'],
  },
  caption: {
    flexShrink: 1,
    fontSize: FOOTNOTE.fontSize,
    fontWeight: FOOTNOTE.fontWeight,
    lineHeight: LINE_HEIGHTS['line-height/caption'],
    color: COLORS['text/secondary'],
  },
  button: {
    ...roundedBar(SIZES['size/tap-target']),
    minWidth: SIZES['size/tap-target'],
    paddingHorizontal: SPACING['space/gap'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/card'],
  },
  quietButton: {
    backgroundColor: 'transparent',
  },
  buttonLabel: {
    fontSize: META.fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
