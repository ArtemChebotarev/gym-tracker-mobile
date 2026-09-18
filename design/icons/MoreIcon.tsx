// `more` — Three dots (`⋯`) — header and exercise menus (08.7).

import { Circle } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function MoreIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Circle cx={5.5} cy={12} r={0.9} />
      <Circle cx={12} cy={12} r={0.9} />
      <Circle cx={18.5} cy={12} r={0.9} />
    </IconFrame>
  );
}
