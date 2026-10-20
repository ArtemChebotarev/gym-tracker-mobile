// `chevrons-right` — Two chevrons — Get ready: the count-in before a round started by a tap, in the
// timer capsule (10.1 FR-6, canvas 3.2, GT-97).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function ChevronsRightIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M5 6l6 6-6 6M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
