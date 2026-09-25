// `archive` — A box under its lid — `Archive` in a Completed mesocycle's `⋯` menu (08.3).

import { Path, Rect } from 'react-native-svg';

import { IconFrame, type IconProps } from './IconFrame';

export function ArchiveIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Rect x={3} y={4} width={18} height={4} rx={1} />
      <Path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
