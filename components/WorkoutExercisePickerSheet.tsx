// The workout screen's exercise picker — 08.7 · Тренировка: the shared ExercisePickerSheet (079)
// plus its Filters sheet, for both ways the workout screen picks exercises:
//
// - `multi` — "Меню шапки" → Add exercise (096): checkboxes and a confirm button; the caller adds
//   the picked exercises, in the order they were checked, to the end of the session (048).
// - `single` — "Меню упражнения" → Replace exercise (097): a tap picks the exercise and closes the
//   sheet; the caller swaps the exercise to it (047).
//
// Unlike step 2a's MesoEditorAddExerciseSheet, this one owns the picker's state — search text,
// applied and draft filters, the selection — and its library queries: nothing else on the workout
// screen reads them, so the Today tab only decides when the sheet is open and what a pick does.
// All of it resets when the sheet closes, so every opening starts afresh.
//
// The picker is an `overlay` sheet, like step 2a's: Filters is a real native Modal and opens on top
// of it, and two native modal windows open at once freeze touch handling (08.5, task 079).

import { useState } from 'react';

import type { ExerciseId } from '@domain/catalog';
import { useExerciseLibrary } from '@state/useExerciseLibrary';

import { ExerciseFiltersSheet } from './ExerciseFiltersSheet';
import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';
import { countEntries } from './ExerciseLibraryScreenLogic';
import { ExercisePickerSheet } from './ExercisePickerSheet';

type WorkoutExercisePickerSelection =
  /** The picked exercises, in the order they were checked. The sheet has already closed. */
  | { mode: 'multi'; onConfirm: (exerciseIds: ExerciseId[]) => void }
  /** The tapped exercise. The sheet has already closed. */
  | { mode: 'single'; onSelect: (exerciseId: ExerciseId) => void };

export type WorkoutExercisePickerSheetProps = {
  visible: boolean;
  title: string;
  /** Under the title — the session's day for Add, the exercise being replaced for Replace. */
  caption: string;
  onClose: () => void;
} & WorkoutExercisePickerSelection;

export function WorkoutExercisePickerSheet(props: WorkoutExercisePickerSheetProps) {
  const { visible, title, caption, onClose } = props;
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<ExerciseId[]>([]);
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({});
  const [draftFilters, setDraftFilters] = useState<ExerciseLibraryFilters>({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  // Both stay off while the sheet is hidden — it's always mounted on the workout screen, and the
  // catalog is only needed once it opens.
  const query = useExerciseLibrary({ ...filters, search }, { enabled: visible });
  // Recomputed live as the Filters sheet's draft changes, so its confirm button shows the count.
  const draftQuery = useExerciseLibrary({ ...draftFilters, search }, { enabled: isFiltersOpen });

  function reset() {
    setSearch('');
    setSelectedIds([]);
    setFilters({});
  }

  function handleClose() {
    onClose();
    reset();
  }

  const shared = {
    visible,
    title,
    caption,
    presentation: 'overlay' as const,
    groups: query.data,
    isPending: query.isPending,
    search,
    onSearchChange: setSearch,
    filters,
    onRequestFilters: () => {
      setDraftFilters(filters);
      setIsFiltersOpen(true);
    },
    onResetFilters: () => setFilters({}),
    onClose: handleClose,
  };

  return (
    <>
      {props.mode === 'multi' ? (
        <ExercisePickerSheet
          {...shared}
          mode="multi"
          selectedIds={selectedIds}
          onChangeSelectedIds={setSelectedIds}
          onConfirm={() => {
            const picked = selectedIds;
            handleClose();
            props.onConfirm(picked);
          }}
        />
      ) : (
        <ExercisePickerSheet
          {...shared}
          mode="single"
          onSelect={(exerciseId) => {
            handleClose();
            props.onSelect(exerciseId);
          }}
        />
      )}
      <ExerciseFiltersSheet
        visible={isFiltersOpen}
        filters={draftFilters}
        onChangeFilters={setDraftFilters}
        resultCount={draftQuery.data ? countEntries(draftQuery.data) : 0}
        onReset={() => setDraftFilters({})}
        onApply={() => {
          setFilters(draftFilters);
          setIsFiltersOpen(false);
        }}
        onClose={() => setIsFiltersOpen(false)}
      />
    </>
  );
}
