// Exercise card — 08.7 · Тренировка, "Карточка упражнения" (task 092). One unit of the workout
// screen's list: the muscle-group chip (only when the group changed from the previous card), the
// name, equipment, the `N RIR` chip, the history button, `⋯` in live mode only, the `Weight, kg` ·
// `Reps` · `Log` column header, and the set rows. Which of these show is `exerciseCardView`'s call
// (WorkoutExerciseCardLogic.ts): live, read-only, skipped (50% opacity; every row, the unlogged ones
// as `Skipped` rows — just one `Skipped` note when nothing was logged), or preview (the `Not programmed yet` plate, no RIR badge, no rows).
//
// Under the title, one line per weight hint (03, rule 3: `↑ Go heavier — 30+ reps last week` /
// `↓ Go lighter — under 5 reps last week`), in live mode only. 08 · Screens & Navigation leaves it
// off in v1; Artem brought it back: without it, a target clamped at the rep corridor's bound (30
// again at the same weight) read as a wrong suggestion.
//
// The set rows are WorkoutSetRow (093); they're editable only in live mode on an exercise that isn't
// skipped — a skipped exercise's rows are read-only until it's unskipped (05).
//
// The RIR is a static `Chip`, not the neutral `Badge` 08.7 names: `Badge` neutral fills with
// `surface/card`, the card's own background, so on the card it read as bare text. The chip's
// `border/default` outline keeps it visibly a chip (Artem's review).
//
// Presentational: the exercise, the screen mode, and the button handlers come in as props.
// JSX/rendering only — styles live in WorkoutExerciseCardStyles.ts and pure helpers in
// WorkoutExerciseCardLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { Chip } from '@design/components/Chip';
import { IconButton } from '@design/components/IconButton';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import { HistoryIcon } from '@design/icons/HistoryIcon';
import { InfoIcon } from '@design/icons/InfoIcon';
import { MoreIcon } from '@design/icons/MoreIcon';
import { getMuscleGroupChipColors } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { MuscleGroup } from '@domain/catalog';
import type { WorkoutMode } from '@domain/workoutView';
import type { WorkoutExercise } from '@usecases/workoutSession';

import { exerciseCardView, formatWeightHint } from './WorkoutExerciseCardLogic';
import { INFO_ICON_SIZE, styles, WEIGHT_HINT_ICON_SIZE } from './WorkoutExerciseCardStyles';
import { WorkoutSetRow } from './WorkoutSetRow';

export type WorkoutExerciseCardProps = {
  exercise: WorkoutExercise;
  mode: WorkoutMode;
  /** The group chip above the card — see `showsGroupChip`. */
  showGroupChip: boolean;
  /** Opens "История упражнения" (06). */
  onOpenHistory: () => void;
  /** Opens the "Меню упражнения" sheet. Live mode only — the button isn't there otherwise. */
  onOpenMenu: () => void;
  /** A log or un-log is being saved — every Log box waits for it. */
  isSaving: boolean;
  onLogSet: (setNumber: number, entry: { weight: number; reps: number }) => void;
  onUnlogSet: (setNumber: number) => void;
};

export function WorkoutExerciseCard({
  exercise,
  mode,
  showGroupChip,
  onOpenHistory,
  onOpenMenu,
  isSaving,
  onLogSet,
  onUnlogSet,
}: WorkoutExerciseCardProps) {
  const view = exerciseCardView(mode, exercise);
  const editable = mode === 'live' && !view.isSkipped;

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
            {view.rirLabel !== undefined && (
              // Chip's own `alignSelf: flex-start` would pin it to the top of the row; the wrapper
              // is what gets centered against the buttons.
              <View testID="exercise-rir">
                <Chip variant="static" label={view.rirLabel} />
              </View>
            )}
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

        {exercise.weightHints?.map((hint) => {
          const Icon = hint.direction === 'increase' ? ArrowUpIcon : ArrowDownIcon;
          return (
            <View key={hint.direction} testID="exercise-weight-hint" style={styles.weightHint}>
              <Icon size={WEIGHT_HINT_ICON_SIZE} color={COLORS['text/secondary']} />
              <Text style={styles.weightHintText}>{formatWeightHint(hint)}</Text>
            </View>
          );
        })}

        {view.showNotProgrammed && (
          <View style={styles.notProgrammed}>
            <InfoIcon size={INFO_ICON_SIZE} color={COLORS['text/muted']} />
            <Text style={styles.notProgrammedText}>Not programmed yet</Text>
          </View>
        )}

        {view.showSets && (
          <View style={styles.headerRow}>
            <Text style={[styles.valueColumn, styles.columnLabel]}>Weight, kg</Text>
            <Text style={[styles.valueColumn, styles.columnLabel]}>Reps</Text>
            <View style={styles.indicatorColumn} />
            <Text style={[styles.logColumn, styles.columnLabel]}>Log</Text>
          </View>
        )}
        {view.showSets &&
          exercise.rows.map((row) => (
            // Keyed by the exercise too: a replaced exercise's rows start fresh from its new
            // targets instead of keeping what was typed for the old one.
            <WorkoutSetRow
              key={`${exercise.exerciseId}-${row.setNumber}`}
              row={row}
              targetRir={exercise.targetRir}
              editable={editable}
              isSaving={isSaving}
              onLog={(entry) => onLogSet(row.setNumber, entry)}
              onUnlog={() => onUnlogSet(row.setNumber)}
            />
          ))}
        {view.showSkippedNote && <Text style={styles.skippedNote}>Skipped</Text>}
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
