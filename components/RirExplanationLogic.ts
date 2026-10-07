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

export function rirExplanation({ targetRir, isDeload }: RirExplanationInput): RirExplanation {
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

  // Two theses, and no more: this explains the fact of RIR, not the engine around it — how rep
  // targets work is the Reps ⓘ's to say (Artem, 06.10.2026).
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
  return {
    title:
      targetRir === 0
        ? '0 RIR means no reps in reserve'
        : `${targetRir} RIR means ${targetRir} ${targetRir === 1 ? 'rep' : 'reps'} in reserve`,
    track,
    rows,
  };
}
