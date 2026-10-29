// New exercise, the step after choosing the type — the page of 10.1 FR-11 (ExerciseFormScreen.tsx)
// with the type arriving as a route param from the type sheet (ExerciseTypeSheet) and Create as
// its action.
//
// Logic in ExerciseCreateScreenLogic.ts and ExerciseFormLogic.ts.

import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useCreateCustomExercise } from '@state/useCreateCustomExercise';

import { exerciseTypeFromParam } from './ExerciseCreateScreenLogic';
import { valuesForType } from './ExerciseFormLogic';
import { ExerciseFormScreen } from './ExerciseFormScreen';
import { EMPTY_EXERCISE_FORM_VALUES, type ExerciseFormSubmitInput } from './ExerciseFormValues';

export function ExerciseCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; name?: string }>();
  const createExercise = useCreateCustomExercise();

  function handleCreate(input: ExerciseFormSubmitInput) {
    createExercise.mutate(input, {
      onSuccess: () => router.back(),
      // The page stays open with what was typed, so Create can simply be pressed again.
      onError: () => Alert.alert("Couldn't save the exercise", 'Try again.'),
    });
  }

  return (
    <ExerciseFormScreen
      title="New exercise"
      submitLabel="Create exercise"
      initialValues={valuesForType(
        { ...EMPTY_EXERCISE_FORM_VALUES, name: params.name ?? '' },
        exerciseTypeFromParam(params.type),
      )}
      isSubmitting={createExercise.isPending}
      onSubmit={handleCreate}
      onClose={() => router.back()}
    />
  );
}
