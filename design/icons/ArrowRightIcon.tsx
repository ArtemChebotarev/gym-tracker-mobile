// `arrow-right` — Arrow right — an edit carried over to the weeks ahead (08.11, the edit coachmark,
// GT-224).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
