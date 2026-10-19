// GT-94 spike, throwaway: the interval timer's Live Activity on the lock screen.
import { Button, HStack, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type TimerSpikeProps = {
  phase: string;
  round: string;
  startedAtMs: number;
  endsAtMs: number;
  /**
   * Set while paused: what is left, as plain text ("0:13"). A paused timer is drawn as text, not
   * as a live timer with a pause time — on the phone that one kept running for seconds after the
   * pause (GT-94, 19.10.2026).
   */
  pausedLabel?: string;
  canSkipRest: boolean;
};

const TimerSpikeActivity = (props: TimerSpikeProps, environment: LiveActivityEnvironment) => {
  'widget';
  const orange = environment.isLuminanceReduced ? '#FFFFFF' : '#FF5B23';
  const interval = { lower: new Date(props.startedAtMs), upper: new Date(props.endsAtMs) };
  const style = (size: number) => [font({ weight: 'bold', size }), foregroundStyle(orange)];
  const clock = (size: number) =>
    props.pausedLabel === undefined ? (
      <Text timerInterval={interval} modifiers={style(size)} />
    ) : (
      <Text modifiers={style(size)}>{props.pausedLabel}</Text>
    );
  return {
    banner: (
      <HStack modifiers={[padding({ all: 14 })]}>
        <VStack>
          <Text modifiers={[font({ weight: 'bold', size: 16 })]}>{props.phase}</Text>
          <Text modifiers={[font({ size: 13 })]}>{props.round}</Text>
          {clock(34)}
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
    compactTrailing: clock(14),
    minimal: clock(12),
    expandedLeading: <Text>{props.phase}</Text>,
    expandedTrailing: clock(20),
    expandedBottom: <Text>{props.round}</Text>,
  };
};

export default createLiveActivity('TimerSpikeActivity', TimerSpikeActivity);
