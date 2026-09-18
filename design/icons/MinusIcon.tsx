// `minus` — Minus — Remove last set (08.7).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function MinusIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
