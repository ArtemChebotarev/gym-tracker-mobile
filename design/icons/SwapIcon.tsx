// `swap` — Two opposite arrows — Replace exercise (08.7, "Меню упражнения").

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function SwapIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M7 4L4 7l3 3M4 7h13" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 14l3 3-3 3M20 17H7" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
