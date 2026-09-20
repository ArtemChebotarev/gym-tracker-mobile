// The Exercise screen (08.6 · Библиотека упражнений, task 065). The `[id]` segment is the
// `exerciseId`; every entry point — the library list and a workout's exercise card — lands here,
// on Overview (08.6: "Overview всегда открывается первой, независимо от точки входа").
//
// Composes the screen with its two sheets as siblings, the way app/(tabs)/library.tsx does: the
// `⋯` menu, and the New/Edit exercise sheet the menu's `Edit` opens for a custom exercise. Hiding
// pops the screen — a hidden exercise is gone from the library that got you here.
//
// The screen opens on Overview every time, so the History tab's own read (108) waits until that
// tab is first picked and then stays loaded — switching back and forth doesn't re-read.
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  EMPTY_EXERCISE_FORM_VALUES,
  ExerciseFormSheet,
  type ExerciseFormSubmitInput,
  type ExerciseFormValues,
} from '@components/ExerciseFormSheet';
import { ExerciseDetailScreen } from '@components/ExerciseDetailScreen';
import { ExerciseMenuSheet } from '@components/ExerciseMenuSheet';
import { toExerciseId } from '@domain/catalog';
import { useExerciseHistory } from '@state/useExerciseHistory';
import { useExerciseOverview } from '@state/useExerciseOverview';
import { useHideExercise } from '@state/useHideExercise';
import { useUpdateCustomExercise } from '@state/useUpdateCustomExercise';

export default function ExerciseDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = toExerciseId(id);

  const [isHistoryOpened, setIsHistoryOpened] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formValues, setFormValues] = useState<ExerciseFormValues>(EMPTY_EXERCISE_FORM_VALUES);

  const query = useExerciseOverview(exerciseId);
  const historyQuery = useExerciseHistory(exerciseId, { enabled: isHistoryOpened });
  const updateExercise = useUpdateCustomExercise();
  const hideExercise = useHideExercise();

  const exercise = query.data?.exercise;

  function handleEdit() {
    if (!exercise) {
      return;
    }
    setFormValues({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
    });
    setIsFormSheetOpen(true);
  }

  function handleSubmitForm(input: ExerciseFormSubmitInput) {
    updateExercise.mutate(
      { ...input, id: exerciseId },
      { onSuccess: () => setIsFormSheetOpen(false) },
    );
  }

  function handleHide() {
    hideExercise.mutate(exerciseId, { onSuccess: () => router.back() });
  }

  return (
    <>
      <ExerciseDetailScreen
        overview={query.data}
        isPending={query.isPending}
        history={historyQuery.data}
        isHistoryPending={historyQuery.isPending}
        onBack={() => router.back()}
        onOpenMenu={() => setIsMenuOpen(true)}
        onTabChange={(tab) => {
          if (tab === 'history') {
            setIsHistoryOpened(true);
          }
        }}
      />
      <ExerciseMenuSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        exerciseName={exercise?.name ?? ''}
        actions={query.data?.actions ?? []}
        onEdit={handleEdit}
        onHide={handleHide}
      />
      <ExerciseFormSheet
        visible={isFormSheetOpen}
        exercise={exercise}
        values={formValues}
        onChangeValues={setFormValues}
        onSubmit={handleSubmitForm}
        onClose={() => setIsFormSheetOpen(false)}
      />
    </>
  );
}
