// `icon/tab-settings` — Settings tab — two sliders. SVG from 08.0 · Design SDK, "Таб-бар".

import { Circle, Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function TabSettingsIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M4 8h9M19 8h1M4 16h1M11 16h9" strokeLinecap="round" />
      <Circle cx="16" cy="8" r="2.5" />
      <Circle cx="8" cy="16" r="2.5" />
    </IconFrame>
  );
}
