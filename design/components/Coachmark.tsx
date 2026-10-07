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
// The ring hugs the element, `space/dots` clear of it, with its stroke inside that box; the hole is
// cut to the box's outer edge. The bubble is the Popover's plate (`AnchoredPlate`) with a bigger,
// softer arrow, `space/screen` from the ring so the arrow stops short of the highlight instead of
// touching it. What gets measured is whatever the caller's ref points at — the visible element, not
// a larger touch area around it, or the ring would hug the touch area instead. With no anchor — not
// measured yet, or a platform that can't — there is no hole and no ring, and the bubble is centred.

import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { dimWithHolePath, ringRadius, ringRect, ringStrokeRect } from '../coachmarkLayout';
import type { AnchorRect } from '../popoverLayout';
import {
  BORDER_WIDTHS,
  COLORS,
  LINE_HEIGHTS,
  OPACITY,
  RADII,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '../tokens';
import { AnchoredPlate } from './AnchoredPlate';
import { PlateText, type PlateTextPart } from './PlateText';

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
  /** The text, as paragraphs. Replaced by `content` when a step has something better than words. */
  paragraphs?: readonly (string | readonly PlateTextPart[])[];
  /**
   * What goes under the title instead of paragraphs — a picture and a few short rows (08.11). It
   * brings its own space above it, as a `RangeTrack` does.
   */
  content?: ReactNode;
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
  paragraphs = [],
  content,
  onNext,
  onSkip,
}: CoachmarkProps) {
  const window = useWindowDimensions();
  const isLast = step >= total;
  const ring = anchor === null ? null : ringRect(anchor, SPACING['space/dots']);

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
                {...strokeRect(ring)}
                rx={ringRadius(ring, radius) - BORDER_WIDTHS['border/emphasis'] / 2}
                fill="none"
                stroke={COLORS['text/primary']}
                strokeWidth={BORDER_WIDTHS['border/emphasis']}
              />
            </>
          )}
        </Svg>
        {/* Swallows touches: nothing under the dim answers while a step is on screen. */}
        <View style={styles.fill} />
        <AnchoredPlate
          testID="coachmark"
          anchor={ring}
          arrowSize={SIZES['size/coachmark-arrow']}
          arrowRadius={RADII['radius/arrow']}
          distance={SPACING['space/screen']}
        >
          <Text style={styles.counter}>{`${step} of ${total}`}</Text>
          <Text style={styles.title}>{title}</Text>
          {content}
          {paragraphs.map((paragraph, index) => (
            <PlateText
              key={index}
              parts={typeof paragraph === 'string' ? [paragraph] : paragraph}
              style={[styles.paragraph, index === 0 && styles.firstParagraph]}
            />
          ))}
          <View style={styles.footer}>
            {isLast ? (
              <View />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={onSkip}
                style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
              >
                <Text style={styles.skipLabel}>Skip</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={onNext}
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

/** The ring's stroke sits inside its box, so it is drawn on the box pulled in by half of it. */
function strokeRect(box: AnchorRect) {
  return ringStrokeRect(box, BORDER_WIDTHS['border/emphasis']);
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
  },
  // 13 like a column label, without its capitals and tracking (08.11).
  counter: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    lineHeight: LINE_HEIGHTS['line-height/caption'],
    color: COLORS['text/muted'],
  },
  title: {
    marginTop: SPACING['space/dots'],
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    lineHeight: LINE_HEIGHTS['line-height/title'],
    color: COLORS['text/primary'],
  },
  // The mockup has six under the title and eight above the buttons; Artem asked for a little more
  // air at both (06.10.2026): `space/gap` under the title, `space/row` above the buttons. Between
  // paragraphs it stays eight.
  firstParagraph: {
    marginTop: SPACING['space/gap'],
  },
  // The paragraph's own type is `PlateText`'s; only the gap above it is the bubble's.
  paragraph: {
    marginTop: SPACING['space/gap-tight'],
  },
  footer: {
    marginTop: SPACING['space/row'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Both buttons are the full 44pt tall — their own touch area, no slop needed.
  skip: {
    minHeight: SIZES['size/tap-target'],
    justifyContent: 'center',
  },
  skipLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/muted'],
  },
  next: {
    minHeight: SIZES['size/tap-target'],
    justifyContent: 'center',
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/coachmark-button'],
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
