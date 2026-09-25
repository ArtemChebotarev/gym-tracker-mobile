// Workout screen frame — 08.7 · Тренировка, "Шапка" (task 091). One layout for all four modes
// (live, read-only, history, preview — 088's `mode`): the header, the 3pt progress bar, and a
// single ScrollView of exercise cards.
//
// Header: `Week N` + faint `Day N` in RootScreen's title line (the Today tab shows this screen, so
// it shares the root screens' title treatment), the subtitle `date · mesocycle`, a round accent
// check for a completed session only (not pressable), and the grid and `⋯` buttons, which exist in
// every mode but history (`showsHeaderActions`, 128): a day of a block that has ended is opened
// from that block's detail screen, which is where its grid and its actions live — so the header
// here holds nothing but the title, the subtitle and the way back. A deload session gets a neutral
// `Deload` badge right after the title, ahead of the check — lighter weights and fewer sets
// otherwise read like a mistake. The progress ratio comes straight from the model (088) — nothing
// is computed here.
//
// The `⋯` is an ActionMenu (117): its actions open as a native menu out of the button itself
// rather than as a sheet, so the screen holds the actions (`menuActions`, one handler per action)
// instead of an `onOpenMenu` that only raised one somewhere else. Which of them a given session
// offers — and what each one reads as — is `workoutMenuActions` (096).
//
// The list is one exercise card per exercise (WorkoutExerciseCard, task 092) with its set rows
// (WorkoutSetRow, 093). Under the last card, the primary `Finish workout` button (094) — only when
// the model's `showFinish` says every exercise is `completed` or `skipped`; before that it isn't
// there at all (not disabled). Finishing needs no confirmation: the screen stays put and re-reads
// the session, which is then read-only — the cards drop `⋯`, the rows stop being editable, and the
// header gets its check. All of that follows from the model's `mode`, so nothing here tracks it.
// A read-only session shows a secondary `Next workout` button in the same place when the model has
// a `nextSessionId` — the mesocycle's current session — so moving on after Finish is one tap. A
// history session never has one (088): a block that has ended has no next workout. When
// there is no next session because the block is done, `showFinishMesocycle` puts a primary
// `Finish mesocycle` there instead (052): the block is closed by hand, never on its own, so the
// last workout of a mesocycle ends with the button that ends the mesocycle. Finishing it doesn't
// take the screen anywhere — `Copy current meso` appears in the same place instead, so the block
// you just closed is still the thing on screen when you decide what follows it (Artem, 24.09.2026).
//
// Presentational: the model and every outcome come in as props from the Today tab
// (app/(tabs)/index.tsx), which shows every session — the current one or a picked day. With no
// model, an EmptyState whose copy the tab supplies (no active mesocycle, nothing left, not found).
// JSX/rendering only — styles live in WorkoutScreenStyles.ts and pure helpers in
// WorkoutScreenLogic.ts, per the code-style skill.

import { ScrollView, Text, View } from 'react-native';

import { ActionMenu } from '@design/components/ActionMenu';
import { Badge } from '@design/components/Badge';
import { Button } from '@design/components/Button';
import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
import { ProgressBar } from '@design/components/ProgressBar';
import { RootScreen } from '@design/components/RootScreen';
import { CheckIcon } from '@design/icons/CheckIcon';
import { GridIcon } from '@design/icons/GridIcon';
import { COLORS, ICON_SIZES } from '@design/tokens';
import type { WorkoutExercise, WorkoutSessionModel } from '@usecases/workoutSession';

import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import { showsGroupChip } from './WorkoutExerciseCardLogic';
import {
  workoutExerciseMenuActions,
  type ExerciseMenuItem,
} from './WorkoutExerciseMenuLogic';
import {
  formatWorkoutMenuTitle,
  workoutMenuActions,
  type WorkoutMenuItem,
} from './WorkoutHeaderMenuLogic';
import {
  formatUnlocksCaption,
  formatWorkoutSubtitle,
  showsHeaderActions,
} from './WorkoutScreenLogic';
import { styles } from './WorkoutScreenStyles';

