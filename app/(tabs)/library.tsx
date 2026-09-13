import { useState } from 'react';

import { ExerciseFiltersSheet } from '@components/ExerciseFiltersSheet';
import {
  EMPTY_EXERCISE_FORM_VALUES,
  ExerciseFormSheet,
  type ExerciseFormSubmitInput,
  type ExerciseFormValues,
} from '@components/ExerciseFormSheet';
import { ExerciseLibraryScreen, type ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
import { countEntries } from '@components/ExerciseLibraryScreenLogic';
import { useCreateCustomExercise } from '@state/useCreateCustomExercise';
import { useExerciseLibrary } from '@state/useExerciseLibrary';

export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({});
  const [draftFilters, setDraftFilters] = useState<ExerciseLibraryFilters>({});
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formValues, setFormValues] = useState<ExerciseFormValues>(EMPTY_EXERCISE_FORM_VALUES);

  const query = useExerciseLibrary({ ...filters, search });
  // Recomputed live as the sheet's draft selection changes, so its confirm button always shows
  // an up-to-date count before the draft is applied (08.6, "Filters — лист").
  const draftQuery = useExerciseLibrary({ ...draftFilters, search });
  const createExercise = useCreateCustomExercise();

  function handleRequestFilters() {
    setDraftFilters(filters);
    setIsFiltersSheetOpen(true);
  }

  function handleApplyFilters() {
    setFilters(draftFilters);
    setIsFiltersSheetOpen(false);
  }

  function handleRequestCreate(prefillName?: string) {
    setFormValues({ ...EMPTY_EXERCISE_FORM_VALUES, name: prefillName ?? '' });
    setIsFormSheetOpen(true);
  }

  function handleSubmitForm(input: ExerciseFormSubmitInput) {
    createExercise.mutate(input, { onSuccess: () => setIsFormSheetOpen(false) });
  }

  return (
    <>
      <ExerciseLibraryScreen
        groups={query.data}
        isPending={query.isPending}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onResetFilters={() => setFilters({})}
        onRequestCreate={handleRequestCreate}
        onRequestFilters={handleRequestFilters}
      />
      <ExerciseFiltersSheet
        visible={isFiltersSheetOpen}
        filters={draftFilters}
        onChangeFilters={setDraftFilters}
        resultCount={draftQuery.data ? countEntries(draftQuery.data) : 0}
        onReset={() => setDraftFilters({})}
        onApply={handleApplyFilters}
        onClose={() => setIsFiltersSheetOpen(false)}
      />
      <ExerciseFormSheet
        visible={isFormSheetOpen}
        values={formValues}
        onChangeValues={setFormValues}
        onSubmit={handleSubmitForm}
        onClose={() => setIsFormSheetOpen(false)}
      />
    </>
  );
}
