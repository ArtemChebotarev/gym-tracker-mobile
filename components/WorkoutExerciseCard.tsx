// Exercise card — 08.7 · Тренировка, "Карточка упражнения" (task 092). One unit of the workout
// screen's list: the muscle-group chip (only when the group changed from the previous card), the
// name, equipment, the `N RIR` badge, the history button, `⋯` in live mode only, the `Weight, kg` ·
// `Reps` · `Log` column header, and the set rows. Which of these show is `exerciseCardView`'s call
// (WorkoutExerciseCardLogic.ts): live, read-only, skipped (50% opacity, logged rows plus one
// `Skipped` row), or preview (the `Not programmed yet` plate, no RIR badge, no rows).
//
// The set rows here are static — they show the row's values, but nothing can be typed or logged
// yet; task 093 replaces `SetRow` with the real inputs and the Log toggle.
//
// Presentational: the exercise, the screen mode, and the button handlers come in as props.
// JSX/rendering only — styles live in WorkoutExerciseCardStyles.ts and pure helpers in
// WorkoutExerciseCardLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { Badge } from '@design/components/Badge';
import { IconButton } from '@design/components/IconButton';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { CheckIcon } from '@design/icons/CheckIcon';
import { HistoryIcon } from '@design/icons/HistoryIcon';
import { InfoIcon } from '@design/icons/InfoIcon';
import { MoreIcon } from '@design/icons/MoreIcon';
import { getMuscleGroupChipColors } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { MuscleGroup } from '@domain/catalog';
import type { WorkoutMode } from '@domain/workoutView';
import type { WorkoutExercise, WorkoutSetRow } from '@usecases/workoutSession';

import {
  exerciseCardView,
  formatIndicator,
  formatRowWeight,
  repsPlaceholder,
} from './WorkoutExerciseCardLogic';
import { INFO_ICON_SIZE, LOG_CHECK_ICON_SIZE, styles } from './WorkoutExerciseCardStyles';

export type WorkoutExerciseCardProps = {
  exercise: WorkoutExercise;
  mode: WorkoutMode;
  /** The group chip above the card — see `showsGroupChip`. */
  showGroupChip: boolean;
  /** Opens "История упражнения" (06). */
  onOpenHistory: () => void;
  /** Opens the "Меню упражнения" sheet. Live mode only — the button isn't there otherwise. */
  onOpenMenu: () => void;
};

export function WorkoutExerciseCard({
  exercise,
  mode,
  showGroupChip,
  onOpenHistory,
  onOpenMenu,
}: WorkoutExerciseCardProps) {
  const view = exerciseCardView(mode, exercise);

  return (
    <View style={styles.root}>
      {showGroupChip && <GroupChip muscleGroup={exercise.muscleGroup} />}
      <View
        testID={`exercise-card-${exercise.sessionExerciseId}`}
        style={[styles.card, view.isSkipped && styles.skipped]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.name}>{exercise.name}</Text>
            {exercise.equipment !== undefined && (
              <Text style={styles.equipment}>{getEquipmentLabel(exercise.equipment)}</Text>
            )}
          </View>
          <View style={styles.titleActions}>
            {view.rirLabel !== undefined && <Badge label={view.rirLabel} />}
            <IconButton accessibilityLabel={`${exercise.name} history`} onPress={onOpenHistory}>
              <HistoryIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
            </IconButton>
            {view.showMenu && (
              <IconButton accessibilityLabel={`${exercise.name} menu`} onPress={onOpenMenu}>
                <MoreIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
              </IconButton>
            )}
          </View>
        </View>

        {view.showNotProgrammed && (
          <View style={styles.notProgrammed}>
            <InfoIcon size={INFO_ICON_SIZE} color={COLORS['text/muted']} />
            <Text style={styles.notProgrammedText}>Not programmed yet</Text>
          </View>
        )}

        {view.showSets && (
          <>
            <View style={styles.row}>
              <View style={styles.setNumberColumn} />
              <Text style={[styles.valueColumn, styles.columnLabel]}>Weight, kg</Text>
              <Text style={[styles.valueColumn, styles.columnLabel]}>Reps</Text>
              <View style={styles.logColumn}>
                <Text style={styles.columnLabel}>Log</Text>
              </View>
            </View>
            {exercise.rows.map((row) => (
              <SetRow key={row.setNumber} row={row} targetRir={exercise.targetRir} />
            ))}
            {exercise.hasSkippedRows && <Text style={styles.skippedRow}>Skipped</Text>}
          </>
        )}
      </View>
    </View>
  );
}

function GroupChip({ muscleGroup }: { muscleGroup: MuscleGroup }) {
  const colors = getMuscleGroupChipColors(muscleGroup);

  return (
    <View
      testID="exercise-group-chip"
      style={[styles.groupChip, { backgroundColor: colors.tint ?? COLORS['surface/card'] }]}
    >
      {colors.dot !== undefined && (
        <View style={[styles.groupDot, { backgroundColor: colors.dot }]} />
      )}
      <Text style={[styles.groupLabel, { color: colors.text ?? COLORS['text/secondary'] }]}>
        {getMuscleGroupLabel(muscleGroup)}
      </Text>
    </View>
  );
}

type SetRowProps = {
  row: WorkoutSetRow;
  targetRir: number | undefined;
};

// Static stand-in for the set row — task 093 turns the fields into inputs and the Log box into the
// logging toggle.
function SetRow({ row, targetRir }: SetRowProps) {
  const { log } = row;

  return (
    <View testID={`set-row-${row.setNumber}`} style={styles.row}>
      <Text style={[styles.setNumberColumn, styles.setNumber]}>{row.setNumber}</Text>
      {log ? (
        <>
          <View style={[styles.valueColumn, styles.loggedValue]}>
            <Text style={styles.value}>{formatRowWeight(log.weight)}</Text>
          </View>
          <View style={[styles.valueColumn, styles.loggedValue]}>
            <View style={styles.repsValue}>
              <Text style={styles.value}>{log.reps}</Text>
              {row.indicator !== undefined && (
                <Text style={styles.indicator}>{formatIndicator(row.indicator)}</Text>
              )}
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={[styles.valueColumn, styles.field]}>
            {row.suggestedWeight !== undefined ? (
              <Text style={styles.value}>{formatRowWeight(row.suggestedWeight)}</Text>
            ) : (
              <Text style={styles.placeholder}>–</Text>
            )}
          </View>
          <View style={[styles.valueColumn, styles.field]}>
            <Text style={styles.placeholder}>{repsPlaceholder(row, targetRir)}</Text>
          </View>
        </>
      )}
      <View style={styles.logColumn}>
        <View
          style={[
            styles.logBox,
            row.isFirstUnlogged && styles.logBoxNext,
            log !== undefined && styles.logBoxLogged,
          ]}
        >
          {log !== undefined && (
            <CheckIcon size={LOG_CHECK_ICON_SIZE} color={COLORS['accent/on']} />
          )}
        </View>
      </View>
    </View>
  );
}
