// Popover — see 08.0 · Design SDK, "Компоненты": an anchored plate of short reference content
// with no actions in it. If something has to be pressed, that is a BottomSheet, not this.
//
// It points at an anchor the caller has measured (`measureInWindow`) and passes in, so the plate
// can sit under it — or over it, once the anchor is past the middle of the screen. Where exactly
// is `design/popoverLayout.ts`; this only renders the result. The arrow is a square of
// `size/popover-arrow` turned 45°, showing two of its borders so it reads as a continuation of the
// plate's own outline.
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
import { BORDER_WIDTHS, COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

export type PopoverProps = {
  visible: boolean;
  onClose: () => void;
  /** Where the anchor sits in the window. Nothing is shown until it has been measured. */
  anchor: AnchorRect | null;
  title: string;
  /** A short line under the title — `Set 1 · target 15 kg × 10` (08.7.1). */
  subtitle?: string;
  children?: ReactNode;
  /** A closing line, separated by a divider. */
  footer?: ReactNode;
};

export function Popover({
  visible,
  onClose,
  anchor,
  title,
  subtitle,
  children,
  footer,
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
      {footer !== undefined && <View style={styles.footer}>{footer}</View>}
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
    backgroundColor: COLORS['overlay/scrim-light'],
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
    backgroundColor: COLORS['surface/sheet'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    padding: SPACING['space/screen'],
  },
  arrow: {
    position: 'absolute',
    width: SIZES['size/popover-arrow'],
    height: SIZES['size/popover-arrow'],
    backgroundColor: COLORS['surface/sheet'],
    transform: [{ rotate: '45deg' }],
  },
  // Only the two borders facing away from the plate are drawn, so the outline runs around the
  // arrow's tip and stops where the plate's own edge takes over.
  arrowUp: {
    top: ARROW_OFFSET,
    borderLeftWidth: BORDER_WIDTHS['border/default'],
    borderTopWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
  },
  arrowDown: {
    bottom: ARROW_OFFSET,
    borderRightWidth: BORDER_WIDTHS['border/default'],
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  subtitle: {
    marginTop: SPACING['space/xxs'],
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    color: COLORS['text/muted'],
  },
  footer: {
    marginTop: SPACING['space/md'],
    paddingTop: SPACING['space/row'],
    borderTopWidth: BORDER_WIDTHS['border/default'],
    borderTopColor: COLORS['border/divider-subtle'],
  },
});
