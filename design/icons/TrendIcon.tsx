// `icon/trend` — a line rising to an arrowhead — "we handle progression" in the Welcome dialog
// (08.11). Drawn on the same 24×24 grid as the tab icons.

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function TrendIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M3 17l6-6 4 4 8-8M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
