// `stop` — Square — Stop mesocycle (08.7).

import { Rect } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function StopIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Rect x={6} y={6} width={12} height={12} rx={2} />
    </IconFrame>
  );
}
