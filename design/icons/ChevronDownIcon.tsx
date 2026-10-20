// `chevron-down` — Chevron down — minimise: the interval timer's screen folds into the capsule
// (10.1 FR-6, canvas 2.x, GT-97).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
