// What `N RIR` means, in the words 08.11 · Onboarding gives it — the one explanation behind the RIR
// badge's popover (GT-40) and the first coachmark of the first workout (GT-42), so the two cannot
// drift apart. Reworded in GT-149 to say what to do, not only what the term means.
//
// It is a picture and a few short theses rather than a paragraph (Artem, 06.10.2026): a track that
// shows the reserve — the set you do, then the reps you leave in the tank, up to failure — and a
// row or two under it with what to aim for and how the weeks go.

import type { PlateTextPart } from '@design/components/PlateRow';
import { isPureBodyWeight, usesAddedWeight } from '@domain/bodyWeightLoad';
import type { Equipment, ExerciseType } from '@domain/catalog';
import { DELOAD_LOAD_FACTOR } from '@domain/deloadLoad';
import type { PowerLoad } from '@domain/exerciseConfig';
import type { RangeTrackLabel, RangeTrackRange } from '@design/components/RangeTrack';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { TargetIcon } from '@design/icons/TargetIcon';

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
 * What a badge's popover shows: the RIR explanation, or — with no track — the Deload badge's plate,
 * which has no RIR to draw.
 */
export type BadgeExplanation = Omit<RirExplanation, 'track'> & { track?: RirTrack };

// How long the set you do is drawn, in the track's own units — arbitrary, but the reserve is drawn
// to the same scale, so the picture is honest: 3 RIR leaves a bit under a quarter of the track in
// the tank, 2 RIR less, 1 RIR a sliver, and the set is the rest. A bigger reserve once looked like a
// half-hearted set (a reserve padded to fit its labels read as "work to 55%"); the labels are
// placed to fit the real proportion instead, 'Stop here' ending at its point so it never meets
// 'Failure' under the end.
const SET_UNITS = 10;

// The share as the plate says it, so the copy moves with the rule.
const DELOAD_LOAD_PERCENT = Math.round(DELOAD_LOAD_FACTOR * 100);

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
};

export type DeloadExplanationInput = {
  type?: ExerciseType;
  powerLoad?: PowerLoad;
  /** What the exercise's weight means (`cardLoadEquipment`): it decides what a strength deload cuts. */
  equipment?: Equipment;
};

const DONT_PUSH: RirRow['text'] = ["Don't push: ", { strong: 'this week is for recovery' }, '.'];

const STOP_BEFORE_SPEED_DROPS: RirRow['text'] = [
  'Stop each set ',
  { strong: 'well before the speed drops' },
  '.',
];

function deloadLoadText({ type, powerLoad, equipment }: DeloadExplanationInput): RirRow['text'] {
  const percent = `${DELOAD_LOAD_PERCENT}%`;
  if (type === 'interval') {
    return ['About ', { strong: `${percent} of your usual work time` }, ', two rounds at most.'];
  }
  if (type === 'power') {
    if (powerLoad === 'level') {
      return [
        'About ',
        { strong: `${percent} of the reps` },
        ' you did last week, same level, two sets at most.',
      ];
    }
    return powerLoad === 'none'
      ? ['About ', { strong: `${percent} of the reps` }, ' you did last week, two sets at most.']
      : ['About ', { strong: `${percent} of your usual load` }, ', two sets at most.'];
  }
  if (usesAddedWeight(equipment)) {
    return [
      'About ',
      { strong: `${percent} of the added weight` },
      ` and ${percent} of the reps, fewer sets.`,
    ];
  }
  return isPureBodyWeight(equipment)
    ? ['About ', { strong: `${percent} of the reps` }, ' you did last week, fewer sets.']
    : ['About ', { strong: `${percent} of your usual load` }, ', fewer sets.'];
}

/**
 * What the Deload badge says (the badge that takes the RIR badge's place on a deload week, for
 * every type). No type draws RIR here: the week is set by its load, and the reserve that leaves
 * varies too much for a number to promise (GT-209). So it says how to take the sets, and what is
 * cut for this exercise's kind of load.
 */
export function deloadExplanation(input: DeloadExplanationInput): BadgeExplanation {
  return {
    title: 'Deload week',
    rows: [
      { icon: TargetIcon, text: input.type === 'power' ? STOP_BEFORE_SPEED_DROPS : DONT_PUSH },
      { icon: ArrowDownIcon, text: deloadLoadText(input) },
    ],
  };
}

function repsLeft(reserve: number): string {
  return `${reserve} ${reserve === 1 ? 'rep' : 'reps'}`;
}

export function rirExplanation({ targetRir }: RirExplanationInput): RirExplanation {
  const track = rirTrack(targetRir);

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
      { icon: TargetIcon, text: aim },
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
