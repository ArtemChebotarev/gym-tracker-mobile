// Step 2a's "Add exercise" sheet — see 08.5 · Редактор мезоцикла — Flow A, "Шаг 2a — Add exercise
// (sheet)". A thin, day-specific wrapper around the shared ExercisePickerSheet (task 079 ·
// Рефакторинг: общий Exercise picker): `multi` mode is exactly task 077's original behavior
// (checkboxes + a running-count confirm footer), and Filters access — missing from 077's original
// scope — now comes for free from the shared component instead of a second copy of that row.
//
// Despite the wizard having three steps, this sheet is a popup layered over step 2's own content
// (a BottomSheet/Modal), not a fourth step in the wizard's step state. WizardScreen's own
// header/progress-bar/footer stay exactly as they were on step 2 underneath it.
//
// Fully controlled, the same way ExercisePickerSheet.tsx is: the caller (app/meso-editor/new.tsx)
// owns the search text, the active filters, and the in-progress selection (reset each time the
// sheet opens), and this component only maps its day-specific prop names onto the shared sheet.

import type { ExerciseId } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';

import { ExercisePickerSheet } from './ExercisePickerSheet';
import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';

export type MesoEditorAddExerciseSheetProps = {
  visible: boolean;
  dayNumber: number;
  groups: ExerciseListGroup[] | undefined;
  isPending: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  filters: ExerciseLibraryFilters;
  onRequestFilters: () => void;
  onResetFilters: () => void;
  selectedIds: readonly ExerciseId[];
  onChangeSelectedIds: (ids: ExerciseId[]) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function MesoEditorAddExerciseSheet({
  visible,
  dayNumber,
  groups,
  isPending,
  search,
  onSearchChange,
  filters,
  onRequestFilters,
  onResetFilters,
  selectedIds,
  onChangeSelectedIds,
  onConfirm,
  onClose,
}: MesoEditorAddExerciseSheetProps) {
  return (
    <ExercisePickerSheet
      mode="multi"
      visible={visible}
      title="Add exercise"
      caption={`Day ${dayNumber}`}
      // This sheet and ExerciseFiltersSheet hand off to each other in immediate succession —
      // one is hidden (not closed with its own slide-down) the instant the other becomes
      // visible (see app/meso-editor/new.tsx). Animating both legs of that handoff read as a
      // stutter, not a single deliberate motion, so both sheets in this flow open/close instantly.
      animated={false}
      groups={groups}
      isPending={isPending}
      search={search}
      onSearchChange={onSearchChange}
      filters={filters}
      onRequestFilters={onRequestFilters}
      onResetFilters={onResetFilters}
      selectedIds={selectedIds}
      onChangeSelectedIds={onChangeSelectedIds}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
