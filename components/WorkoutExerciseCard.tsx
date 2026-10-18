// Exercise card — 08.7 · Тренировка, "Карточка упражнения" (task 092); 10.1 FR-14. One unit of the
// workout screen's list, drawn by its type's own card: the screen gives every card the same props
// and this picks the card, the way `policyFor` picks a progression policy
// (`domain/progressionPolicies.ts`). The `switch` covers every type, so a new `ExerciseType` doesn't
// compile until it is given a card.
//
// What every card shares — the chip above it, the frame, the title row — is ExerciseCardFrame, the
// header over its rows ExerciseColumnHeader, and the set rows of strength and power WorkoutSetRows.
// Interval and mobility are shown as strength until their stories, as they run strength's
// progression for now.
//
// The props come in groups: what every card needs, then what each kind of card acts with — `sets`
// for a card of set rows, `ceiling` for power's ceiling note. A type that logs something else
// (interval rounds, a mobility duration) adds its own group rather than a branch on the screen.

import type { ReactElement, Ref } from 'react';
import type { View } from 'react-native';

import type { ActionMenuItem } from '@design/components/ActionMenu';
import type { WorkoutMode } from '@domain/workoutView';
import type { WorkoutExercise } from '@usecases/workoutSession';

import { PowerExerciseCard } from './PowerExerciseCard';
import { StrengthExerciseCard } from './StrengthExerciseCard';
import type { CardChip } from './WorkoutExerciseCardLogic';
import type { SetLoggingProps } from './WorkoutSetRows';

export type CardCoachmarkTargets = {
  rir: Ref<View>;
  weight: Ref<View>;
  reps: Ref<View>;
};

/** What every card takes, whatever its type. */
export type ExerciseCardCommonProps = {
  mode: WorkoutMode;
  /** A deload session: the `Deload` chip in place of RIR, and no ⓘ on the Weight header (08.11). */
  isDeload?: boolean;
  /**
   * The visible parts the first-workout coachmarks point at (GT-42): the RIR chip and the two ⓘ
   * discs. Only the first card gets them; the rest of the tour is the screen's.
   */
  coachmarkTargets?: CardCoachmarkTargets;
  /** The chip above the card — see `cardChip`. */
  chip?: CardChip;
  /**
   * The card's place in the list. Only the native `⋯` menu reads it, as its `key`: a card keeps
   * its identity when Move up/down reorders the list, and the SwiftUI host inside it then glides
   * from the old position to the new one with its own spring while the card itself jumps (GT-142).
   * A new key mounts the menu where the card now is.
   */
  position?: number;
  /** Opens "История упражнения" (06). */
  onOpenHistory: () => void;
  /**
   * What the card's `⋯` offers (08.7, "Меню упражнения") — the menu opens out of the button
   * itself (117), so the card holds the actions rather than an `onOpenMenu` that raised a sheet
   * elsewhere. Live mode only; the button isn't there otherwise.
   */
  menuItems: ActionMenuItem[];
  /** A log or un-log is being saved — every Log box waits for it. */
  isSaving: boolean;
};

/** The links of power's ceiling note (10.2 P6–P9, GT-81). Live mode only. */
export type CeilingActions = {
  /** The user said there is nothing heavier to take (10.2 P9). */
  onSetNoHeavierAvailable?: () => void;
  /** Opens the replace flow — the note's second link once the load option is a harder variation. */
  onReplaceExercise?: () => void;
  /** Closes the ceiling note for good — its third link, with the harder variation (GT-81). */
  onHideCeilingTip?: () => void;
};

export type WorkoutExerciseCardProps = ExerciseCardCommonProps & {
  exercise: WorkoutExercise;
  /** Logging the set rows — strength and power. */
  sets: SetLoggingProps;
  /** Power only. */
  ceiling?: CeilingActions;
};

export function WorkoutExerciseCard({
  exercise,
  sets,
  ceiling,
  ...common
}: WorkoutExerciseCardProps): ReactElement {
  switch (exercise.type) {
    case 'power':
      return (
        <PowerExerciseCard
          exercise={exercise}
          sets={sets}
          {...(ceiling !== undefined ? { ceiling } : {})}
          {...common}
        />
      );
    case undefined:
    case 'strength':
    case 'interval':
    case 'mobility':
      return <StrengthExerciseCard exercise={exercise} sets={sets} {...common} />;
  }
}
