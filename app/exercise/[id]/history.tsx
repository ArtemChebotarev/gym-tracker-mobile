// "История упражнения" (06 · History & Analytics, scenario 2) — task 098 stub. Opened from the
// history button on a workout exercise card (08.7) via `exerciseHistoryHref`. The `[id]` segment
// is the `exerciseId`; nothing reads it yet, the real screen will.
import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '@components/PlaceholderScreen';

export default function ExerciseHistoryRoute() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Exercise history"
      description="Every set you log for this exercise will show up here."
      onBack={() => router.back()}
    />
  );
}
