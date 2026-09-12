import { useState } from 'react';
import { Alert } from 'react-native';

import { ExerciseLibraryScreen, type ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
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

// 066 · New/Edit exercise and 064 · Filters aren't built yet — task 063 scopes to the list
// screen only (see components/ExerciseLibraryScreen.tsx), so these placeholders just say so.
function handleRequestCreate(prefillName?: string) {
  Alert.alert(
    'Coming soon',
    prefillName
      ? `Creating "${prefillName}" will be available once the New Exercise sheet ships.`
      : 'Creating a new exercise will be available once the New Exercise sheet ships.',
  );
}

function handleRequestFilters() {
  Alert.alert('Coming soon', 'Editing filters will be available once the Filters sheet ships.');
}
