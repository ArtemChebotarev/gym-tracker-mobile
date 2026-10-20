import { Button, HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  animation,
  Animation,
  background,
  buttonStyle,
  clipShape,
  contentTransition,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  resizable,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import type { IntervalTimerActivityProps } from './IntervalTimerActivityLogic';

// The interval timer on the lock screen and in the Dynamic Island (10.1 FR-6; canvas 2.6, GT-99):
// the app's icon, the exercise in bold over its rounds, the block's time left on the right, a bar
// under them with a cell for each work and rest, and Pause (Resume while paused). No End early: too
// easy to hit by accident (canvas 6.3). A tap on the rest opens the timer.
//
// SPIKE (locked screen, 20.10.2026): the block, not the phase. Behind a locked screen iOS turns
// down the app's updates once it is only playing audio, so a phase view froze on 0:00 of the phase
// before. Everything drawn here runs by itself from the start, the same every time. Skip rest is
// gone with the phase: the activity can't know a rest is running.
//
// The `'widget'` function below is not run in the app. Babel turns it into a string, and the
// widget extension runs that on its own (expo-widgets): nothing from this module's scope reaches
// it — not the design tokens, not a constant. So every colour and size comes in through
// `props.look` (IntervalTimerActivityLogic.ts), and the buttons' targets are written out here —
// keep them in step with `IntervalActivityAction`.
//
// - Running, the time and the cells run by themselves: the app need not wake to move them.
// - Paused, the time is plain text and the cells hold — see `IntervalActivityBlock`. Nothing
//   else changes but the button (Artem, 20.10.2026): the time sits in a fixed, right-aligned frame,
//   so the activity doesn't jump between the two.
// - A button's tap comes back to the app as a user interaction (state/intervalLiveActivity.ts).

const IntervalTimerActivity = (
  props: IntervalTimerActivityProps,
  environment: LiveActivityEnvironment,
) => {
  'widget';
  const look = props.look;
  const paused = props.pausedLabel !== undefined;
  const barColor = environment.isLuminanceReduced ? look.barColorDimmed : look.barColor;
  // The block, not the phase: iOS turns down an update from the app behind a locked screen, so
  // nothing here may wait for one (IntervalTimerActivityLogic.ts, `IntervalActivityBlock`).
  const block = props.block;
  const interval = { lower: new Date(block.startedAt), upper: new Date(block.endsAt) };
  // Changes swap in place: the system would otherwise morph one text into the next, and the
  // activity stretched like rubber between running and paused (Artem, 20.10.2026).
  const still = contentTransition('identity');
  // Paused and running swap with no animation of their own: the system springs the activity on
  // each update, and a morph between the two bars stretched it like rubber (Artem, 20.10.2026).
  const noAnimation =
    typeof Animation === 'undefined' ? [] : [animation(Animation.linear({ duration: 0 }), paused)];
  // One frame for both: a live timer takes all the width it may need, plain text only its own.
  const clockLook = (size: number, width?: number) => [
    font({ size }),
    monospacedDigit(),
    foregroundStyle(look.clockColor),
    multilineTextAlignment('trailing'),
    still,
    ...(width === undefined ? [] : [frame({ width, alignment: 'trailing' })]),
  ];
  const clock = (size: number, width?: number) =>
    paused ? (
      <Text modifiers={clockLook(size, width)}>{block.pausedLabel}</Text>
    ) : (
      <Text timerInterval={interval} modifiers={clockLook(size, width)} />
    );
  // The same height both ways: the running bar stood 6 pt taller, and the activity sprang between
  // the two on every Pause and Resume — what read as rubber (Artem, 20.10.2026).
  const barFrame = frame({ height: look.barHeight });
  // A cell for each work and rest: done ones full, the one running filling, those ahead empty —
  // each filling over its own time by itself.
  const segmentBar = (
    <HStack spacing={look.segmentGap}>
      {block.segments.map((segment, index) => {
        const segmentLook = [
          tint(segment.work ? barColor : look.restBarColor),
          labelsHidden(),
          still,
          barFrame,
        ];
        return segment.startsAt !== undefined && segment.endsAt !== undefined ? (
          <ProgressView
            key={index}
            timerInterval={{ lower: new Date(segment.startsAt), upper: new Date(segment.endsAt) }}
            countsDown={false}
            modifiers={segmentLook}
          />
        ) : (
          <ProgressView key={index} value={segment.value ?? 0} modifiers={segmentLook} />
        );
      })}
    </HStack>
  );
  // Drawn here rather than left to a button style: the system paints a Live Activity's styled
  // buttons its own way — a grey capsule, full width, with a white icon and label (canvas 2.6).
  const button = (
    target: string,
    label: string,
    systemImage: 'play.fill' | 'pause.fill' | 'forward.end.fill',
  ) => (
    <Button target={target} onPress={() => props} modifiers={[buttonStyle('plain')]}>
      <HStack
        spacing={look.gap}
        modifiers={[
          frame({ maxWidth: Infinity, minHeight: look.buttonHeight }),
          background(look.buttonColor),
          clipShape('capsule'),
        ]}
      >
        <Image systemName={systemImage} size={look.buttonIconSize} color={look.buttonLabelColor} />
        <Text
          modifiers={[
            font({ weight: 'medium', size: look.captionSize }),
            foregroundStyle(look.buttonLabelColor),
            still,
          ]}
        >
          {label}
        </Text>
      </HStack>
    </Button>
  );
  return {
    banner: (
      <VStack
        spacing={look.gap}
        modifiers={[
          padding({ all: look.padding }),
          activityBackgroundTint(look.backgroundColor),
          ...noAnimation,
        ]}
      >
        <HStack spacing={look.gap}>
          {props.iconUri !== undefined ? (
            <Image
              uiImage={props.iconUri}
              modifiers={[
                resizable(),
                frame({ width: look.iconSize, height: look.iconSize }),
                clipShape('roundedRectangle', look.iconRadius),
              ]}
            />
          ) : null}
          <VStack alignment="leading">
            <Text modifiers={[font({ weight: 'semibold', size: look.titleSize }), still]}>
              {block.title}
            </Text>
            <Text modifiers={[font({ size: look.captionSize }), still]}>{block.detail}</Text>
          </VStack>
          <Spacer />
          {clock(look.clockSize, look.clockWidth)}
        </HStack>
        {segmentBar}
        <HStack spacing={look.gap}>
          {paused ? button('pause', 'Resume', 'play.fill') : button('pause', 'Pause', 'pause.fill')}
        </HStack>
      </VStack>
    ),
    compactLeading: <Text>{block.title}</Text>,
    compactTrailing: clock(look.clockSizeCompact),
    minimal: clock(look.clockSizeMinimal),
    expandedLeading: <Text>{block.title}</Text>,
    expandedTrailing: clock(look.clockSizeExpanded),
    expandedBottom: segmentBar,
  };
};

export default createLiveActivity('IntervalTimerActivity', IntervalTimerActivity);
