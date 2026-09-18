// `plus` — Plus — Add exercise, Add set (08.7).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function PlusIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
