// TimerCapsule — see 08.0 · Design SDK, "Капсула таймера" (10.1 FR-5, FR-6; canvas 3.x,
// TimerCapsule): the floating plate over the tab bar that shows a running timer without blocking
// the screen under it. One component for the rest between sets and for a minimised interval
// timer — the phase icon in a progress ring, the time, a caption, and the actions.
//
// It only draws: the caller passes the time already formatted, the share of the ring to fill and
// the phase's icon, and decides which actions the phase has — `onSkip` given shows Skip, `onPause`
// / `onResume` the pause toggle, `onDismiss` the cross of a finished timer. The orange of the ring
// is the one place a running timer is orange (`brand/orange`, FR-6: "только для бегущего
// времени"); paused, the ring and the time go grey, and a finished timer turns to the lime of done.
// Paused, the ring keeps the phase's icon (Artem's review, 18.10.2026): two bars in it read as a
// button, while the one control for pausing is the button on the right.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '../icons/CheckIcon';
import { CloseIcon } from '../icons/CloseIcon';
import type { IconComponent } from '../icons/IconFrame';
import { PauseIcon } from '../icons/PauseIcon';
import { PlayIcon } from '../icons/PlayIcon';
import { ProgressRing } from './ProgressRing';
import { circle, roundedBar } from '../shapes';
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
  /** The phase's icon in the ring — `HourglassIcon` for rest. A finished timer shows a check instead. */
  icon: IconComponent;
  /** The time left, formatted (`1:46`); for a finished timer, what is over (`Rest is over`). */
  title: string;
  /** What the time is for: `Rest · set 3 next`. */
  caption: string;
  /** The share of the ring filled, 0..1 — the part of the phase still to run. Clamped. */
  progress: number;
  /** When given (epoch ms), the ring runs down by itself, smoothly, to nothing by then (ProgressRing). */
  runsOutAt?: number;
  /** Shows Skip — rest only (FR-5: "Skip и Pause"). */
  onSkip?: () => void;
  /** Shows the pause button while running. */
  onPause?: () => void;
  /** Shows the play button while paused. */
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
  runsOutAt,
  onSkip,
  onPause,
  onResume,
  onDismiss,
  onPress,
  accessibilityLabel,
}: TimerCapsuleProps) {
  const finished = state === 'finished';
  const paused = state === 'paused';

  const body = (
    <>
      {finished ? (
        <DoneMark />
      ) : (
        <CapsuleRing icon={icon} paused={paused} progress={progress} runsOutAt={runsOutAt} />
      )}
      <View style={styles.text}>
        <Text
          style={[styles.title, finished && styles.finishedTitle, paused && styles.pausedTitle]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
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
      {state === 'running' && onPause !== undefined && (
        <CapsuleButton accessibilityLabel="Pause" onPress={onPause}>
          <PauseIcon size={ICON_SIZES['icon/small']} color={COLORS['text/primary']} />
        </CapsuleButton>
      )}
      {paused && onResume !== undefined && (
        <CapsuleButton accessibilityLabel="Resume" onPress={onResume}>
          <PlayIcon size={ICON_SIZES['icon/small']} color={COLORS['text/primary']} />
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

function CapsuleRing({
  icon: Icon,
  paused,
  progress,
  runsOutAt,
}: {
  icon: IconComponent;
  paused: boolean;
  progress: number;
  runsOutAt: number | undefined;
}) {
  return (
    <ProgressRing
      size={SIZES['size/timer-ring']}
      strokeWidth={BORDER_WIDTHS['border/timer-ring']}
      progress={progress}
      {...(runsOutAt !== undefined ? { runsOutAt } : {})}
      color={paused ? COLORS['text/faint'] : COLORS['brand/orange']}
      trackColor={COLORS['timer/track']}
      arcTestID="timer-capsule-arc"
    >
      <Icon
        size={ICON_SIZES['icon/small']}
        color={paused ? COLORS['text/muted'] : COLORS['text/primary']}
      />
    </ProgressRing>
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
  caption: {
    fontSize: FOOTNOTE.fontSize,
    fontWeight: FOOTNOTE.fontWeight,
    lineHeight: LINE_HEIGHTS['line-height/caption'],
    color: COLORS['text/secondary'],
  },
  button: {
    ...roundedBar(SIZES['size/tap-target']),
    minWidth: SIZES['size/tap-target'],
    paddingHorizontal: SPACING['space/md'],
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
