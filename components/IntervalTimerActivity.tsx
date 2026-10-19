import { Button, HStack, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import type { IntervalTimerActivityProps } from './IntervalTimerActivityLogic';

// The interval timer on the lock screen and in the Dynamic Island (10.1 FR-6), worked out in the
// GT-94 spike and checked on the phone. A working minimum: the design of canvas 2.x is GT-99's.
//
// The `'widget'` function below is not run in the app. Babel turns it into a string, and the
// widget extension runs that on its own (expo-widgets): nothing from this module's scope reaches
// it — not the design tokens, not a constant. So every colour and size comes in through
// `props.look` (IntervalTimerActivityLogic.ts), and the buttons' targets are written out here —
// keep them in step with `IntervalActivityAction`.
//
// - Running, the time is a live timer that counts down by itself: the app need not wake to move it.
// - Paused, it is plain text — see `pausedLabel`.
// - A button's tap comes back to the app as a user interaction (state/intervalLiveActivity.ts).

const IntervalTimerActivity = (
  props: IntervalTimerActivityProps,
  environment: LiveActivityEnvironment,
) => {
  'widget';
  const look = props.look;
  const color = environment.isLuminanceReduced ? look.clockColorDimmed : look.clockColor;
  const interval = { lower: new Date(props.phaseStartedAt), upper: new Date(props.phaseEndsAt) };
  const clock = (size: number) =>
    props.pausedLabel === undefined ? (
      <Text
        timerInterval={interval}
        modifiers={[font({ weight: 'bold', size }), foregroundStyle(color)]}
      />
    ) : (
      <Text modifiers={[font({ weight: 'bold', size }), foregroundStyle(color)]}>
        {props.pausedLabel}
      </Text>
    );
  return {
    banner: (
      <HStack modifiers={[padding({ all: look.padding })]}>
        <VStack>
          <Text modifiers={[font({ weight: 'bold', size: look.titleSize })]}>{props.phase}</Text>
          <Text modifiers={[font({ size: look.captionSize })]}>{props.round}</Text>
          {clock(look.clockSize)}
        </VStack>
        <VStack>
          <Button
            label={props.pausedLabel === undefined ? 'Pause' : 'Resume'}
            target="pause"
            onPress={() => props}
          />
          {props.canSkipRest ? (
            <Button label="Skip rest" target="skipRest" onPress={() => props} />
          ) : null}
        </VStack>
      </HStack>
    ),
    compactLeading: <Text>{props.phase}</Text>,
    compactTrailing: clock(look.clockSizeCompact),
    minimal: clock(look.clockSizeMinimal),
    expandedLeading: <Text>{props.phase}</Text>,
    expandedTrailing: clock(look.clockSizeExpanded),
    expandedBottom: <Text>{props.round}</Text>,
  };
};

export default createLiveActivity('IntervalTimerActivity', IntervalTimerActivity);
