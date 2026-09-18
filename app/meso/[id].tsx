// "Мезоцикл (деталь)" (06 · History & Analytics, scenario 1; 08 · Screens & Navigation) — task
// 098 stub. Opened from `Mesocycle history` in the workout header menu (08.7) via
// `mesocycleDetailHref`. The `[id]` segment is the mesocycle id; nothing reads it yet, the real
// screen will.
import { useRouter } from 'expo-router';

import { PlaceholderScreen } from '@components/PlaceholderScreen';

export default function MesocycleDetailRoute() {
  const router = useRouter();

  return (
    <PlaceholderScreen
      title="Mesocycle history"
      description="Weeks, sessions, and logged sets of this mesocycle will show up here."
      onBack={() => router.back()}
    />
  );
}
