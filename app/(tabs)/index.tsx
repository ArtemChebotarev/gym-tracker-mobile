// Today tab — the workout screen (08.7 · Тренировка, "Навигация"). Shows the current session, or
// the day picked through `workoutHref` (the `sessionId` param) — every session, completed and
// preview ones included, opens here with the tab bar rather than as a separate page. The current
// session (099, `useTodayWorkout`) is the one in progress, else the next day of the active
// mesocycle — a preview if that day isn't programmed yet. With no active mesocycle the tab invites
// creating one (08, "Сегодня"); once the active one has nothing left, it offers to finish it (052).
//
// Set rows log and un-log through `useLogSet` / `useUnlogSet` (093). If another session is already
// `in_progress`, nothing is logged and an alert names it, with `Open` to go there (05).
//
// `Finish workout` finishes the session through `useFinishSession` (094) without a confirmation;
// the tab stays on it — pinned through the `sessionId` param, since the pick moves on — and the
// re-read session comes back read-only, with `Next workout` leading to the mesocycle's current
// session.
//
// The grid button opens the mesocycle overview (095, `MesoOverviewSheet`) over the shown session's
// mesocycle. A cell closes it and opens its day here: by `sessionId` when the session exists, else
// by week and day (`workoutSlotHref`) — a preview of a day not programmed yet.
//
// The header `⋯` opens the header menu (096) — a native menu out of the button itself (117), so
// its actions are wired here rather than raised as a sheet. Add exercise opens the exercise
// picker (`WorkoutExercisePickerSheet`, `multi`) and adds the picked exercises to the end of the
// session (`useAddExercises`, 048). Skip workout, once confirmed, skips every unfinished
// exercise and closes the session (`useSkipWorkout`, 049) and, like Finish, pins the tab to it,
// now read-only. Mesocycle history opens the mesocycle detail stub (098).
//
// An exercise card's `⋯` opens the exercise menu (097, `WorkoutExerciseMenuSheet`) for that
// exercise. Its one-tap actions — add or remove a set, move, skip or unskip, delete — run through
// `useExerciseCommand`; Replace exercise opens the picker in `single` mode, and the pick swaps the
// exercise (`useSwapExercise`, 047). Delete, Skip and — with logged sets — Replace are confirmed in
// the menu first.
//
// Stop mesocycle (052) opens `StopMesocycleSheet`, which stops the block once `END MESO` has been
// typed into it (`useStopMesocycle`); the tab then re-reads and, with no active mesocycle left,
// invites planning the next one. `Finish mesocycle` — the button under the last workout, and the
// action of the `Block complete` EmptyState, so leaving that screen isn't a dead end — closes the
// block through `useFinishMesocycle` after a plain confirmation: it throws nothing away.
//
// Rename mesocycle (087) isn't built yet, so until then it explains that it's not available yet
// rather than doing nothing.

import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BodyWeightSheet } from '@components/BodyWeightSheet';
import { StopMesocycleSheet } from '@components/StopMesocycleSheet';
import {
  FINISH_MESOCYCLE_CONFIRMATION,
  formatInProgressConflict,
  todayEmptyCopy,
} from '@components/TodayScreenLogic';
import { exerciseDetailHref, mesocycleDetailHref } from '@components/historyRoutes';
import { MesoOverviewSheet } from '@components/MesoOverviewSheet';
import {
  formatDeleteExerciseWarning,
  formatReplaceExerciseWarning,
  formatSkipExerciseWarning,
  type ExerciseMenuItem,
} from '@components/WorkoutExerciseMenuLogic';
import { WorkoutExercisePickerSheet } from '@components/WorkoutExercisePickerSheet';
import {
  formatWorkoutMenuTitle,
  SKIP_WORKOUT_WARNING,
} from '@components/WorkoutHeaderMenuLogic';
import { WorkoutScreen } from '@components/WorkoutScreen';
import {
  mesoGridCellHref,
  workoutHref,
  workoutPickFromParams,
  type WorkoutRouteParams,
} from '@components/workoutRoutes';
import { useAddExercises } from '@state/useAddExercises';
import {
  useExerciseCommand,
  useSwapExercise,
  type ExerciseCommand,
} from '@state/useExerciseCommand';
import { useFinishSession } from '@state/useFinishSession';
import { useFinishMesocycle, useStopMesocycle } from '@state/useMesocycleClosing';
import { useMesoGrid } from '@state/useMesoGrid';
import { useLogSet, useUnlogSet } from '@state/useSetLogging';
import { useSetBodyWeight } from '@state/useSetBodyWeight';
import { useSkipWorkout } from '@state/useSkipWorkout';
import { useTodayWorkout } from '@state/useWorkoutSession';
import type { WorkoutExercise } from '@usecases/workoutSession';

