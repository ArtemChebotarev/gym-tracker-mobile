// `icon/tab-today` — Today tab — calendar. SVG from 08.0 · Design SDK, "Таб-бар".

import { Path, Rect } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function TabTodayIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Rect x={4} y={5} width={16} height={15} rx={2.5} />
      <Path d="M4 10h16M9 3v4M15 3v4" />
    </IconFrame>
  );
}
