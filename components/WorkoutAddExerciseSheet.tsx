// The workout screen's "Add exercise" sheet — 08.7 · Тренировка, "Меню шапки" → Add exercise (task
// 096): the shared ExercisePickerSheet (079) in `multi` mode, captioned with the session's day,
// plus its Filters sheet. Confirming hands the picked exercises, in the order they were checked, to
// `onConfirm`; the caller adds them to the end of the session (048).
//
// Unlike step 2a's MesoEditorAddExerciseSheet, this one owns the picker's state — search text,
// applied and draft filters, the selection — and its library queries: nothing else on the workout
// screen reads them, so the Today tab only decides when the sheet is open and what a confirm does.
// All of it resets when the sheet closes, so every opening starts from an empty selection.
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

export type WorkoutAddExerciseSheetProps = {
  visible: boolean;
  /** Under the title — the session's day, `Week 6 Day 2`. */
  caption: string;
  /** The picked exercises, in the order they were checked. The sheet has already closed. */
  onConfirm: (exerciseIds: ExerciseId[]) => void;
  onClose: () => void;
};

export function WorkoutAddExerciseSheet({
  visible,
  caption,
  onConfirm,
  onClose,
}: WorkoutAddExerciseSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<ExerciseId[]>([]);
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({});
  const [draftFilters, setDraftFilters] = useState<ExerciseLibraryFilters>({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const query = useExerciseLibrary({ ...filters, search });
  // Recomputed live as the Filters sheet's draft changes, so its confirm button shows the count.
  const draftQuery = useExerciseLibrary({ ...draftFilters, search });

  function reset() {
    setSearch('');
    setSelectedIds([]);
    setFilters({});
  }

  function handleClose() {
    onClose();
    reset();
  }

  function handleConfirm() {
    const picked = selectedIds;
    onClose();
    reset();
    onConfirm(picked);
  }

  return (
    <>
      <ExercisePickerSheet
        mode="multi"
        visible={visible}
        title="Add exercise"
        caption={caption}
        presentation="overlay"
        groups={query.data}
        isPending={query.isPending}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onRequestFilters={() => {
          setDraftFilters(filters);
          setIsFiltersOpen(true);
        }}
        onResetFilters={() => setFilters({})}
        selectedIds={selectedIds}
        onChangeSelectedIds={setSelectedIds}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
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
