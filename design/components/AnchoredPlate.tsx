// AnchoredPlate — the lifted plate with an arrow that points at an element (08.0 · Design SDK,
// `Popover`; the coachmark bubble of 08.11 is the same shape). It does not present itself: the
// caller puts it inside whatever covers the screen — a Popover's <Modal>, a Coachmark's — and gives
// it the anchor it has measured (`measureInWindow`). Where it lands is `design/popoverLayout.ts`.
//
// `surface/popover` is the one surface lighter than a card, and it carries `shadow/overlay`: this
// is the only thing in the app that floats *over* the screen rather than sitting in it, and on a
// plate the colour of what it covers the two read as one block (Artem's review on the device).
//
// With no anchor measured — `measureInWindow` answers nothing under Jest, and a platform could
// fail it too — the plate is centred and has no arrow. A tap that opens nothing is worse than a
// plate that doesn't point anywhere. The arrow's test id is the plate's with `-arrow` appended.

import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { arrowOffset, popoverLayout } from '../popoverLayout';
import type { AnchorRect } from '../popoverLayout';
import { COLORS, RADII, SHADOWS, SIZES, SPACING } from '../tokens';

export type AnchoredPlateProps = {
  /** Where the element it points at sits in the window; `null` until measured. */
  anchor: AnchorRect | null;
  testID: string;
  children?: ReactNode;
};

export function AnchoredPlate({ anchor, testID, children }: AnchoredPlateProps) {
  const window = useWindowDimensions();
  const layout =
    anchor === null
      ? null
      : popoverLayout(anchor, window, SPACING['space/screen'], SIZES['size/popover-arrow']);

  if (layout === null) {
    return (
      <View style={styles.centered} pointerEvents="box-none">
        <View testID={testID} style={[styles.plate, styles.floating]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.plate,
        styles.anchored,
        layout.placement === 'below'
          ? { left: layout.left, right: layout.right, top: layout.top }
          : { left: layout.left, right: layout.right, bottom: layout.bottom },
      ]}
    >
      <View
        testID={`${testID}-arrow`}
        style={[
          styles.arrow,
          layout.placement === 'below' ? styles.arrowUp : styles.arrowDown,
          { left: layout.arrowLeft },
        ]}
      />
      {children}
    </View>
  );
}

const ARROW_OFFSET = arrowOffset(SIZES['size/popover-arrow']);

const styles = StyleSheet.create({
  centered: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },
  anchored: {
    position: 'absolute',
  },
  floating: {
    marginHorizontal: SPACING['space/screen'],
  },
  plate: {
    backgroundColor: COLORS['surface/popover'],
    borderRadius: RADII['radius/control'],
    padding: SPACING['space/screen'],
    ...SHADOWS['shadow/overlay'],
  },
  arrow: {
    position: 'absolute',
    width: SIZES['size/popover-arrow'],
    height: SIZES['size/popover-arrow'],
    backgroundColor: COLORS['surface/popover'],
    transform: [{ rotate: '45deg' }],
  },
  arrowUp: {
    top: ARROW_OFFSET,
  },
  arrowDown: {
    bottom: ARROW_OFFSET,
  },
});
