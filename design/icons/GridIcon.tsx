// `grid` — Four-cell grid — opens the mesocycle overview sheet (08.7, "Кнопка сетки").

import { Rect } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function GridIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Rect x={4} y={4} width={6.5} height={6.5} rx={1.5} />
      <Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.5} />
      <Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.5} />
      <Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={1.5} />
    </IconFrame>
  );
}
