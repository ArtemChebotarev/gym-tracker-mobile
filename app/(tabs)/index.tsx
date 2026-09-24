// Today tab — the workout screen (08.7 · Тренировка, "Навигация"). Shows the current session, or
// the day picked through `workoutHref` (the `sessionId` param) — every session, completed and
// preview ones included, opens here with the tab bar rather than as a separate page. The current
// session (099, `useTodayWorkout`) is the one in progress, else the next day of the active
// mesocycle — a preview if that day isn't programmed yet. With no active mesocycle the tab invites
// planning one (08, "Сегодня") through the same creation-method sheet the `+` on 08.3 raises (123);
// once the active one has nothing left, it offers to finish it (052).
//
// A picked day is held in the tab's params and dropped by `unpinDay` when the Today tab is pressed
// again. Without that the params outlived everything that gave them meaning and the tab stuck on
// one workout until the app was restarted; see `unpinDay`.
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
// block through `useFinishMesocycle` after a plain confirmation: it throws nothing away. The screen
// does not move afterwards — `Finish mesocycle` is replaced in place by `Copy current meso`
// (04, "Завершение мезоцикла"), which opens Flow C on the block that just ended. Stopping gets no
// such button: a block called off is a poor thing to build the next one from.
//
// Rename mesocycle (087) isn't built yet, so until then it explains that it's not available yet
// rather than doing nothing.

import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { BodyWeightSheet } from '@components/BodyWeightSheet';
import { MesoCreationMethodSheet } from '@components/MesoCreationMethodSheet';
import { StopMesocycleSheet } from '@components/StopMesocycleSheet';
import {
  FINISH_MESOCYCLE_CONFIRMATION,
  formatInProgressConflict,
  todayEmptyCopy,
} from '@components/TodayScreenLogic';
import { useMesoCreationMethodSheet } from '@components/useMesoCreationMethodSheet';
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
import { finishedMesocyclesNewestFirst } from '@domain/mesocycleLifecycle';
import { useAddExercises } from '@state/useAddExercises';
import {
  useExerciseCommand,
  useSwapExercise,
  type ExerciseCommand,
} from '@state/useExerciseCommand';
import { useFinishSession } from '@state/useFinishSession';
import { useFinishMesocycle, useStopMesocycle } from '@state/useMesocycleClosing';
import { useMesoGrid } from '@state/useMesoGrid';
import { useMesocycles } from '@state/useMesocycles';
import { useLogSet, useUnlogSet } from '@state/useSetLogging';
import { useSetBodyWeight } from '@state/useSetBodyWeight';
import { useSkipWorkout } from '@state/useSkipWorkout';
import { useTodayWorkout } from '@state/useWorkoutSession';
import type { WorkoutExercise } from '@usecases/workoutSession';

/**
 * The two methods of this tab's own navigation object the screen uses. React Navigation's
 * `BottomTabNavigationProp` isn't importable here — expo-router vendors the navigators instead of
 * depending on `@react-navigation/bottom-tabs`, so there is no package to take the type from, and
 * reaching into `expo-router/build` for it would tie this screen to that build layout.
 *
 * `setParams` is this one's, not `useRouter()`'s. The imperative router writes to whatever route
 * is *focused* (`navigationRef.current.setParams`), and `tabPress` is delivered before the tab
 * actually changes — so a write from the router during it lands on the tab being left instead of
 * on this one, and the picked day is never released (found on the device, 24.09.2026).
 */
