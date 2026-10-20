import { Button, HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
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
// the app's icon, the phase in bold over the exercise and round — or the next round in a rest — the time left on
// the right, a bar under them, and the buttons: Pause (Resume while paused), and Skip rest in a
// rest. No End early: too easy to hit by accident (canvas 6.3). A tap on the rest opens the timer.
//
// The `'widget'` function below is not run in the app. Babel turns it into a string, and the
// widget extension runs that on its own (expo-widgets): nothing from this module's scope reaches
// it — not the design tokens, not a constant. So every colour and size comes in through
// `props.look` (IntervalTimerActivityLogic.ts), and the buttons' targets are written out here —
// keep them in step with `IntervalActivityAction`.
//
// - Running, the time and the bar run down by themselves: the app need not wake to move them.
// - Paused, the time is plain text and the bar holds — see `pausedLabel`, `pausedProgress`. Nothing
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
  const interval = { lower: new Date(props.phaseStartedAt), upper: new Date(props.phaseEndsAt) };
  // Changes swap in place: the system would otherwise morph one text into the next, and the
  // activity stretched like rubber between running and paused (Artem, 20.10.2026).
  const still = contentTransition('identity');
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
      <Text modifiers={clockLook(size, width)}>{props.pausedLabel}</Text>
    ) : (
      <Text timerInterval={interval} modifiers={clockLook(size, width)} />
    );
  const bar = paused ? (
    <ProgressView value={props.pausedProgress} modifiers={[tint(barColor), labelsHidden()]} />
  ) : (
    <ProgressView
      timerInterval={interval}
      countsDown
      modifiers={[tint(barColor), labelsHidden()]}
    />
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
      <VStack spacing={look.gap} modifiers={[padding({ all: look.padding })]}>
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
              {props.phase}
            </Text>
            <Text modifiers={[font({ size: look.captionSize }), still]}>{props.detail}</Text>
          </VStack>
          <Spacer />
          {clock(look.clockSize, look.clockWidth)}
        </HStack>
        {bar}
        <HStack spacing={look.gap}>
          {paused ? button('pause', 'Resume', 'play.fill') : button('pause', 'Pause', 'pause.fill')}
          {props.canSkipRest ? button('skipRest', 'Skip rest', 'forward.end.fill') : null}
        </HStack>
      </VStack>
    ),
    compactLeading: <Text>{props.phase}</Text>,
    compactTrailing: clock(look.clockSizeCompact),
    minimal: clock(look.clockSizeMinimal),
    expandedLeading: <Text>{props.phase}</Text>,
    expandedTrailing: clock(look.clockSizeExpanded),
    expandedBottom: <Text>{props.detail}</Text>,
  };
};

export default createLiveActivity('IntervalTimerActivity', IntervalTimerActivity);
