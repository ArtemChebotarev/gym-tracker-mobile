// HybroWordmark — the "Hybro" wordmark, dark-surface version (08.1 · Branding, the file
// `hybro-wordmark-dark.svg`; used by the Welcome dialog, 08.11).
//
// Hand-drawn geometry, not a font: the paths are the brand file's own, so the letters come out
// exactly as drawn. The file carries a dark background rect and generous margins; both are dropped
// here — the wordmark sits straight on its dialog's surface — and the view box is cropped to the
// letters (x 260–1880, y 200–850 of the original 2139 × 1050 canvas). Lime is `accent` and the
// crossbars the brand orange; the two are the file's colours and the only ones it uses.

import Svg, { Path, Polygon } from 'react-native-svg';

import { COLORS, SIZES } from '../tokens';

// The artwork's own coordinates — drawing geometry, like an icon's 24×24 grid.
const VIEW_BOX = '260 200 1620 650';
const ASPECT_RATIO = 1620 / 650;

export type HybroWordmarkProps = {
  /** Rendered width. Defaults to the Welcome dialog's; the height keeps the artwork's proportions. */
  width?: number;
};

export function HybroWordmark({ width = SIZES['size/wordmark'] }: HybroWordmarkProps) {
  const lime = COLORS.accent;
  const orange = COLORS['brand/orange'];

  return (
    <Svg
      testID="hybro-wordmark"
      accessibilityRole="image"
      accessibilityLabel="Hybro"
      width={width}
      viewBox={VIEW_BOX}
      style={{ aspectRatio: ASPECT_RATIO }}
    >
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M333.08,200.00 L425.08,200.00 L352.00,720.00 L260.00,720.00 Z M541.08,200.00 L633.08,200.00 L560.00,720.00 L468.00,720.00 Z"
      />
      <Polygon fill={orange} points="394.01,414.00 512.01,414.00 499.08,506.00 381.08,506.00" />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M657.41,340.00 L749.41,340.00 L772.39,517.30 L849.41,340.00 L941.41,340.00 L719.73,850.00 L627.73,850.00 L701.47,680.40 Z"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M1001.08,200.00 L1093.08,200.00 L1073.41,340.00 L1221.41,340.00 L1259.22,384.00 L1218.18,676.00 L1168.00,720.00 L928.00,720.00 Z M1060.76,430.00 L1148.76,430.00 L1148.48,432.00 L1158.79,444.00 L1134.62,616.00 L1120.93,628.00 L1032.93,628.00 Z"
      />
      <Polygon
        fill={orange}
        points="1072.41,340.00 1221.41,340.00 1259.22,384.00 1252.48,432.00 1059.48,432.00"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M1321.41,340.00 L1521.41,340.00 L1555.78,380.00 L1548.48,432.00 L1400.48,432.00 L1360.00,720.00 L1268.00,720.00 Z"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M1645.41,340.00 L1841.41,340.00 L1879.22,384.00 L1838.18,676.00 L1788.00,720.00 L1592.00,720.00 L1554.18,676.00 L1595.22,384.00 Z M1692.48,432.00 L1768.48,432.00 L1778.79,444.00 L1754.62,616.00 L1740.93,628.00 L1664.93,628.00 L1654.62,616.00 L1678.79,444.00 Z"
      />
    </Svg>
  );
}
