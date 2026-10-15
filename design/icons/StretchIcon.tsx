// `stretch` — A bend over a floor line — the Mobility type of an exercise: cooldown, stretching
// (canvas 4.1).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function StretchIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M4 15c3-6 13-6 16 0M7 19h10" strokeLinecap="round" />
    </IconFrame>
  );
}
