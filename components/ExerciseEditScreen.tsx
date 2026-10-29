// Edit exercise — the page of 10.1 FR-11 (ExerciseFormScreen.tsx) seeded with a custom exercise,
// opened from the exercise's ⋯ menu. The `[id]` route segment is the exercise; the exercise is
// read from the overview the Exercise screen already loaded, so the page opens filled.
//
// A catalog exercise cannot be edited (08.6) and opens nothing. The type is shown, not chosen: it
// belongs to the exercise from the start (FR-1).
//
// Logic in ExerciseFormLogic.ts.

import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { toExerciseId } from '@domain/catalog';
import { exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import { useExerciseOverview } from '@state/useExerciseOverview';
import { useUpdateCustomExercise } from '@state/useUpdateCustomExercise';

import { isExerciseEditable } from './ExerciseFormLogic';
import { ExerciseFormScreen } from './ExerciseFormScreen';
import type { ExerciseFormSubmitInput } from './ExerciseFormValues';

export function ExerciseEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = toExerciseId(id);
  const exercise = useExerciseOverview(exerciseId).data?.exercise;
  const updateExercise = useUpdateCustomExercise();

  if (exercise === undefined || !isExerciseEditable(exercise)) {
    return null;
  }

  function handleSave(input: ExerciseFormSubmitInput) {
    updateExercise.mutate(
      { ...input, id: exerciseId },
      {
        onSuccess: () => router.back(),
        // The page stays open with what was typed, so Save can simply be pressed again.
        onError: () => Alert.alert("Couldn't save the exercise", 'Try again.'),
      },
    );
  }

  return (
    <ExerciseFormScreen
      title="Edit exercise"
      submitLabel="Save"
      initialValues={{
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        type: exerciseTypeOf(exercise),
        config: exercise.config,
      }}
      isSubmitting={updateExercise.isPending}
      onSubmit={handleSave}
      onClose={() => router.back()}
    />
  );
}