export default function TodayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<WorkoutRouteParams>();
  const { sessionId } = params;
  const query = useTodayWorkout(workoutPickFromParams(params));
  const logSet = useLogSet();
  const unlogSet = useUnlogSet();
  const finishSession = useFinishSession();
  const skipWorkout = useSkipWorkout();
  const addExercises = useAddExercises();
  const exerciseCommand = useExerciseCommand();
  const swapExercise = useSwapExercise();
  const setBodyWeight = useSetBodyWeight();
  const finishMesocycle = useFinishMesocycle();
  const stopMesocycle = useStopMesocycle();
  const model = query.data?.kind === 'session' ? query.data.model : undefined;
  // The block the `Block complete` EmptyState would finish — there's no session model to read it
  // from, since the tab has no session left to show.
  const allDoneMesoId = query.data?.kind === 'allDone' ? query.data.mesoId : undefined;
  const currentSessionId = model?.sessionId;
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  // The exercise Replace was picked for — the picker that opens next has to know which exercise
  // it replaces, and the menu it was picked in is gone by then.
  const [menuExercise, setMenuExercise] = useState<WorkoutExercise | undefined>(undefined);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  // The Stop mesocycle sheet and the phrase typed into it (052) — cleared on every opening, so a
  // half-typed `END MES` from a cancelled attempt never sits there waiting to be completed.
  const [isStopOpen, setIsStopOpen] = useState(false);
  const [stopText, setStopText] = useState('');
  // The body weight sheet (105) opens from the Weight cell of a bodyweight exercise, never by
  // itself: that cell stays on screen, so closing the sheet costs nothing and is never a dead end.
  const [bodyWeightText, setBodyWeightText] = useState('');
  const [isBodyWeightOpen, setIsBodyWeightOpen] = useState(false);
  const grid = useMesoGrid(model?.mesoId);
  const emptyReason =
    query.data?.kind === 'session' ? 'unavailable' : (query.data?.kind ?? 'unavailable');

  function showNotAvailable(feature: string) {
    Alert.alert('Not available yet', `${feature} is coming in a later update.`);
  }

  /**
   * Pins the tab to the shown session before an action that ends it (Finish, Skip): the
   * current-session pick moves on to the next day, but the screen stays put and turns read-only.
   */
  function pinCurrentSession() {
    if (sessionId === undefined && currentSessionId !== undefined) {
      router.setParams({ sessionId: currentSessionId });
    }
  }

  /**
   * Skip workout (049), from the header menu. It can't be undone and skips every unfinished
   * exercise, dropping whatever wasn't logged in them, so it warns about that first — the same way
   * the Mesocycles tab gates Delete.
   */
  function confirmSkipWorkout() {
    Alert.alert('Skip workout?', SKIP_WORKOUT_WARNING, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip',
        style: 'destructive',
        onPress: () => {
          if (currentSessionId === undefined) {
            return;
          }
          pinCurrentSession();
          skipWorkout.mutate(currentSessionId, {
            onError: () => Alert.alert("Couldn't skip the workout", 'Please try again.'),
          });
        },
      },
    ]);
  }

  /** Finish mesocycle (052), from the last workout or the `Block complete` EmptyState. */
  function confirmFinishMesocycle(mesoId: string) {
    Alert.alert('Finish mesocycle?', FINISH_MESOCYCLE_CONFIRMATION, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () =>
          finishMesocycle.mutate(mesoId, {
            onError: () => Alert.alert("Couldn't finish the mesocycle", 'Please try again.'),
          }),
      },
    ]);
  }

  function showSaveError() {
    Alert.alert("Couldn't save the set", 'Please try again.');
  }

  function showExerciseError() {
    Alert.alert("Couldn't update the exercise", 'Please try again.');
  }

  /**
   * An action picked in an exercise card's `⋯` menu (097). Three of them ask first — Delete and,
   * with logged sets, Replace are destructive; Skip says what it keeps and what it skips — and the
   * command runs only once the confirmation is accepted. The rest are one tap.
   */
  function runExerciseMenuAction(exercise: WorkoutExercise, item: ExerciseMenuItem) {
    const confirm = (
      title: string,
      message: string,
      action: { text: string; destructive: boolean; onPress: () => void },
    ) =>
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.text,
          style: action.destructive ? 'destructive' : 'default',
          onPress: action.onPress,
        },
      ]);

    const runCommand = (command: ExerciseCommand) => {
      if (currentSessionId === undefined) {
        return;
      }
      exerciseCommand.mutate(
        {
          command,
          ref: { sessionId: currentSessionId, sessionExerciseId: exercise.sessionExerciseId },
        },
        { onError: showExerciseError },
      );
    };

    switch (item) {
      case 'replace': {
        const openPicker = () => {
          setMenuExercise(exercise);
          setIsReplaceOpen(true);
        };
        if (!exercise.hasLoggedSets) {
          openPicker();
          return;
        }
        confirm(
          'Replace exercise?',
          formatReplaceExerciseWarning(exercise.name, exercise.loggedSetCount),
          { text: 'Replace', destructive: true, onPress: openPicker },
        );
        return;
      }
      case 'skip':
        confirm(
          'Skip exercise?',
          formatSkipExerciseWarning(exercise.plannedSetCount, exercise.loggedSetCount),
          { text: 'Skip', destructive: false, onPress: () => runCommand('skip') },
        );
        return;
      case 'delete':
        confirm('Delete exercise?', formatDeleteExerciseWarning(exercise.loggedSetCount), {
          text: 'Delete',
          destructive: true,
          onPress: () => runCommand('delete'),
        });
        return;
      default:
        runCommand(item);
    }
  }

  /** The body weight belongs to the mesocycle, not the session (105). */
  function saveBodyWeight(bodyWeight: number) {
    if (model === undefined) {
      return;
    }
    setBodyWeight.mutate(
      { mesoId: model.mesoId, bodyWeight },
      { onError: () => Alert.alert("Couldn't save your body weight", 'Please try again.') },
    );
  }

  function replaceExercise(exercise: WorkoutExercise, exerciseId: string) {
    if (currentSessionId === undefined) {
      return;
    }
    swapExercise.mutate(
      { sessionId: currentSessionId, sessionExerciseId: exercise.sessionExerciseId, exerciseId },
      { onError: showExerciseError },
    );
  }

  return (
    <>
      <WorkoutScreen
        model={model}
        isPending={query.isPending}
        onOpenGrid={() => setIsGridOpen(true)}
        menuActions={{
          addExercise: () => setIsAddExerciseOpen(true),
          skipWorkout: confirmSkipWorkout,
          renameMesocycle: () => showNotAvailable('Renaming a mesocycle'),
          mesocycleHistory: () => {
            if (model !== undefined) {
              router.push(mesocycleDetailHref(model.mesoId));
            }
          },
          stopMesocycle: () => {
            setStopText('');
            setIsStopOpen(true);
          },
        }}
        // The card's history button opens the exercise's own screen, on Overview — 08.6 asks
        // for exactly that from a workout: its last-session block is the quick check you came
        // for, and History is one tap further in from there.
        onOpenExerciseHistory={(exercise) => router.push(exerciseDetailHref(exercise.exerciseId))}
        onExerciseMenuAction={runExerciseMenuAction}
        isSaving={logSet.isPending || unlogSet.isPending}
        onBodyWeightChange={saveBodyWeight}
        onRequestBodyWeight={() => setIsBodyWeightOpen(true)}
        onLogSet={(exercise, setNumber, entry) => {
          if (currentSessionId === undefined) {
            return;
          }
          logSet.mutate(
            {
              ref: {
                sessionId: currentSessionId,
                sessionExerciseId: exercise.sessionExerciseId,
                setNumber,
              },
              entry,
            },
            {
              onSuccess: (result) => {
                if (result.kind === 'conflict') {
                  Alert.alert(formatInProgressConflict(result), undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open',
                      onPress: () => router.navigate(workoutHref(result.inProgressSessionId)),
                    },
                  ]);
                }
              },
              onError: showSaveError,
            },
          );
        }}
        onUnlogSet={(exercise, setNumber) => {
          if (currentSessionId === undefined) {
            return;
          }
          unlogSet.mutate(
            {
              sessionId: currentSessionId,
              sessionExerciseId: exercise.sessionExerciseId,
              setNumber,
            },
            { onError: showSaveError },
          );
        }}
        isFinishing={finishSession.isPending}
        onFinish={() => {
          if (currentSessionId === undefined) {
            return;
          }
          pinCurrentSession();
          finishSession.mutate(currentSessionId, {
            onError: () => Alert.alert("Couldn't finish the workout", 'Please try again.'),
          });
        }}
        onOpenNext={(nextSessionId) => router.navigate(workoutHref(nextSessionId))}
        onFinishMesocycle={() => {
          if (model !== undefined) {
            confirmFinishMesocycle(model.mesoId);
          }
        }}
        isFinishingMesocycle={finishMesocycle.isPending}
        fallback={{
          ...todayEmptyCopy(emptyReason),
          onAction: () => {
            if (emptyReason === 'noActiveMesocycle') {
              router.push('/meso-editor/new');
            } else if (allDoneMesoId !== undefined) {
              confirmFinishMesocycle(allDoneMesoId);
            } else {
              router.navigate('/mesocycles');
            }
          },
        }}
      />
      <MesoOverviewSheet
        visible={isGridOpen}
        onClose={() => setIsGridOpen(false)}
        grid={grid.data}
        openDay={model?.header}
        onOpenCell={(cell) => {
          setIsGridOpen(false);
          if (grid.data !== undefined) {
            router.navigate(mesoGridCellHref(grid.data.mesoId, cell));
          }
        }}
      />
      <StopMesocycleSheet
        visible={isStopOpen}
        onClose={() => setIsStopOpen(false)}
        mesocycleName={model?.header.mesocycleName ?? ''}
        value={stopText}
        onChangeValue={setStopText}
        onConfirm={() => {
          if (model === undefined) {
            return;
          }
          setIsStopOpen(false);
          stopMesocycle.mutate(model.mesoId, {
            onError: () => Alert.alert("Couldn't stop the mesocycle", 'Please try again.'),
          });
        }}
        isStopping={stopMesocycle.isPending}
      />
      <WorkoutExercisePickerSheet
        mode="multi"
        visible={isAddExerciseOpen}
        title="Add exercise"
        caption={model ? formatWorkoutMenuTitle(model.header) : ''}
        onClose={() => setIsAddExerciseOpen(false)}
        onConfirm={(exerciseIds) => {
          if (currentSessionId === undefined) {
            return;
          }
          addExercises.mutate(
            { sessionId: currentSessionId, exerciseIds },
            {
              onError: () => Alert.alert("Couldn't add the exercises", 'Please try again.'),
            },
          );
        }}
      />
      <BodyWeightSheet
        visible={isBodyWeightOpen}
        onClose={() => setIsBodyWeightOpen(false)}
        value={bodyWeightText}
        onChangeValue={setBodyWeightText}
        onSave={(bodyWeight) => {
          saveBodyWeight(bodyWeight);
          setBodyWeightText('');
          setIsBodyWeightOpen(false);
        }}
        isSaving={setBodyWeight.isPending}
      />
      <WorkoutExercisePickerSheet
        mode="single"
        visible={isReplaceOpen}
        title="Replace exercise"
        caption={menuExercise?.name ?? ''}
        onClose={() => setIsReplaceOpen(false)}
        onSelect={(exerciseId) => {
          if (menuExercise !== undefined) {
            replaceExercise(menuExercise, exerciseId);
          }
        }}
      />
    </>
  );
}
