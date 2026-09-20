// `hide` — Crossed-out eye — `Hide` in the Exercise screen's `⋯` menu (08.6, "Меню и действия").

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function HideIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path
        d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9.5 9.5a3.5 3.5 0 0 0 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 20L20 4" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
