// `icon/search` — Magnifying glass — the empty search result (08.0.1).

import { Circle, Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function SearchIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="M16 16l4.5 4.5" strokeLinecap="round" />
    </IconFrame>
  );
}
