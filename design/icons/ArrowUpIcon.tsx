// `arrow-up` — Arrow up — Move up (08.7, "Меню упражнения").

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function ArrowUpIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
