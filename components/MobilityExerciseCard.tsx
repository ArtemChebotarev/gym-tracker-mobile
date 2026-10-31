// Mobility card — 10.1 FR-10, FR-14 (GT-107, GT-206). A `Duration · Log` header, one row with the
// block's Duration and Done, and the timer action under it (MobilityBlockRow, keyed by the exercise so
// a replaced one starts over from its own plan). No RIR, no rest after it, nothing to add or remove
// in the menu. The chip above it says `Mobility` when the type changes (`cardChip`), and the
// frame, title row and `⋯` are every card's (ExerciseCardFrame). There is no Cooldown section: the
// card stands where the plan puts it (FR-10).
//
// JSX/rendering only — pure helpers live in MobilityExerciseCardLogic.ts, per the code-style skill.

import { getEquipmentLabel } from '@design/equipmentLabel';
import type { MobilityWorkoutExercise } from '@usecases/workoutSession';

import { ExerciseCardFrame } from './ExerciseCardFrame';
import { ExerciseColumnHeader } from './ExerciseColumnHeader';
import type { RoundActions } from './IntervalRoundRows';
import { MobilityBlockRow } from './MobilityBlockRow';
import { DURATION_COLUMN } from './MobilityExerciseCardLogic';
import type { ExerciseCardCommonProps } from './WorkoutExerciseCard';
import { cardRowsOf, exerciseCardView } from './WorkoutExerciseCardLogic';
import { exerciseLogCounts, formatExerciseMenuSubtitle } from './WorkoutExerciseMenuLogic';

export type MobilityExerciseCardProps = ExerciseCardCommonProps & {
  exercise: MobilityWorkoutExercise;
  rounds?: RoundActions;
};

export function MobilityExerciseCard({
  exercise,
  mode,
  chip,
  position = 0,
  onOpenHistory,
  onOpenOverview,
  menuItems,
  isSaving,
  rounds,
}: MobilityExerciseCardProps) {
  const view = exerciseCardView(mode, exercise, cardRowsOf(exercise.rounds));
  const editable = mode === 'live' && !view.isNotDone;
  const block = exercise.rounds[0];

  return (
    <ExerciseCardFrame
      exercise={exercise}
      view={view}
      {...(exercise.equipment !== undefined
        ? { equipmentLabel: getEquipmentLabel(exercise.equipment) }
        : {})}
      {...(chip !== undefined ? { chip } : {})}
      position={position}
      onOpenHistory={onOpenHistory}
      onOpenOverview={onOpenOverview}
      menuItems={menuItems}
      menuSubtitle={formatExerciseMenuSubtitle(exerciseLogCounts(exercise))}
    >
      {view.showRows && block !== undefined && (
        <ExerciseColumnHeader columns={[{ label: DURATION_COLUMN }]} />
      )}
      {view.showRows && block !== undefined && (
        <MobilityBlockRow
          key={exercise.exerciseId}
          sessionExerciseId={exercise.sessionExerciseId}
          block={block}
          editable={editable}
          isSaving={isSaving}
          {...(rounds !== undefined ? { actions: rounds } : {})}
        />
      )}
    </ExerciseCardFrame>
  );
}
