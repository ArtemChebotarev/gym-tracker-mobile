// Coachmark — one step of a guided walk-through (08.11 · Onboarding, "3. Коучмарки"): the screen
// dimmed with a hole cut round the element being explained, a ring round that element, and a
// bubble with an arrow pointing at it. In the bubble: `N of M`, a title, the text, `Skip` on the
// left and `Next` on the right — `Got it` alone on the last step.
//
// It draws one step and reports what was pressed; moving between steps, and measuring the element
// each one points at, is `CoachmarkTour`. The element's place is the caller's measurement
// (`measureInWindow`), not a fixed position, so the step follows the element wherever the layout put
// it. Nothing under the dim can be touched: a coachmark is read first, and the walk-through is left
// by its own buttons — or by Android's back button, which counts as `Skip`.
//
// The bubble is the Popover's plate (`AnchoredPlate`), placed against the *ring* rather than the
// element, so its arrow stops short of the highlight instead of touching it. With no anchor — not
// measured yet, or a platform that can't — there is no hole and no ring, and the bubble is centred.

import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { dimWithHolePath, ringRadius, ringRect } from '../coachmarkLayout';
import type { AnchorRect } from '../popoverLayout';
import { tapTargetSlop } from '../shapes';
import {
  BORDER_WIDTHS,
  COLORS,
  OPACITY,
  RADII,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '../tokens';
import { AnchoredPlate } from './AnchoredPlate';

export type CoachmarkProps = {
  visible: boolean;
  /** Where the highlighted element sits in the window, as measured; `null` until it has been. */
  anchor: AnchorRect | null;
  /** The corner radius of the ring and the hole — a `RADII` token; a round button wants a big one. */
  ringRadius?: number;
  /** This step's place in the walk-through, from 1. */
  step: number;
  total: number;
  title: string;
  paragraphs: readonly string[];
  /** `Next` — and `Got it` on the last step, which only the caller knows how to finish. */
  onNext: () => void;
  onSkip: () => void;
};

export function Coachmark({
  visible,
  anchor,
  ringRadius: radius = RADII['radius/control'],
  step,
  total,
  title,
  paragraphs,
  onNext,
  onSkip,
}: CoachmarkProps) {
  const window = useWindowDimensions();
  const isLast = step >= total;
  const ring = anchor === null ? null : ringRect(anchor, SPACING['space/xs']);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.fill}>
        <Svg width={window.width} height={window.height} style={styles.fill} pointerEvents="none">
          {ring === null ? (
            <Rect width={window.width} height={window.height} fill={COLORS['overlay/scrim']} />
          ) : (
            <>
              <Path
                d={dimWithHolePath(window, ring, radius)}
                fill={COLORS['overlay/scrim']}
                fillRule="evenodd"
              />
              <Rect
                testID="coachmark-ring"
                x={ring.x}
                y={ring.y}
                width={ring.width}
                height={ring.height}
                rx={ringRadius(ring, radius)}
                fill="none"
                stroke={COLORS['text/primary']}
                strokeWidth={BORDER_WIDTHS['border/emphasis']}
              />
            </>
          )}
        </Svg>
        {/* Swallows touches: nothing under the dim answers while a step is on screen. */}
        <View style={styles.fill} />
        <AnchoredPlate testID="coachmark" anchor={ring}>
          <Text style={styles.counter}>{`${step} of ${total}`}</Text>
          <Text style={styles.title}>{title}</Text>
          {paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
          <View style={styles.footer}>
            {isLast ? (
              <View />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={onSkip}
                hitSlop={tapTargetSlop(SIZES['size/pill'])}
                style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
              >
                <Text style={styles.skipLabel}>Skip</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={onNext}
              hitSlop={tapTargetSlop(SIZES['size/pill'])}
              style={({ pressed }) => [styles.next, pressed && styles.pressed]}
            >
              <Text style={styles.nextLabel}>{isLast ? 'Got it' : 'Next'}</Text>
            </Pressable>
          </View>
        </AnchoredPlate>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
  },
  counter: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/muted'],
  },
  title: {
    marginTop: SPACING['space/dots'],
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  paragraph: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  footer: {
    marginTop: SPACING['space/md'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    minHeight: SIZES['size/pill'],
    justifyContent: 'center',
  },
  skipLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
  next: {
    minHeight: SIZES['size/pill'],
    justifyContent: 'center',
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/pill-x'],
    backgroundColor: COLORS.accent,
  },
  nextLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['accent/on'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
