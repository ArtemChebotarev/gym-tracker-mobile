// `skip` — Skip forward — Skip workout, Skip exercise (08.7).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function SkipIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M6 6l8 6-8 6z" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 6v12" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
