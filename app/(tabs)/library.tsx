import { useState } from 'react';

import { ExerciseLibraryScreen, type ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
import { handleRequestCreate, handleRequestFilters } from '@components/LibraryScreenLogic';
import { useExerciseLibrary } from '@state/useExerciseLibrary';

export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({});

  const query = useExerciseLibrary({ ...filters, search });

  return (
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
  );
}
