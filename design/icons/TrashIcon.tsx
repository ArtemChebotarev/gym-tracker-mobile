// `trash` — Trash can — Delete exercise (08.7).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function TrashIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
