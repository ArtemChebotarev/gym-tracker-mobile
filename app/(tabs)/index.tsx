// Today tab — the workout screen (08.7 · Тренировка, "Навигация"). Shows the current session, or
// the day picked through `workoutHref` (the `sessionId` param) — every session, completed and
// preview ones included, opens here with the tab bar rather than as a separate page. Until Start
// (042) and the real pick (099) exist, the current session is the stub in-progress one — see
// `useTodayWorkoutSession`.
//
// The grid and `⋯` sheets are tasks 095 and 096, the exercise menu 097, and exercise history
// isn't built yet, so until then those buttons explain that they're not available yet rather than
// doing nothing.

import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { WorkoutScreen } from '@components/WorkoutScreen';
import { useTodayWorkoutSession } from '@state/useWorkoutSession';

export default function TodayScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const query = useTodayWorkoutSession(sessionId);

  function showNotAvailable(feature: string) {
    Alert.alert('Not available yet', `${feature} is coming in a later update.`);
  }

  return (
    <WorkoutScreen
      model={query.data}
      isPending={query.isPending}
      onOpenGrid={() => showNotAvailable('The mesocycle overview')}
      onOpenMenu={() => showNotAvailable('The workout menu')}
      onOpenExerciseHistory={() => showNotAvailable('Exercise history')}
      onOpenExerciseMenu={() => showNotAvailable('The exercise menu')}
      fallbackAction={{ label: 'Open mesocycles', onPress: () => router.navigate('/mesocycles') }}
    />
  );
}
