// What `N RIR` means, in the words 08.11 · Onboarding gives it — the one explanation behind the RIR
// badge's popover (GT-40) and the first coachmark of the first workout (GT-42), so the two cannot
// drift apart. Reworded in GT-149 to say what to do, not only what the term means.
//
// It is a picture and a few short theses rather than a paragraph (Artem, 06.10.2026): a track that
// shows the reserve — the set you do, then the reps you leave in the tank, up to failure — and a
// row or two under it with what to aim for and how the weeks go.

import type { PlateTextPart } from '@design/components/PlateRow';
import type { ExerciseType } from '@domain/catalog';
import type { PowerLoad } from '@domain/exerciseConfig';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { RangeTrackLabel, RangeTrackRange } from '@design/components/RangeTrack';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { StopIcon } from '@design/icons/StopIcon';

/** The track: the set you do (solid), what is left in the tank (dashes), and where you stop. */
export type RirTrack = {
  outer: RangeTrackRange;
  inner: RangeTrackRange;
  marker: number;
  labels: RangeTrackLabel[];
  accessibilityLabel: string;
};

export type RirRow = { icon: IconComponent; text: PlateTextPart[] };

export type RirExplanation = {
  title: string;
  track: RirTrack;
  rows: RirRow[];
};

/**
 * What a badge's popover shows: the RIR explanation, or — with no track — the plate of an exercise
 * that has no RIR to draw, a power exercise on a deload week.
 */
export type BadgeExplanation = Omit<RirExplanation, 'track'> & { track?: RirTrack };

// How long the set you do is drawn, in the track's own units — arbitrary, but the reserve is drawn
// to the same scale, so the picture is honest: 3 RIR leaves a bit under a quarter of the track in
// the tank, 2 RIR less, 1 RIR a sliver, and the set is the rest. A bigger reserve once looked like a
// half-hearted set (a reserve padded to fit its labels read as "work to 55%"); the labels are
// placed to fit the real proportion instead, 'Stop here' ending at its point so it never meets
// 'Failure' under the end.
const SET_UNITS = 10;

/** The track for a reserve of `reserve` reps: failure at the end, the stop where the reserve begins. */
export function rirTrack(reserve: number): RirTrack {
  if (reserve <= 0) {
    // No reserve: you stop at failure, so there is one point to name and not two.
    return {
      outer: { min: 0, max: SET_UNITS },
      inner: { min: 0, max: SET_UNITS },
      marker: SET_UNITS,
      labels: [{ value: SET_UNITS, text: 'Failure' }],
      accessibilityLabel: 'No reps in reserve: you stop at failure',
    };
  }
  const end = SET_UNITS + reserve;
  return {
    outer: { min: 0, max: end },
    inner: { min: 0, max: SET_UNITS },
    marker: SET_UNITS,
    labels: [
      { value: SET_UNITS, text: 'Stop here', align: 'end' },
      { value: end, text: 'Failure' },
    ],
    accessibilityLabel: `${reserve} ${reserve === 1 ? 'rep' : 'reps'} in reserve: you stop before failure`,
  };
}

export type RirExplanationInput = {
  /** The exercise's target RIR this week. */
  targetRir: number;
  /** A deload session: lighter on purpose, so the text says not to push rather than what RIR is. */
  isDeload: boolean;
};

export type DeloadExplanationInput = {
  type?: ExerciseType;
  powerLoad?: PowerLoad;
  /** The deload week's target RIR, when the exercise has one on screen. */
  targetRir?: number;
};

/**
 * What the Deload badge says (the badge that takes the RIR badge's place on a deload week, for
 * every type): a strength exercise keeps the RIR plate it always had; a power exercise has no RIR,
 * so it says what actually changes for it — stop well before the speed drops, and by its load:
 * kilograms halve, a level and the body stay, and never more than two sets. Interval comes with
 * its own rule (GT-100).
 */
export function deloadExplanation({
  type,
  powerLoad,
  targetRir,
}: DeloadExplanationInput): BadgeExplanation {
  if (type !== 'power') {
    return rirExplanation({
      targetRir: targetRir ?? defaultProgressionSettings.deloadRir,
      isDeload: true,
    });
  }
  const load: RirRow['text'] =
    powerLoad === 'level'
      ? ['Same level, ', { strong: 'two sets' }, ' at most.']
      : powerLoad === 'none'
        ? ['Same body weight, ', { strong: 'two sets' }, ' at most.']
        : ['About ', { strong: 'half your usual load' }, ', two sets at most.'];
  return {
    title: 'Deload week',
    rows: [
      {
        icon: StopIcon,
        text: ['Stop each set ', { strong: 'well before the speed drops' }, '.'],
      },
      { icon: ArrowDownIcon, text: load },
    ],
  };
}

function repsLeft(reserve: number): string {
  return `${reserve} ${reserve === 1 ? 'rep' : 'reps'}`;
}

export function rirExplanation({ targetRir, isDeload }: RirExplanationInput): RirExplanation {
  const track = rirTrack(targetRir);

  if (isDeload) {
    return {
      title: 'Deload week',
      track,
      rows: [
        {
          icon: StopIcon,
          text: [
            "Don't push: aim to finish each set with ",
            { strong: `about ${repsLeft(targetRir)} left` },
            '.',
          ],
        },
      ],
    };
  }

  // Two theses, and no more: this explains RIR and what to aim for, not the engine around it — how
  // rep targets work is the Reps ⓘ's to say (Artem, 06.10.2026).
  const aim: RirRow['text'] =
    targetRir === 0
      ? [
          'Your target for every set of this exercise: go until you ',
          { strong: "can't do another rep" },
          '.',
        ]
      : [
          'Your target for every set of this exercise: stop with about ',
          { strong: `${repsLeft(targetRir)} left` },
          '.',
        ];
  return {
    title:
      targetRir === 0
        ? '0 RIR: go to failure'
        : `${targetRir} RIR: stop ${repsLeft(targetRir)} before failure`,
    track,
    rows: [
      { icon: StopIcon, text: aim },
      {
        icon: ArrowDownIcon,
        text: [
          'Every week gets closer to failure. The last one is a lighter ',
          { strong: 'deload' },
          '.',
        ],
      },
    ],
  };
}
