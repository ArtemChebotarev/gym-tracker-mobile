// HyperbroWordmark — the "Hyperbro" wordmark, dark-surface version (08.1 · Branding, the file
// `hyperbro-wordmark-dark.svg`; used by the Welcome dialog, 08.11).
//
// Hand-drawn geometry, not a font: the paths are the brand file's own, so the letters come out
// exactly as drawn. It extends the earlier Hybro wordmark — same 92 stroke, 8° slant and
// chamfers; p, e and the second r are new — and the crossbars of H and b stay orange, so the HB
// of the app icon still reads inside the word. The file carries a dark background rect and
// generous margins; both are dropped here — the wordmark sits straight on its dialog's surface —
// and the view box is cropped to the letters (x 260–2836, y 200–850 of the original
// 3095 × 1050 canvas). Lime is `accent` and the crossbars the brand orange; the two are the
// file's colours and the only ones it uses.

import Svg, { Path, Polygon } from 'react-native-svg';

import { COLORS, SIZES } from '../tokens';

// The artwork's own coordinates — drawing geometry, like an icon's 24×24 grid.
const VIEW_BOX = '260 200 2576 650';
const ASPECT_RATIO = 2576 / 650;

export type HyperbroWordmarkProps = {
  /** Rendered width. Defaults to the Welcome dialog's; the height keeps the artwork's proportions. */
  width?: number;
};

export function HyperbroWordmark({ width = SIZES['size/wordmark'] }: HyperbroWordmarkProps) {
  const lime = COLORS.accent;
  const orange = COLORS['brand/orange'];

  return (
    <Svg
      testID="hyperbro-wordmark"
      accessibilityRole="image"
      accessibilityLabel="Hyperbro"
      viewBox={VIEW_BOX}
      // `maxWidth`: a phone narrower than the dialog squeezes the card, and the word shrinks with
      // it instead of reaching into the card's padding (a 360dp Android leaves 264 for content).
      style={{ width, maxWidth: '100%', aspectRatio: ASPECT_RATIO }}
    >
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M333.08,200.00 L425.08,200.00 L352.00,720.00 L260.00,720.00 Z M541.08,200.00 L633.08,200.00 L560.00,720.00 L468.00,720.00 Z"
      />
      <Polygon
        fill={orange}
        points="394.01,414.00 512.01,414.00 499.08,506.00 381.08,506.00"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M657.41,340.00 L749.41,340.00 L772.39,517.30 L849.41,340.00 L941.41,340.00 L719.73,850.00 L627.73,850.00 L701.47,680.40 Z"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M981.41,340.00 L1221.41,340.00 L1259.22,384.00 L1218.18,676.00 L1168.00,720.00 L1020.00,720.00 L1001.73,850.00 L909.73,850.00 Z M1060.48,432.00 L1148.48,432.00 L1158.79,444.00 L1134.62,616.00 L1120.93,628.00 L1032.93,628.00 Z"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M1353.41,340.00 L1549.41,340.00 L1587.22,384.00 L1560.24,576.00 L1368.24,576.00 L1360.93,628.00 L1552.93,628.00 L1546.18,676.00 L1496.00,720.00 L1300.00,720.00 L1262.18,676.00 L1303.22,384.00 Z M1400.48,432.00 L1476.48,432.00 L1486.79,444.00 L1481.17,484.00 L1381.17,484.00 L1386.79,444.00 Z"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M1649.41,340.00 L1849.41,340.00 L1883.78,380.00 L1876.48,432.00 L1728.48,432.00 L1688.00,720.00 L1596.00,720.00 Z"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M1957.08,200.00 L2049.08,200.00 L2029.41,340.00 L2177.41,340.00 L2215.22,384.00 L2174.18,676.00 L2124.00,720.00 L1884.00,720.00 Z M2016.76,430.00 L2104.76,430.00 L2104.48,432.00 L2114.79,444.00 L2090.62,616.00 L2076.93,628.00 L1988.93,628.00 Z"
      />
      <Polygon
        fill={orange}
        points="2028.41,340.00 2177.41,340.00 2215.22,384.00 2208.48,432.00 2015.48,432.00"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M2277.41,340.00 L2477.41,340.00 L2511.78,380.00 L2504.48,432.00 L2356.48,432.00 L2316.00,720.00 L2224.00,720.00 Z"
      />
      <Path
        fill={lime}
        fillRule="evenodd"
        d="M2601.41,340.00 L2797.41,340.00 L2835.22,384.00 L2794.18,676.00 L2744.00,720.00 L2548.00,720.00 L2510.18,676.00 L2551.22,384.00 Z M2648.48,432.00 L2724.48,432.00 L2734.79,444.00 L2710.62,616.00 L2696.93,628.00 L2620.93,628.00 L2610.62,616.00 L2634.79,444.00 Z"
      />
    </Svg>
  );
}
