// Today tab — the workout screen (08.7 · Тренировка, "Навигация"). Shows the current session, or
// the day picked through `workoutHref` (the `sessionId` param) — every session, completed and
// preview ones included, opens here with the tab bar rather than as a separate page. Until Start
// (042) and the real pick (099) exist, the current session is the stub in-progress one — see
// `useTodayWorkoutSession`.
//
// Set rows log and un-log through `useLogSet` / `useUnlogSet` (093). If another session is already
// `in_progress`, nothing is logged and an alert names it, with `Open` to go there (05).
//
// The grid and `⋯` sheets are tasks 095 and 096, the exercise menu 097, and exercise history
// isn't built yet, so until then those buttons explain that they're not available yet rather than
// doing nothing.

import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { formatInProgressConflict } from '@components/TodayScreenLogic';
import { WorkoutScreen } from '@components/WorkoutScreen';
import { workoutHref } from '@components/workoutRoutes';
import { useLogSet, useUnlogSet } from '@state/useSetLogging';
import { useTodayWorkoutSession } from '@state/useWorkoutSession';

export default function TodayScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const query = useTodayWorkoutSession(sessionId);
  const logSet = useLogSet();
  const unlogSet = useUnlogSet();
  const currentSessionId = query.data?.sessionId;

  function showNotAvailable(feature: string) {
    Alert.alert('Not available yet', `${feature} is coming in a later update.`);
  }

  function showSaveError() {
    Alert.alert("Couldn't save the set", 'Please try again.');
  }

  return (
    <WorkoutScreen
      model={query.data}
      isPending={query.isPending}
      onOpenGrid={() => showNotAvailable('The mesocycle overview')}
      onOpenMenu={() => showNotAvailable('The workout menu')}
      onOpenExerciseHistory={() => showNotAvailable('Exercise history')}
      onOpenExerciseMenu={() => showNotAvailable('The exercise menu')}
      isSaving={logSet.isPending || unlogSet.isPending}
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
          { sessionId: currentSessionId, sessionExerciseId: exercise.sessionExerciseId, setNumber },
          { onError: showSaveError },
        );
      }}
      fallbackAction={{ label: 'Open mesocycles', onPress: () => router.navigate('/mesocycles') }}
    />
  );
}
