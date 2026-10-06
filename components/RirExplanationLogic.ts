// What `N RIR` means, in the words 08.11 · Onboarding gives it — the one explanation behind the RIR
// badge's popover (GT-40) and the first coachmark of the first workout (GT-42), so the two cannot
// drift apart. Working text, reworded after the TestFlight feedback.
//
// It is a picture and a few short theses rather than a paragraph (Artem, 06.10.2026): a track that
// shows the reserve — the set you do, then the reps you leave in the tank, up to failure — and a
// row or two under it with the one thing to do and the one thing that changes.

import type { PlateTextPart } from '@design/components/PlateRow';
import type { RangeTrackLabel, RangeTrackRange } from '@design/components/RangeTrack';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { InfoIcon } from '@design/icons/InfoIcon';
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

// How long the set you do is drawn, in the track's own units — arbitrary, since reps are not what
// the picture measures; only that there is a stretch of work and then a stretch of reserve.
const SET_UNITS = 6;
// A reserve is drawn this much longer than its reps, so 1 and 2 RIR still leave room for the two
// labels under the track; the order (more RIR, more reserve) is kept, the proportion is not.
const RESERVE_PADDING = 2;

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
  const end = SET_UNITS + reserve + RESERVE_PADDING;
  return {
    outer: { min: 0, max: end },
    inner: { min: 0, max: SET_UNITS },
    marker: SET_UNITS,
    labels: [
      { value: SET_UNITS, text: 'Stop here' },
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
  /**
   * Whether the set next to do has target reps. Without them (week 1, or an exercise with no
   * history) the user is told how to find the reps themselves.
   */
  hasRepTarget: boolean;
};

export function rirExplanation({
  targetRir,
  isDeload,
  hasRepTarget,
}: RirExplanationInput): RirExplanation {
  const track = rirTrack(targetRir);

  if (isDeload) {
    return {
      title: 'Deload week',
      track,
      rows: [
        {
          icon: StopIcon,
          text: ["Don't push: aim to finish each set with ", { strong: `about ${targetRir} reps left` }, '.'],
        },
      ],
    };
  }

  const rows: RirRow[] =
    targetRir === 0
      ? [
          { icon: StopIcon, text: ['Stop a set when ', { strong: "you can't do another rep" }, '.'] },
          {
            icon: ArrowDownIcon,
            text: ['The number drops each week, and this is the ', { strong: 'last' }, ' one.'],
          },
        ]
      : [
          { icon: StopIcon, text: ['Stop a set when ', { strong: `about ${targetRir} reps are left` }, '.'] },
          {
            icon: ArrowDownIcon,
            text: ['It drops each week; the last one is ', { strong: 'failure' }, '.'],
          },
        ];
  if (!hasRepTarget) {
    rows.push({
      icon: InfoIcon,
      text: [
        'No rep target yet. Do as many reps as it takes to reach ',
        { strong: `${targetRir} RIR` },
        ' and enter them.',
      ],
    });
  }

  return {
    title:
      targetRir === 0
        ? '0 RIR means no reps in reserve'
        : `${targetRir} RIR means ${targetRir} ${targetRir === 1 ? 'rep' : 'reps'} in reserve`,
    track,
    rows,
  };
}
