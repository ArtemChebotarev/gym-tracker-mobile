// `check` — Check mark — completed session, logged set (08.7).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function CheckIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