type TodayTabNavigation = {
  addListener: (event: 'tabPress', listener: () => void) => () => void;
  setParams: (params: Partial<WorkoutRouteParams>) => void;
};

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
  // Only for the creation-method sheet's second row: whether there is anything to copy at all.
  const mesocycles = useMesocycles();
  const methodSheet = useMesoCreationMethodSheet();
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
  const navigation = useNavigation<TodayTabNavigation>();

  /**
   * Drops the picked day, so the tab means "the current session" again.
   *
   * The pin is what made Today stick: `Finish workout` writes the finished session's id into the
   * tab's params on purpose, and nothing used to take it out again. `workoutPickFromParams` gives
   * that id priority over everything, so after the last workout of a block the tab went on showing
   * it — through tab switches, and past the moment the block itself was finished — until the app
   * was restarted and the route params went with it (Artem, 24.09.2026).
   *
   * Leaving and coming back is the whole rule. Finishing or stopping the block deliberately does
   * *not* release it: standing on the workout you just finished is the point, and that is where
   * `Copy current meso` — and, later, the block's history — is offered from.
   *
   * `setParams` merges, so an explicit `undefined` is what removes a key rather than leaving the
   * old value in place. It is the tab's own — see `TodayTabNavigation` for why not the router's.
   */
  function unpinDay() {
    navigation.setParams({
      sessionId: undefined,
      mesoId: undefined,
      week: undefined,
      day: undefined,
    });
  }

  // Coming back to Today through the tab bar means today, not the day that was open when the tab
  // was last left. `tabPress` rather than losing focus: focus is also lost by pushing a screen
  // from inside the tab — an exercise's history, opened from a workout — and clearing the pick
  // there would drop the user off the workout they were reading on the way back.
  useEffect(
    () => navigation.addListener('tabPress', unpinDay),
    // `unpinDay` only ever calls `router.setParams` with the same constant, so re-subscribing as
    // it is re-created each render would churn listeners for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation],
  );

  function showNotAvailable(feature: string) {
    Alert.alert('Not available yet', `${feature} is coming in a later update.`);
  }

  /**
   * Pins the tab to the shown session before an action that ends it (Finish, Skip): the
   * current-session pick moves on to the next day, but the screen stays put and turns read-only.
   */
  function pinCurrentSession() {
    if (sessionId === undefined && currentSessionId !== undefined) {
      // Through this tab's own navigation, like `unpinDay` — see `TodayTabNavigation`. It happens
      // to be focused here, so the router would work too, but one mechanism for both means the
      // focused-route trap can't be walked into again by whatever writes these params next.
      navigation.setParams({ sessionId: currentSessionId });
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
            // Nothing navigates: the screen stays on the workout it was on, and `Finish mesocycle`
            // is replaced in place by `Copy current meso` once the re-read model comes back
            // (Artem, 24.09.2026 — a finished block is still worth standing on, and block-level
            // actions like its history will land beside that button).
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
        onCopyMesocycle={() => {
          if (model !== undefined) {
            router.push({
              pathname: '/meso-editor/copy',
              params: { sourceMesoId: model.mesoId },
            });
          }
        }}
        isFinishingMesocycle={finishMesocycle.isPending}
        fallback={{
          ...todayEmptyCopy(emptyReason),
          onAction: () => {
            if (emptyReason === 'noActiveMesocycle') {
              // The same sheet the `+` on 08.3 raises, not Flow A directly: no block is *running*
              // here, but finished ones may well exist to copy — which is the most common way the
              // next block starts (04, Flow C).
              methodSheet.open();
            } else if (allDoneMesoId !== undefined) {
              confirmFinishMesocycle(allDoneMesoId);
            } else {
              router.navigate('/mesocycles');
            }
          },
        }}
      />
      <MesoCreationMethodSheet
        visible={methodSheet.visible}
        animated={methodSheet.animated}
        onClose={methodSheet.close}
        canCopy={finishedMesocyclesNewestFirst(mesocycles.data ?? []).length > 0}
        onCreateFromScratch={methodSheet.choose(() => router.push('/meso-editor/new'))}
        onCopyMesocycle={methodSheet.choose(() => router.push('/meso-editor/copy'))}
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
            // Like Finish, this doesn't navigate. Releasing the picked day is the tab bar's job
            // and only the tab bar's, so there is one rule for it rather than a list of actions
            // that each remember to do it.
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
