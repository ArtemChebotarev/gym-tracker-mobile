// `info` — Circled "i" — the `Not programmed yet` plate (08.7, "Preview"), the weight-swap ⓘ
// beside the Reps column and the InlineNote inside a card (08.7.1).

import { Circle, Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function InfoIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 11v5M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
