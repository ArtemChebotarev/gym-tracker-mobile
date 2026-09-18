// `icon/tab-mesocycles` — Mesocycles tab — folder. SVG from 08.0 · Design SDK, "Таб-бар".

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function TabMesocyclesIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    </IconFrame>
  );
}
