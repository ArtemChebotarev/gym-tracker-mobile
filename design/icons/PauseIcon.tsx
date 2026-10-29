// `pause` — Two bars — pause a running timer (TimerCapsule, 10.1 FR-5). Play resumes it.

import { Rect } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function PauseIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Rect x={6.5} y={5} width={4} height={14} rx={1.2} />
      <Rect x={13.5} y={5} width={4} height={14} rx={1.2} />
    </IconFrame>
  );
}
