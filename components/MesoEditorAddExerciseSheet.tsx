// Step 2a's "Add exercise" sheet — see 08.5 · Редактор мезоцикла — Flow A, "Шаг 2a — Add exercise
// (sheet)". Reuses 08.6 · Библиотека упражнений's own listing (grouped by MuscleGroup, on-the-fly
// search, "last worked set" row caption, isHidden always excluded) via the same
// ExerciseListGroup shape and useExerciseLibrary hook the Exercises tab uses — see
// app/meso-editor/new.tsx, which queries it the same way app/(tabs)/library.tsx does. Only the
// row's accessory and the footer differ: a checkbox instead of a chevron (multi-select instead of
// opening detail), and an `Add N exercises` counter button instead of `Show N exercises`.
//
// Despite the wizard having three steps, this sheet is a popup layered over step 2's own content
// (a BottomSheet/Modal), not a fourth step in the wizard's step state — the same relationship
// ExerciseFiltersSheet/ExerciseFormSheet have to ExerciseLibraryScreen (rendered as a sibling in
// app/(tabs)/library.tsx). WizardScreen's header/progress-bar/footer stay exactly as they were on
// step 2 underneath it.
//
// Fully controlled, the same way ExerciseFiltersSheet.tsx is: the caller owns the search text and
// the in-progress selection (reset each time the sheet opens), and this component only maps
// groups to rows and calls back on toggle/confirm/close.
//
// Renders each group as a plain View + .map() rather than a SectionList, unlike
// ExerciseLibraryScreen — BottomSheet already wraps its children in a ScrollView, and nesting a
// virtualized list inside a plain ScrollView breaks scrolling and logs an RN warning. The catalog
// is small enough that this costs nothing in practice.
//
// JSX/rendering only — styles live in MesoEditorAddExerciseSheetStyles.ts and pure helpers in
// MesoEditorAddExerciseSheetLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import type { ExerciseId } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { ListRow } from '@design/components/ListRow';
import { SearchField } from '@design/components/SearchField';
import { SectionHeader } from '@design/components/SectionHeader';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import { formatSubtitle, sectionDotColor } from './ExerciseLibraryScreenLogic';
import { confirmButtonLabel, toggleExerciseSelection } from './MesoEditorAddExerciseSheetLogic';
import { styles } from './MesoEditorAddExerciseSheetStyles';

export type MesoEditorAddExerciseSheetProps = {
  visible: boolean;
  dayNumber: number;
  groups: ExerciseListGroup[] | undefined;
  isPending: boolean;
  search: string;
  onSearchChange: (search: string) => void;
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
  selectedIds,
  onChangeSelectedIds,
  onConfirm,
  onClose,
}: MesoEditorAddExerciseSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add exercise"
      footer={
        <View style={styles.footerButton}>
          <Button
            label={confirmButtonLabel(selectedIds.length)}
            onPress={onConfirm}
            disabled={selectedIds.length === 0}
          />
        </View>
      }
    >
      <Text style={styles.dayCaption}>{`Day ${dayNumber}`}</Text>

      <View style={styles.searchField}>
        <SearchField value={search} onChangeText={onSearchChange} placeholder="Search exercises" />
      </View>

      {isPending && <Text style={styles.status}>Loading…</Text>}

      {!isPending &&
        (groups ?? []).map((group) => (
          <View key={group.muscleGroup}>
            <SectionHeader
              title={getMuscleGroupLabel(group.muscleGroup)}
              count={group.entries.length}
              dotColor={sectionDotColor(group.muscleGroup)}
            />
            {group.entries.map((entry) => (
              <ListRow
                key={entry.exercise.id}
                title={entry.exercise.name}
                subtitle={formatSubtitle(entry.lastSetLog)}
                leading={{ type: 'checkbox', checked: selectedIds.includes(entry.exercise.id) }}
                onPress={() => onChangeSelectedIds(toggleExerciseSelection(selectedIds, entry.exercise.id))}
              />
            ))}
          </View>
        ))}
    </BottomSheet>
  );
}
