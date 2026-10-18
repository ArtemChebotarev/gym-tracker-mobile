// `hourglass` — Hourglass — rest: between sets, and between an interval's rounds (TimerCapsule,
// 10.1 FR-5, canvas 3.x).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function HourglassIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path
        d="M7 3h10M7 21h10M8 3v3l4 6-4 6v3M16 3v3l-4 6 4 6v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}
