// Edit exercise — the page lives in components/ExerciseEditScreen.tsx; this route only mounts it,
// as a full-screen modal (app/_layout.tsx) over the Exercise screen that opened it.
import { ExerciseEditScreen } from '@components/ExerciseEditScreen';

export default function EditExerciseRoute() {
  return <ExerciseEditScreen />;
}
