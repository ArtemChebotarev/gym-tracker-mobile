// `strength` — Barbell — the Strength type of an exercise (canvas 4.1, "New exercise · pick type").

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function StrengthIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M3 12h2M19 12h2M7 8v8M17 8v8M5 10v4M19 10v4M7 12h10" strokeLinecap="round" />
    </IconFrame>
  );
}
