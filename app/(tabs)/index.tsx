// Today tab — the workout screen on the current session (08.7 · Тренировка, "Навигация"). Until
// Start (042) and the real pick (099) exist, the session is the stub in-progress one — see
// `useTodayWorkoutSession`.
//
// The grid and `⋯` sheets are tasks 095 and 096, so until then both buttons explain that they're
// not available yet rather than doing nothing.

import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { WorkoutScreen } from '@components/WorkoutScreen';
import { useTodayWorkoutSession } from '@state/useWorkoutSession';

export default function TodayScreen() {
  const router = useRouter();
  const query = useTodayWorkoutSession();

  function showNotAvailable(feature: string) {
    Alert.alert('Not available yet', `${feature} is coming in a later update.`);
  }

  return (
    <WorkoutScreen
      model={query.data}
      isPending={query.isPending}
      onOpenGrid={() => showNotAvailable('The mesocycle overview')}
      onOpenMenu={() => showNotAvailable('The workout menu')}
      fallbackAction={{ label: 'Open mesocycles', onPress: () => router.navigate('/mesocycles') }}
    />
  );
}
