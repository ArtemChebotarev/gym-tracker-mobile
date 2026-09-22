// `play` — Triangle — Start mesocycle (08.3). Skip's triangle without the bar after it: this one
// begins something rather than jumping past it.

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function PlayIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M8 5l11 7-11 7z" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
