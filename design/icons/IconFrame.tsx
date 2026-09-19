// Shared frame for every icon in design/icons/ — see 08.0 · Design SDK, "Иконки": `viewBox 0 0 24
// 24`, outline only (no fill), `stroke-width 1.8`, color from the parent. React Native has no
// `currentColor`, so the parent passes the color in explicitly (`accent` / `text/faint` for tab
// icons, see TabBar) instead of the icon inheriting it; the icon itself never picks a color or
// ships a separate active/inactive version.

import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import Svg, { G } from 'react-native-svg';

import { ICON_STROKE_WIDTH } from '../tokens';

export type IconProps = {
  /** Rendered width and height — `ICON_SIZES` in design/tokens.ts (20 in the tab bar, 18 in `IconButton`). */
  size: number;
  /**
   * Stroke color, resolved by the parent from a `COLORS` token. `ColorValue` rather than `string`
   * so a navigator's own tint (e.g. `tabBarIcon`'s `color`) can be passed straight through.
   */
  color: ColorValue;
};

export type IconComponent = (props: IconProps) => ReactNode;

const VIEW_BOX = '0 0 24 24';

export function IconFrame({ size, color, children }: IconProps & { children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <G fill="none" stroke={color} strokeWidth={ICON_STROKE_WIDTH}>
        {children}
      </G>
    </Svg>
  );
}
