// Today tab — the workout screen (08.7 · Тренировка, "Навигация"). Shows the current session, or
// the day picked through `workoutHref` (the `sessionId` param) — every session, completed and
// preview ones included, opens here with the tab bar rather than as a separate page. The current
// session (099, `useTodayWorkout`) is the one in progress, else the next day of the active
// mesocycle — a preview if that day isn't programmed yet. With no active mesocycle the tab invites
// creating one (08, "Сегодня"); once the active one has nothing left, it leads to the mesocycles.
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
// The header `⋯` opens the header menu (096, `WorkoutMenuSheet`). Add exercise opens the exercise
// picker (`WorkoutExercisePickerSheet`, `multi`) and adds the picked exercises to the end of the
// session (`useAddExercises`, 048). Skip workout, once confirmed in the menu, skips every unfinished
// exercise and closes the session (`useSkipWorkout`, 049) and, like Finish, pins the tab to it,
// now read-only. Mesocycle history opens the mesocycle detail stub (098).
//
// An exercise card's `⋯` opens the exercise menu (097, `WorkoutExerciseMenuSheet`) for that
// exercise. Its one-tap actions — add or remove a set, move, skip or unskip, delete — run through
// `useExerciseCommand`; Replace exercise opens the picker in `single` mode, and the pick swaps the
// exercise (`useSwapExercise`, 047). Delete, Skip and — with logged sets — Replace are confirmed in
// the menu first.
//
// Rename mesocycle (087), Stop mesocycle (052), and exercise history aren't built yet, so until
// then they explain that they're not available yet rather than doing nothing.

import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BodyWeightSheet } from '@components/BodyWeightSheet';
import { asksForBodyWeight } from '@components/BodyWeightSheetLogic';
import { formatInProgressConflict, todayEmptyCopy } from '@components/TodayScreenLogic';
import { mesocycleDetailHref } from '@components/historyRoutes';
import { MesoOverviewSheet } from '@components/MesoOverviewSheet';
import { WorkoutExerciseMenuSheet } from '@components/WorkoutExerciseMenuSheet';
import { WorkoutExercisePickerSheet } from '@components/WorkoutExercisePickerSheet';
import { WorkoutMenuSheet } from '@components/WorkoutMenuSheet';
import { formatWorkoutMenuTitle } from '@components/WorkoutMenuSheetLogic';
import { WorkoutScreen } from '@components/WorkoutScreen';
import {
  mesoGridCellHref,
  workoutHref,
  workoutPickFromParams,
  type WorkoutRouteParams,
} from '@components/workoutRoutes';
import { useAddExercises } from '@state/useAddExercises';
import { useExerciseCommand, useSwapExercise } from '@state/useExerciseCommand';
import { useFinishSession } from '@state/useFinishSession';
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
  const model = query.data?.kind === 'session' ? query.data.model : undefined;
  const currentSessionId = model?.sessionId;
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  // The exercise whose menu was opened last. Kept after its menu closes, so the sheet keeps its
  // content while sliding away and Replace's picker knows which exercise it replaces.
  const [menuExercise, setMenuExercise] = useState<WorkoutExercise | undefined>(undefined);
  const [isExerciseMenuOpen, setIsExerciseMenuOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  // The body weight sheet asks until it's answered (105). Closing it by the backdrop leaves the
  // session usable — the question comes back the next time the screen opens.
  const [bodyWeightText, setBodyWeightText] = useState('');
  const [isBodyWeightDismissed, setIsBodyWeightDismissed] = useState(false);
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

  function showSaveError() {
    Alert.alert("Couldn't save the set", 'Please try again.');
  }

  function showExerciseError() {
    Alert.alert("Couldn't update the exercise", 'Please try again.');
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
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenExerciseHistory={() => showNotAvailable('Exercise history')}
        onOpenExerciseMenu={(exercise) => {
          setMenuExercise(exercise);
          setIsExerciseMenuOpen(true);
        }}
        isSaving={logSet.isPending || unlogSet.isPending}
        onBodyWeightChange={saveBodyWeight}
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
        fallback={{
          ...todayEmptyCopy(emptyReason),
          onAction: () =>
            emptyReason === 'noActiveMesocycle'
              ? router.push('/meso-editor/new')
              : router.navigate('/mesocycles'),
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
      <WorkoutMenuSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        model={model}
        onAddExercise={() => setIsAddExerciseOpen(true)}
        onSkipWorkout={() => {
          if (currentSessionId === undefined) {
            return;
          }
          pinCurrentSession();
          skipWorkout.mutate(currentSessionId, {
            onError: () => Alert.alert("Couldn't skip the workout", 'Please try again.'),
          });
        }}
        onRenameMesocycle={() => showNotAvailable('Renaming a mesocycle')}
        onOpenMesocycleHistory={() => {
          if (model !== undefined) {
            router.push(mesocycleDetailHref(model.mesoId));
          }
        }}
        onStopMesocycle={() => showNotAvailable('Stopping a mesocycle')}
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
      <WorkoutExerciseMenuSheet
        visible={isExerciseMenuOpen}
        onClose={() => setIsExerciseMenuOpen(false)}
        exercise={menuExercise}
        onReplace={() => setIsReplaceOpen(true)}
        onCommand={(command) => {
          if (currentSessionId === undefined || menuExercise === undefined) {
            return;
          }
          exerciseCommand.mutate(
            {
              command,
              ref: {
                sessionId: currentSessionId,
                sessionExerciseId: menuExercise.sessionExerciseId,
              },
            },
            { onError: showExerciseError },
          );
        }}
      />
      <BodyWeightSheet
        visible={asksForBodyWeight(model) && !isBodyWeightDismissed}
        onClose={() => setIsBodyWeightDismissed(true)}
        value={bodyWeightText}
        onChangeValue={setBodyWeightText}
        onSave={(bodyWeight) => {
          saveBodyWeight(bodyWeight);
          setBodyWeightText('');
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
