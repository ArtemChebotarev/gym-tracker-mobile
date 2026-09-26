// A day of a closed block, pushed over that block's detail screen (08.9 · Мезоцикл (деталь), "Сетка
// тренировок"; task 130). The `[id]` segment is the session id; `historySessionHref` builds it.
//
// The workout screen's second host — the Today tab is the first (components/workoutRoutes.ts). A
// session of a `completed` or `abandoned` block always opens in History mode (128): no grid button,
// no `⋯` in the header or on the cards, no `Next workout`, nothing to log. So this route wires only
// what History can still do — open an exercise's history, `Copy current meso` into Flow C, and go
// back to the detail screen — and leaves every live-only handler inert. Nothing but a closed
// block's grid links here, and a closed block can't be reopened, so no session that would need
// them ever arrives.
import { useLocalSearchParams, useRouter } from 'expo-router';

import { exerciseDetailHref } from '@components/historyRoutes';
import { useQuietPopUnderModal } from '@components/useQuietPopUnderModal';
import { WorkoutScreen } from '@components/WorkoutScreen';
import { useWorkoutSession } from '@state/useWorkoutSession';

export default function HistorySessionRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useWorkoutSession(id);
  const model = query.data;
  const quietPop = useQuietPopUnderModal();
  // What every live-only handler does here — see the header comment.
  const inert = () => undefined;

  return (
    <WorkoutScreen
      model={model}
      isPending={query.isPending}
      onBack={() => router.back()}
      onOpenGrid={inert}
      menuActions={{
        addExercise: inert,
        skipWorkout: inert,
        renameMesocycle: inert,
        mesocycleHistory: inert,
        stopMesocycle: inert,
      }}
      onOpenExerciseHistory={(exercise) => router.push(exerciseDetailHref(exercise.exerciseId))}
      onExerciseMenuAction={inert}
      onLogSet={inert}
      onUnlogSet={inert}
      isSaving={false}
      onFinish={inert}
      isFinishing={false}
      onOpenNext={inert}
      onFinishMesocycle={inert}
      isFinishingMesocycle={false}
      onCopyMesocycle={() => {
        if (model !== undefined) {
          // Saving the copy takes this page and the detail screen under it off too — in one slide.
          quietPop();
          router.push({ pathname: '/meso-editor/copy', params: { sourceMesoId: model.mesoId } });
        }
      }}
      fallback={{
        title: 'Workout not found',
        description: 'It may have been removed.',
        actionLabel: 'Go back',
        onAction: () => router.back(),
      }}
    />
  );
}
