import { useState } from 'react';
import { useRouter } from 'expo-router';

import { ExerciseFiltersSheet } from '@components/ExerciseFiltersSheet';
import { newExerciseHref } from '@components/ExerciseCreateScreenLogic';
import { ExerciseTypeSheet } from '@components/ExerciseTypeSheet';
import {
  ExerciseLibraryScreen,
  type ExerciseLibraryFilters,
} from '@components/ExerciseLibraryScreen';
import { countEntries } from '@components/ExerciseLibraryScreenLogic';
import { exerciseDetailHref } from '@components/historyRoutes';
import type { ExerciseType } from '@domain/catalog';
import { useHandoffSheet } from '@components/useHandoffSheet';
import { useExerciseLibrary } from '@state/useExerciseLibrary';
import { loadErrorOf } from '@state/loadError';

export default function LibraryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({});
  const [draftFilters, setDraftFilters] = useState<ExerciseLibraryFilters>({});
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const typeSheet = useHandoffSheet();
  const [newType, setNewType] = useState<ExerciseType>('strength');
  // What was typed in the search when "Create" was tapped — the new exercise's starting name.
  const [newName, setNewName] = useState('');

  const query = useExerciseLibrary({ ...filters, search });
  // Recomputed live as the sheet's draft selection changes, so its confirm button always shows
  // an up-to-date count before the draft is applied (08.6, "Filters — лист").
  const draftQuery = useExerciseLibrary({ ...draftFilters, search });

  function handleRequestFilters() {
    setDraftFilters(filters);
    setIsFiltersSheetOpen(true);
  }

  function handleApplyFilters() {
    setFilters(draftFilters);
    setIsFiltersSheetOpen(false);
  }

  function handleRequestCreate(prefillName?: string) {
    setNewType('strength');
    setNewName(prefillName ?? '');
    typeSheet.open();
  }

  // The fields are a page of their own: the sheet leaves without sliding, as on Cycles.
  const handleTypeChosen = typeSheet.choose(() => router.push(newExerciseHref(newType, newName)));

  return (
    <>
      <ExerciseLibraryScreen
        groups={query.data}
        isPending={query.isPending}
        loadError={loadErrorOf(query)}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onResetFilters={() => setFilters({})}
        onRequestCreate={handleRequestCreate}
        onRequestFilters={handleRequestFilters}
        onOpenExercise={(entry) => router.push(exerciseDetailHref(entry.exercise.id))}
        onOpenDebug={() => router.push('/debug')}
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
      <ExerciseTypeSheet
        visible={typeSheet.visible}
        animated={typeSheet.animated}
        type={newType}
        onChangeType={setNewType}
        onNext={handleTypeChosen}
        onClose={typeSheet.close}
      />
    </>
  );
}
