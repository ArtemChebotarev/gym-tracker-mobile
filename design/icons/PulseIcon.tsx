// `pulse` — Pulse — work: an interval round being worked, in the timer capsule (10.1 FR-6, canvas
// 3.2, GT-97).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function PulseIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M3 12h4l3-7 4 14 3-7h4" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
