// `arrow-down` — Arrow down — Move down (08.7, "Меню упражнения").

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function ArrowDownIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
