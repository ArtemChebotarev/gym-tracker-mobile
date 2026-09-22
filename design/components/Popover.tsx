// Popover — see 08.0 · Design SDK, "Компоненты": an anchored plate of short reference content
// with no actions in it. If something has to be pressed, that is a BottomSheet, not this.
//
// It points at an anchor the caller has measured (`measureInWindow`) and passes in, so the plate
// can sit under it — or over it, once the anchor is past the middle of the screen. Where exactly
// is `design/popoverLayout.ts`; this only renders the result. The arrow is a square of
// `size/popover-arrow` turned 45°, in the plate's own colour.
//
// `surface/popover` is the one surface lighter than a card, and it carries `shadow/overlay`: this
// is the only thing in the app that floats *over* the screen rather than sitting in it, and on a
// plate the colour of what it covers the two read as one block (Artem's review on the device).
//
// Presented through <Modal>, like BottomSheet: the backdrop has to cover the whole screen, take
// the tap that closes the plate ("Закрывается тапом мимо"), and dim everything under it with
// `overlay/scrim-light` — weaker than a sheet's scrim, because the card being explained should
// stay readable behind the explanation.
//
// With no anchor measured — `measureInWindow` answers nothing under Jest, and a platform could
// fail it too — the plate still opens, centred and without an arrow. A tap that opens nothing is
// worse than a plate that doesn't point anywhere.

import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { arrowOffset, popoverLayout } from '../popoverLayout';
import type { AnchorRect } from '../popoverLayout';
import { COLORS, RADII, SHADOWS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

export type PopoverProps = {
  visible: boolean;
  onClose: () => void;
  /** Where the anchor sits in the window. Nothing is shown until it has been measured. */
  anchor: AnchorRect | null;
  title: string;
  /** A line under the title — what the plate is for (08.7.1). */
  subtitle?: string;
  children?: ReactNode;
};

export function Popover({
  visible,
  onClose,
  anchor,
  title,
  subtitle,
  children,
}: PopoverProps) {
  const window = useWindowDimensions();
  const layout =
    anchor === null
      ? null
      : popoverLayout(anchor, window, SPACING['space/screen'], SIZES['size/popover-arrow']);

  const body = (
    <>
      <Text style={styles.title}>{title}</Text>
      {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.backdrop}
        onPress={onClose}
      />
      {layout === null ? (
        <View style={styles.centered} pointerEvents="box-none">
          <View testID="popover" style={[styles.plate, styles.floating]}>
            {body}
          </View>
        </View>
      ) : (
        <View
          testID="popover"
          style={[
            styles.plate,
            styles.anchored,
            layout.placement === 'below'
              ? { left: layout.left, right: layout.right, top: layout.top }
              : { left: layout.left, right: layout.right, bottom: layout.bottom },
          ]}
        >
          <View
            testID="popover-arrow"
            style={[
              styles.arrow,
              layout.placement === 'below' ? styles.arrowUp : styles.arrowDown,
              { left: layout.arrowLeft },
            ]}
          />
          {body}
        </View>
      )}
    </Modal>
  );
}

const ARROW_OFFSET = arrowOffset(SIZES['size/popover-arrow']);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS['overlay/scrim'],
  },
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
  title: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  subtitle: {
    // A step more than a sheet's subtitle takes: here the line under the title is a sentence of
    // its own, not a continuation of the title (Artem's review).
    marginTop: SPACING['space/dots'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
});
