// `reorder` — An arrow up beside an arrow down — Reorder days (08.5, "Шаг 2"; GT-270).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function ReorderIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M8 20V4M4 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 4v16M12 16l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
