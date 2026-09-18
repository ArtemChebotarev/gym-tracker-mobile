// `history` — Clock with a back arrow — opens exercise history (08.7, "История").

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function HistoryIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.5 4.5V9H9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
