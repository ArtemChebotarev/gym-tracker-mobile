// Workout screen on any session, addressed by `sessionId` — wires components/WorkoutScreen.tsx
// (08.7 · Тренировка, task 091) to the session model of 088. The Today tab shows the current
// session itself; this route is for opening another day (the mesocycle overview's cells, 095).
// Build its href with `workoutHref` (components/workoutRoutes.ts).
//
// The grid and `⋯` sheets are tasks 095 and 096, so until then both buttons explain that they're
// not available yet rather than doing nothing.

import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { WorkoutScreen } from '@components/WorkoutScreen';
import { useWorkoutSession } from '@state/useWorkoutSession';

export default function WorkoutRoute() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const query = useWorkoutSession(sessionId);

  function showNotAvailable(feature: string) {
    Alert.alert('Not available yet', `${feature} is coming in a later update.`);
  }

  return (
    <WorkoutScreen
      model={query.data}
      isPending={query.isPending}
      onOpenGrid={() => showNotAvailable('The mesocycle overview')}
      onOpenMenu={() => showNotAvailable('The workout menu')}
      fallbackAction={{ label: 'Go back', onPress: () => router.back() }}
    />
  );
}
