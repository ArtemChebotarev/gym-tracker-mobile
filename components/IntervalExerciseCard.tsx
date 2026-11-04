// Interval card — 10.1 FR-14, "Interval"; canvas 1.4 and 1.6 (GT-88). The rounds are the plan:
// there is no separate plan block, just Work · Rest · Log, the ⓘ always beside Work (08.11, "Timed
// work: Work ⓘ"), and Start timer under the rounds. The chip above it says `Intervals` when
// the type changes (`cardChip`), and the frame, title row and `⋯` are every card's
// (ExerciseCardFrame). The rounds themselves — their fields, Log and Start timer — are
// IntervalRoundRows, keyed by the exercise so a replaced one starts over from its own plan.
//
// The header stands on the set rows' grid, so its columns line up with every other card's: the
// indicator column is there, empty, as over power's guided rows.
// JSX/rendering only — pure helpers live in IntervalExerciseCardLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { Chip } from '@design/components/Chip';
import { PlateText, type PlateTextPart } from '@design/components/PlateText';
import { Popover } from '@design/components/Popover';
import { getEquipmentLabel } from '@design/equipmentLabel';
import type { AnchorRect } from '@design/popoverLayout';
import { SIZES } from '@design/tokens';
import type { IntervalWorkoutExercise } from '@usecases/workoutSession';

import { ExerciseCardFrame } from './ExerciseCardFrame';
import { ExerciseColumnHeader } from './ExerciseColumnHeader';
import {
  FINDING_TIME_ROWS,
  FINDING_TIME_TITLE,
  intervalInfo,
  REST_COLUMN,
  WORK_COLUMN,
} from './IntervalExerciseCardLogic';
import { styles } from './IntervalExerciseCardStyles';
import { IntervalRoundRows, type RoundActions } from './IntervalRoundRows';
import { RirBadge } from './RirBadge';
import { RirExplanationContent } from './RirExplanationContent';
import { deloadExplanation } from './RirExplanationLogic';
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
  isDeload = false,
  coachmarkTargets,
  chip,
  position = 0,
  onOpenHistory,
  onOpenOverview,
  menuItems,
  isSaving,
  rounds,
}: IntervalExerciseCardProps) {
  const view = exerciseCardView(mode, exercise, cardRowsOf(exercise.rounds), isDeload);
  const editable = mode === 'live' && !view.isNotDone;
  const info = intervalInfo(exercise.rounds, exercise.progression, mode, isDeload);
  const infoAnchor = usePopoverAnchor();

  return (
    <ExerciseCardFrame
      {...(coachmarkTargets?.card !== undefined ? { cardRef: coachmarkTargets.card } : {})}
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
      badges={
        view.deloadLabel !== undefined && (
          <RirBadge
            testID="exercise-deload"
            accessibilityLabel="Deload, what changes this week?"
            label={view.deloadLabel}
            explanation={deloadExplanation({ type: 'interval' })}
          />
        )
      }
      overlays={
        <>
          {info?.kind === 'progression' && (
            <Popover
              visible={infoAnchor.visible}
              onClose={infoAnchor.close}
              anchor={infoAnchor.anchor}
              title={info.plate.title}
            >
              <RirExplanationContent explanation={info.plate} />
            </Popover>
          )}
          {info?.kind === 'finding-time' && (
            <FindingTimePopover
              {...(info.progressionLine !== undefined
                ? { progressionLine: info.progressionLine }
                : {})}
              visible={infoAnchor.visible}
              anchor={infoAnchor.anchor}
              onClose={infoAnchor.close}
            />
          )}
        </>
      }
    >
      {view.showRows && (
        <ExerciseColumnHeader
          columns={[
            {
              label: WORK_COLUMN,
              ...(info !== undefined
                ? {
                    info: {
                      buttonRef: infoAnchor.ref,
                      ...(coachmarkTargets?.weight !== undefined
                        ? { discRef: coachmarkTargets.weight }
                        : {}),
                      accessibilityLabel:
                        info.kind === 'progression' ? info.accessibilityLabel : FINDING_TIME_TITLE,
                      open: infoAnchor.visible,
                      onPress: infoAnchor.open,
                    },
                  }
                : {}),
            },
            { label: REST_COLUMN },
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

/** The ⓘ's plate while a round has no time: what to go by in each field, and the step if any. */
function FindingTimePopover({
  progressionLine,
  visible,
  anchor,
  onClose,
}: {
  progressionLine?: PlateTextPart[];
  visible: boolean;
  anchor: AnchorRect | null;
  onClose: () => void;
}) {
  return (
    <Popover visible={visible} onClose={onClose} anchor={anchor} title={FINDING_TIME_TITLE}>
      <View style={styles.findingRows}>
        {FINDING_TIME_ROWS.map((row) => (
          <View key={row.chip} style={styles.findingRow}>
            <Chip variant="static" label={row.chip} compact width={SIZES['size/plate-chip']} />
            <Text style={styles.findingText}>{row.text}</Text>
          </View>
        ))}
      </View>
      {progressionLine !== undefined && (
        <PlateText parts={progressionLine} style={styles.findingProgression} />
      )}
    </Popover>
  );
}
