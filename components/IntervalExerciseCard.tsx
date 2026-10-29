// Interval card — 10.1 FR-14, "Interval"; canvas 1.4 and 1.6 (GT-88). The rounds are the plan:
// there is no separate plan block, just Round · Work · Rest · Log, the ⓘ beside whichever column
// the lever moves (FR-8), and Start timer under the rounds. The chip above it says `Timed work` when
// the type changes (`cardChip`), and the frame, title row and `⋯` are every card's
// (ExerciseCardFrame). The rounds themselves — their fields, Log and Start timer — are
// IntervalRoundRows, keyed by the exercise so a replaced one starts over from its own plan.
//
// The header stands on the set rows' grid, so its columns line up with every other card's: the
// indicator column is there, empty, as over power's guided rows.
// JSX/rendering only — pure helpers live in IntervalExerciseCardLogic.ts, per the code-style skill.

import { Popover } from '@design/components/Popover';
import { getEquipmentLabel } from '@design/equipmentLabel';
import type { IntervalWorkoutExercise } from '@usecases/workoutSession';

import { ExerciseCardFrame } from './ExerciseCardFrame';
import { ExerciseColumnHeader } from './ExerciseColumnHeader';
import {
  intervalProgressionPlate,
  progressionInfoLabel,
  REST_COLUMN,
  ROUND_COLUMN,
  WORK_COLUMN,
} from './IntervalExerciseCardLogic';
import { IntervalRoundRows, type RoundActions } from './IntervalRoundRows';
import { RirExplanationContent } from './RirExplanationContent';
import { usePopoverAnchor } from './usePopoverAnchor';
import type { ExerciseCardCommonProps } from './WorkoutExerciseCard';
import { cardRowsOf, exerciseCardView } from './WorkoutExerciseCardLogic';
import { exerciseLogCounts, formatExerciseMenuSubtitle } from './WorkoutExerciseMenuLogic';

export type { RoundActions } from './IntervalRoundRows';

export type IntervalExerciseCardProps = ExerciseCardCommonProps & {
  exercise: IntervalWorkoutExercise;
  rounds?: RoundActions;
};

export function IntervalExerciseCard({
  exercise,
  mode,
  chip,
  position = 0,
  onOpenHistory,
  menuItems,
  isSaving,
  rounds,
}: IntervalExerciseCardProps) {
  // No RIR, and no Deload badge yet: an interval's deload (fewer rounds, FR-13) isn't planned by
  // the engine until its own task, and a badge would promise it.
  const view = exerciseCardView(mode, exercise, cardRowsOf(exercise.rounds));
  const editable = mode === 'live' && !view.isNotDone;
  const progression = exercise.progression;
  const infoAnchor = usePopoverAnchor();
  const progressionInfo = progression !== undefined && {
    buttonRef: infoAnchor.ref,
    accessibilityLabel: progressionInfoLabel(progression),
    open: infoAnchor.visible,
    onPress: infoAnchor.open,
  };
  const plate =
    progression === undefined ? undefined : intervalProgressionPlate(progression, exercise.rounds);

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
      menuItems={menuItems}
      menuSubtitle={formatExerciseMenuSubtitle(exerciseLogCounts(exercise))}
      overlays={
        plate !== undefined && (
          <Popover
            visible={infoAnchor.visible}
            onClose={infoAnchor.close}
            anchor={infoAnchor.anchor}
            title={plate.title}
          >
            <RirExplanationContent explanation={plate} />
          </Popover>
        )
      }
    >
      {view.showRows && (
        <ExerciseColumnHeader
          columns={[
            { label: ROUND_COLUMN },
            {
              label: WORK_COLUMN,
              ...(progression?.column === 'work' && progressionInfo
                ? { info: progressionInfo }
                : {}),
            },
            {
              label: REST_COLUMN,
              ...(progression?.column === 'rest' && progressionInfo
                ? { info: progressionInfo }
                : {}),
            },
          ]}
        />
      )}
      {view.showRows && (
        <IntervalRoundRows
          key={exercise.exerciseId}
          sessionExerciseId={exercise.sessionExerciseId}
          rounds={exercise.rounds}
          editable={editable}
          isSaving={isSaving}
          {...(rounds !== undefined ? { actions: rounds } : {})}
        />
      )}
    </ExerciseCardFrame>
  );
}
