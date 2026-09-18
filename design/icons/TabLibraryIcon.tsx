// `icon/tab-library` — Library tab — dumbbell. SVG from 08.0 · Design SDK, "Таб-бар".

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function TabLibraryIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M3 12h2M19 12h2M7 8v8M17 8v8M5 10v4M19 10v4M7 12h10" strokeLinecap="round" />
    </IconFrame>
  );
}
