// `back` — Left chevron — the back button of a pushed screen (08.6, "Шапка: Назад + меню ⋯").

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function BackIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
