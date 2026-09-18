// `edit` — Pencil — Rename mesocycle (08.7).

import { Path } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function EditIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M15 5l4 4L9 19H5v-4zM13 7l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
