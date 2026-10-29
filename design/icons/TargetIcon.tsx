// `target` — Concentric rings with a centre dot — what to aim for in every set, in the RIR
// explanation (08.11 · Onboarding, GT-149).

import { Circle, Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function TargetIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Circle cx={12} cy={12} r={4.5} />
      <Path d="M12 12h.01" strokeLinecap="round" />
    </IconFrame>
  );
}
