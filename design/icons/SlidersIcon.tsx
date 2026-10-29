// `sliders` — Two slider tracks with knobs — the `Filters` button of the exercise list (08.6,
// "Строка фильтров"; GT-150), so it reads as the way into a sheet of filters rather than one more
// tag beside them.

import { Circle, Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function SlidersIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M4 8h5M13 8h7M4 16h9M17 16h3" strokeLinecap="round" />
      <Circle cx={11} cy={8} r={2} />
      <Circle cx={15} cy={16} r={2} />
    </IconFrame>
  );
}
