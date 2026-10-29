// The workout screen's exercise picker — 08.7 · Тренировка: the shared ExercisePickerSheet (079)
// plus its Filters sheet, for both ways the workout screen picks exercises:
//
// - `add` — "Меню шапки" → Add exercise (096): one exercise at a time since GT-179, the same way as
//   Replace — a tap checks it, and an `Add exercise` button applies it and closes the sheet; the
//   caller adds it to the end of the session (048).
// - `replace` — "Меню упражнения" → Replace exercise (097): a tap checks the exercise (one at a
//   time), and a `Replace` button applies it and closes the sheet; the caller swaps the exercise to
//   it (047). A swap can't be taken back, so a tap alone doesn't make it.
//
// Both are the picker's `single` mode; only the button's copy differs.
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

import { useTabBarClearance } from './useTabBarClearance';
import { ExerciseFiltersSheet } from './ExerciseFiltersSheet';
import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';
import { countEntries } from './ExerciseLibraryScreenLogic';
import { ExercisePickerSheet } from './ExercisePickerSheet';

export type WorkoutExercisePickerMode = 'add' | 'replace';

const CONFIRM_LABELS: Record<WorkoutExercisePickerMode, string> = {
  add: 'Add exercise',
  replace: 'Replace',
};

export type WorkoutExercisePickerSheetProps = {
  visible: boolean;
  title: string;
  /** Under the title — the session's day for Add, the exercise being replaced for Replace. */
  caption: string;
  mode: WorkoutExercisePickerMode;
  /** The picked exercise. The sheet has already closed. */
  onSelect: (exerciseId: ExerciseId) => void;
  onClose: () => void;
};

export function WorkoutExercisePickerSheet(props: WorkoutExercisePickerSheetProps) {
  const { visible, title, caption, mode, onSelect, onClose } = props;
  // The sheet is drawn over the floating tab bar, which would cover the list's last row (GT-47).
  const tabBarClearance = useTabBarClearance();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<ExerciseId | undefined>(undefined);
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
    setSelectedId(undefined);
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
    bottomClearance: tabBarClearance,
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
      <ExercisePickerSheet
        {...shared}
        mode="single"
        selectedId={selectedId}
        onChangeSelectedId={setSelectedId}
        confirmLabel={CONFIRM_LABELS[mode]}
        onConfirm={(picked) => {
          handleClose();
          onSelect(picked);
        }}
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
