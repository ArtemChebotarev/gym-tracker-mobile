// `timer` — Stopwatch — the Timed work (`interval`) type of an exercise: rounds run by a timer
// (canvas 4.1).

import { Circle, Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function TimerIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Circle cx={12} cy={13.5} r={7} />
      <Path d="M12 13.5V10M10 3h4" strokeLinecap="round" />
    </IconFrame>
  );
}
