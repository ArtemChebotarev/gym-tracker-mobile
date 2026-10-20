// Styles behind components/IntervalTimerScreen.tsx — see the `code-style` skill. Canvas 2.1–2.4.

import { StyleSheet } from 'react-native';

import { circle, roundedBar } from '@design/shapes';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

import type { RoundSegment, TimerTone } from './IntervalTimerScreenLogic';

/** The dial's arc: orange for running time only (FR-6), grey in a rest (canvas 2.2), faint paused. */
export const RING_COLOR: Record<TimerTone, string> = {
  running: COLORS['brand/orange'],
  rest: COLORS['text/secondary'],
  paused: COLORS['text/faint'],
};

/**
 * A round's bar: lime once done and while worked — orange stays the dial's alone (Artem,
 * 20.10.2026) — faint while paused.
 */
export const SEGMENT_COLOR: Record<RoundSegment['tone'], string> = {
  done: COLORS.accent,
  running: COLORS.accent,
  paused: COLORS['text/faint'],
  empty: COLORS['surface/control-active'],
};

/** Swipe down to minimise (GT-97): how far before it takes the drag, how far or fast lets it go. */
export const SWIPE = { activateAfter: 12, distance: 120, velocity: 800 } as const;

export const styles = StyleSheet.create({
  swipe: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
    paddingHorizontal: SPACING['space/sheet'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    paddingTop: SPACING['space/gap'],
    paddingBottom: SPACING['space/sheet'],
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  // As wide as the chevron, so the title sits in the middle of the screen.
  headerBalance: {
    width: SIZES['size/icon-button'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  subtitle: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
  },
  phase: {
    marginTop: SPACING['space/empty-lift'],
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  phasePaused: {
    color: COLORS['text/muted'],
  },
  pill: {
    alignSelf: 'center',
    marginTop: SPACING['space/gap'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/chip-y'],
    borderRadius: RADII['radius/pill'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    fontSize: TYPOGRAPHY['type/footnote'].fontSize,
    color: COLORS['text/secondary'],
  },
  dial: {
    alignItems: 'center',
    marginTop: SPACING['space/sheet'],
  },
  time: {
    fontSize: TYPOGRAPHY['type/timer-clock'].fontSize,
    fontWeight: TYPOGRAPHY['type/timer-clock'].fontWeight,
    fontVariant: ['tabular-nums'],
    color: COLORS['text/primary'],
  },
  timePaused: {
    color: COLORS['text/secondary'],
  },
  of: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
  },
  next: {
    marginTop: SPACING['space/sheet'],
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  controls: {
    marginTop: 'auto',
    gap: SPACING['space/row'],
    paddingBottom: SPACING['space/sheet'],
  },
  roundControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: SPACING['space/row'],
  },
  roundButton: {
    alignItems: 'center',
    gap: SPACING['space/dots'],
  },
  buttonLabel: {
    fontSize: TYPOGRAPHY['type/footnote'].fontSize,
    color: COLORS['text/muted'],
  },
  circle: {
    ...circle(SIZES['size/timer-button']),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
  },
  skip: {
    flex: 1,
    ...roundedBar(SIZES['size/timer-button']),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/gap-tight'],
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
  },
  skipLabel: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  endEarly: {
    alignSelf: 'center',
    minHeight: SIZES['size/icon-button'],
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/screen'],
  },
  endEarlyLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS.danger,
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  summary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/gap'],
  },
  doneMark: {
    ...circle(SIZES['size/brand-mark']),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  summaryRounds: {
    fontSize: TYPOGRAPHY['type/sheet-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/sheet-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  dialogTitle: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  dialogText: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  dialogActions: {
    marginTop: SPACING['space/sheet'],
    gap: SPACING['space/gap'],
  },
});
