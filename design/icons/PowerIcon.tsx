// `power` — Bolt — the Power type of an exercise: explosive work (canvas 4.1).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function PowerIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" strokeLinejoin="round" />
    </IconFrame>
  );
}
