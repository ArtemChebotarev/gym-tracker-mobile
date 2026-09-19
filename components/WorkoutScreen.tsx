// Workout screen frame — 08.7 · Тренировка, "Шапка" (task 091). One layout for all three modes
// (live, read-only, preview — 088's `mode`): the header, the 3pt progress bar, and a single
// ScrollView of exercise cards.
//
// Header: `Week N` + faint `Day N` in RootScreen's title line (the Today tab shows this screen, so
// it shares the root screens' title treatment), the subtitle `date · mesocycle`, a round accent
// check for a completed session only (not pressable), and the grid and `⋯` buttons, which exist in
// every mode. The progress ratio comes straight from the model (088) — nothing is computed here.
//
// The list is one exercise card per exercise (WorkoutExerciseCard, task 092); tasks 093–094 fill in
// the set row inputs and Finish workout.
//
// Presentational: the model and every outcome come in as props from the Today tab
// (app/(tabs)/index.tsx), which shows every session — the current one or a picked day.
// JSX/rendering only — styles live in WorkoutScreenStyles.ts and pure helpers in
// WorkoutScreenLogic.ts, per the code-style skill.

import { ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
import { ProgressBar } from '@design/components/ProgressBar';
import { RootScreen } from '@design/components/RootScreen';
import { CheckIcon } from '@design/icons/CheckIcon';
import { GridIcon } from '@design/icons/GridIcon';
import { MoreIcon } from '@design/icons/MoreIcon';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { WorkoutExercise, WorkoutSessionModel } from '@usecases/workoutSession';

import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import { showsGroupChip } from './WorkoutExerciseCardLogic';
import { formatUnlocksCaption, formatWorkoutSubtitle } from './WorkoutScreenLogic';
import { COMPLETED_CHECK_ICON_SIZE, styles } from './WorkoutScreenStyles';

export type WorkoutScreenProps = {
  model: WorkoutSessionModel | undefined;
  isPending: boolean;
  /** Opens the mesocycle overview sheet (08.7, "Лист «Обзор мезоцикла»"). */
  onOpenGrid: () => void;
  /** Opens the header menu sheet (08.7, "Лист «Меню шапки»"). */
  onOpenMenu: () => void;
  /** Opens an exercise's history (06), from its card. */
  onOpenExerciseHistory: (exercise: WorkoutExercise) => void;
  /** Opens an exercise's menu sheet (08.7, "Лист «Меню упражнения»"), from its card. Live only. */
  onOpenExerciseMenu: (exercise: WorkoutExercise) => void;
  /** The way forward when the session couldn't be loaded. */
  fallbackAction: { label: string; onPress: () => void };
};

export function WorkoutScreen({
  model,
  isPending,
  onOpenGrid,
  onOpenMenu,
  onOpenExerciseHistory,
  onOpenExerciseMenu,
  fallbackAction,
}: WorkoutScreenProps) {
  if (isPending) {
    return (
      <View style={styles.root}>
        <RootScreen title="Workout">
          <Text style={styles.status}>Loading…</Text>
        </RootScreen>
      </View>
    );
  }

  if (model === undefined) {
    return (
      <View style={styles.root}>
        <RootScreen title="Workout">
          <EmptyState
            title="Pick another workout"
            description="This workout isn't available anymore. Choose another day to train."
            actionLabel={fallbackAction.label}
            onAction={fallbackAction.onPress}
          />
        </RootScreen>
      </View>
    );
  }

  const { header } = model;

  return (
    <View style={styles.root}>
      <RootScreen
        title={`Week ${header.weekNumber}`}
        titleSuffix={`Day ${header.dayNumber}`}
        titleAccessory={
          header.isCompleted && (
            <View
              testID="workout-completed-check"
              accessible
              accessibilityLabel="Completed"
              style={styles.completedCheck}
            >
              <CheckIcon size={COMPLETED_CHECK_ICON_SIZE} color={COLORS['accent/on']} />
            </View>
          )
        }
        subtitle={formatWorkoutSubtitle(header)}
        trailing={
          <View style={styles.actions}>
            <IconButton accessibilityLabel="Mesocycle overview" onPress={onOpenGrid}>
              <GridIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
            </IconButton>
            <IconButton accessibilityLabel="Workout menu" onPress={onOpenMenu}>
              <MoreIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
            </IconButton>
          </View>
        }
      >
        <ProgressBar value={model.progress} accessibilityLabel="Workout progress" />
        <ScrollView contentContainerStyle={styles.content}>
          {model.exercises.map((exercise, index) => (
            <WorkoutExerciseCard
              key={exercise.sessionExerciseId}
              exercise={exercise}
              mode={model.mode}
              showGroupChip={showsGroupChip(model.exercises, index)}
              onOpenHistory={() => onOpenExerciseHistory(exercise)}
              onOpenMenu={() => onOpenExerciseMenu(exercise)}
            />
          ))}
          {model.unlocksAfter !== undefined && (
            <Text style={styles.unlocksCaption}>{formatUnlocksCaption(model.unlocksAfter)}</Text>
          )}
        </ScrollView>
      </RootScreen>
    </View>
  );
}
