// New exercise — the page after the type sheet (10.1 FR-11). The screen lives in
// components/ExerciseCreateScreen.tsx; this route only mounts it, as a full-screen modal
// (app/_layout.tsx). Declared before `exercise/[id]` matches, so "new" is never read as an id.
import { ExerciseCreateScreen } from '@components/ExerciseCreateScreen';

export default function NewExerciseRoute() {
  return <ExerciseCreateScreen />;
}
