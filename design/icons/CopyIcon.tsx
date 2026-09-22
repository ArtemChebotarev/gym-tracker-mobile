// `copy` — Two stacked sheets — Copy mesocycle (08.3).

import { Path, Rect } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function CopyIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Rect x={9} y={9} width={11} height={11} rx={2} />
      <Path d="M5 15V6a2 2 0 0 1 2-2h8" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
