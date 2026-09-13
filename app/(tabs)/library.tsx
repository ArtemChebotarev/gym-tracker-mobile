import { useState } from 'react';

import { ExerciseFiltersSheet } from '@components/ExerciseFiltersSheet';
import { ExerciseLibraryScreen, type ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
import { countEntries } from '@components/ExerciseLibraryScreenLogic';
import { handleRequestCreate } from '@components/LibraryScreenLogic';
import { useExerciseLibrary } from '@state/useExerciseLibrary';

export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({});
  const [draftFilters, setDraftFilters] = useState<ExerciseLibraryFilters>({});
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);

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
    </>
  );
}
