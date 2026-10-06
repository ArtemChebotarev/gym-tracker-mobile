// `icon/close` — a cross — closes a Dialog from its corner (08.11). Same 24×24 grid as the rest.

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function CloseIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </IconFrame>
  );
}
