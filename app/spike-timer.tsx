// SPIKE (GT-180): starts a short interval block with no workout behind it — opened by the link
// gymtracker-hybrid://spike-timer in the simulator — to watch the Live Activity's phases.
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useIntervalTimerStore } from '@state/intervalTimerStore';

export default function SpikeTimerRoute() {
  const router = useRouter();
  useEffect(() => {
    useIntervalTimerStore.getState().start({
      exercise: {
        sessionId: 'spike',
        sessionExerciseId: 'spike',
        name: 'Heavy bag',
        totalRounds: 3,
        loggedRoundNumbers: [],
      },
      rounds: [1, 2, 3].map((roundNumber) => ({ roundNumber, workSec: 20, restSec: 10 })),
      getReadySec: 5,
    });
    router.replace('/interval-timer');
  }, [router]);
  return null;
}