export type WorkoutScreenProps = {
  model: WorkoutSessionModel | undefined;
  isPending: boolean;
  /** Opens the mesocycle overview sheet (08.7, "Лист «Обзор мезоцикла»"). */
  onOpenGrid: () => void;
  /** What each action of the header menu does (08.7, "Меню шапки") — one handler per action. */
  menuActions: Record<WorkoutMenuItem, () => void>;
  /** Opens an exercise's history (06), from its card. */
  onOpenExerciseHistory: (exercise: WorkoutExercise) => void;
  /**
   * An action picked in an exercise card's `⋯` menu (08.7, "Меню упражнения"). Live only. The
   * menu opens out of the card's own button (117), so the screen builds each card's items from
   * the model and hands the pick back with the exercise it belongs to.
   */
  onExerciseMenuAction: (exercise: WorkoutExercise, item: ExerciseMenuItem) => void;
  /** Logs a set row with what was typed (05, "Записать подход"). Live only. */
  onLogSet: (
    exercise: WorkoutExercise,
    setNumber: number,
    entry: { weight: number; reps: number; bodyWeight?: number },
  ) => void;
  /** Un-logs a logged set row (05, "Снять отметку"). Live only. */
  onUnlogSet: (exercise: WorkoutExercise, setNumber: number) => void;
  /** The Weight field of a pure bodyweight exercise was edited — it's the block's body weight (105). */
  onBodyWeightChange?: (bodyWeight: number) => void;
  /** A bodyweight exercise's Weight cell was tapped while the block has no body weight yet (105). */
  onRequestBodyWeight?: () => void;
  /** A log or un-log is being saved. */
  isSaving: boolean;
  /** Finishes the session (05, "Завершение тренировки"). Only offered when `showFinish`. */
  onFinish: () => void;
  /** Finish is being saved — the button is disabled so it can't be pressed twice. */
  isFinishing: boolean;
  /** Opens the session `Next workout` points at. Read-only only. */
  onOpenNext: (sessionId: string) => void;
  /** Flow C on the block this session belongs to. Only offered when `showCopyMesocycle`. */
  onCopyMesocycle: () => void;
  /** Closes the mesocycle (052). Only offered when `showFinishMesocycle`. */
  onFinishMesocycle: () => void;
  /** The mesocycle's Finish is being saved — the button is disabled so it can't be pressed twice. */
  isFinishingMesocycle: boolean;
  /**
   * The EmptyState shown in place of the screen when there's no session to show — none to pick,
   * or it couldn't be loaded. The caller knows which, so it supplies the copy and the way forward.
   */
  fallback: { title: string; description: string; actionLabel: string; onAction: () => void };
};

export function WorkoutScreen({
  model,
  isPending,
  onOpenGrid,
  menuActions,
  onOpenExerciseHistory,
  onExerciseMenuAction,
  onLogSet,
  onUnlogSet,
  onBodyWeightChange,
  onRequestBodyWeight,
  isSaving,
  onFinish,
  isFinishing,
  onOpenNext,
  onFinishMesocycle,
  onCopyMesocycle,
  isFinishingMesocycle,
  fallback,
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
          <EmptyState {...fallback} />
        </RootScreen>
      </View>
    );
  }

  const { header, nextSessionId } = model;

  return (
    <View style={styles.root}>
      <RootScreen
        title={`Week ${header.weekNumber}`}
        titleSuffix={`Day ${header.dayNumber}`}
        titleAccessory={
          <>
            {header.isDeload && (
              // Badge pins itself to the top (alignSelf); the wrapper keeps it centred on the title.
              <View testID="workout-deload-badge">
                <Badge label="Deload" />
              </View>
            )}
            {header.isCompleted && (
              <View
                testID="workout-completed-check"
                accessible
                accessibilityLabel="Completed"
                style={styles.completedCheck}
              >
                <CheckIcon size={ICON_SIZES['icon/glyph']} color={COLORS['accent/on']} />
              </View>
            )}
          </>
        }
        subtitle={formatWorkoutSubtitle(header)}
        trailing={
          showsHeaderActions(model.mode) ? (
            <View style={styles.actions}>
              <IconButton accessibilityLabel="Mesocycle overview" onPress={onOpenGrid}>
                <GridIcon size={ICON_SIZES['icon/button']} color={COLORS['text/secondary']} />
              </IconButton>
              <ActionMenu
                accessibilityLabel="Workout menu"
                title={formatWorkoutMenuTitle(header)}
                subtitle={header.mesocycleName}
                items={workoutMenuActions(model.actions, menuActions)}
              />
            </View>
          ) : undefined
        }
      >
        <ProgressBar value={model.progress} accessibilityLabel="Workout progress" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          // A tap on Log while the keyboard is up logs the set rather than only closing the
          // keyboard; the inset keeps the focused row above the keyboard.
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {model.exercises.map((exercise, index) => (
            <WorkoutExerciseCard
              key={exercise.sessionExerciseId}
              exercise={exercise}
              mode={model.mode}
              showGroupChip={showsGroupChip(model.exercises, index)}
              onOpenHistory={() => onOpenExerciseHistory(exercise)}
              menuItems={workoutExerciseMenuActions(exercise.actions, (item) =>
                onExerciseMenuAction(exercise, item),
              )}
              isSaving={isSaving}
              bodyWeight={model.bodyWeight}
              onBodyWeightChange={onBodyWeightChange}
              onRequestBodyWeight={onRequestBodyWeight}
              onLogSet={(setNumber, entry) => onLogSet(exercise, setNumber, entry)}
              onUnlogSet={(setNumber) => onUnlogSet(exercise, setNumber)}
            />
          ))}
          {model.showFinish && (
            <View style={styles.finish}>
              <Button label="Finish workout" onPress={onFinish} disabled={isFinishing} />
            </View>
          )}
          {nextSessionId !== undefined && (
            <View style={styles.finish}>
              <Button
                label="Next workout"
                variant="secondary"
                onPress={() => onOpenNext(nextSessionId)}
              />
            </View>
          )}
          {model.showFinishMesocycle && (
            <View style={styles.finish}>
              <Button
                label="Finish mesocycle"
                onPress={onFinishMesocycle}
                disabled={isFinishingMesocycle}
              />
            </View>
          )}
          {model.showCopyMesocycle && (
            <View style={styles.finish}>
              <Button label="Copy current meso" onPress={onCopyMesocycle} />
            </View>
          )}
          {model.unlocksAfter !== undefined && (
            <Text style={styles.unlocksCaption}>{formatUnlocksCaption(model.unlocksAfter)}</Text>
          )}
        </ScrollView>
      </RootScreen>
    </View>
  );
}
