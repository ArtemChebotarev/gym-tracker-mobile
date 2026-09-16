// The shared exercise-picker sheet — see task 079 · Рефакторинг: общий Exercise picker (список +
// поиск + Filters) для Add exercise и Replace exercise. Reuses 08.6 · Библиотека упражнений's own
// listing (grouped by MuscleGroup, on-the-fly search, "last worked set" row caption, isHidden
// always excluded) and its Filters access — both already shared via ExerciseListGroup /
// ExerciseLibraryScreenLogic.ts / ExerciseFilterRow.tsx — behind a single `mode` parameter:
//
// - `multi` (task 077's "Add exercise" sheet, 08.5 "Шаг 2a"): checkboxes accumulate a selection,
//   confirmed via a footer button captioned with the running count.
// - `single` (the future "Replace exercise" sheet, 05 · Workout Execution & Logging, "Заменить
//   упражнение"; 047): tapping a row applies that exercise immediately and closes the sheet —
//   there is exactly one exercise to pick, so there is nothing to confirm and no footer.
//
// Renders each group as a plain View + .map() rather than a SectionList — BottomSheet already
// wraps its children in a ScrollView, and nesting a virtualized list inside a plain ScrollView
// breaks scrolling and logs an RN warning (same reasoning task 077's sheet already had). The
// catalog is small enough that this costs nothing in practice.
//
// Fully controlled, the same way ExerciseFiltersSheet.tsx and ExerciseLibraryScreen.tsx are: the
// caller owns the search text, the active filters, and (in `multi` mode) the in-progress
// selection; this component only maps groups to rows and calls back on toggle/select/confirm/
// close. The Filters sheet itself is composed by the caller as a sibling, exactly the way
// app/(tabs)/library.tsx composes ExerciseFiltersSheet next to ExerciseLibraryScreen — this
// keeps ExercisePickerSheet itself free of Filters' own draft/apply state.
//
// JSX/rendering only — styles live in ExercisePickerSheetStyles.ts and pure helpers in
// ExercisePickerSheetLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import type { ExerciseId } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { ListRow } from '@design/components/ListRow';
import { SearchField } from '@design/components/SearchField';
import { SectionHeader } from '@design/components/SectionHeader';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import { ExerciseFilterRow } from './ExerciseFilterRow';
import type { ExerciseLibraryFilters } from './ExerciseLibraryScreen';
import { countEntries, formatSubtitle, sectionDotColor } from './ExerciseLibraryScreenLogic';
import { confirmButtonLabel, toggleExerciseSelection } from './ExercisePickerSheetLogic';
import { styles } from './ExercisePickerSheetStyles';

type ExercisePickerSelection =
  | { mode: 'single'; onSelect: (id: ExerciseId) => void }
  | {
      mode: 'multi';
      selectedIds: readonly ExerciseId[];
      onChangeSelectedIds: (ids: ExerciseId[]) => void;
      onConfirm: () => void;
    };

export type ExercisePickerSheetProps = {
  visible: boolean;
  title: string;
  caption?: string;
  groups: ExerciseListGroup[] | undefined;
  isPending: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  filters: ExerciseLibraryFilters;
  onRequestFilters: () => void;
  onResetFilters: () => void;
  onClose: () => void;
  /** Forwarded to BottomSheet — see its own doc on these two props. */
  animated?: boolean;
  presentation?: 'modal' | 'overlay';
} & ExercisePickerSelection;

export function ExercisePickerSheet(props: ExercisePickerSheetProps) {
  const {
    visible,
    title,
    caption,
    groups,
    isPending,
    search,
    onSearchChange,
    filters,
    onRequestFilters,
    onResetFilters,
    onClose,
    animated,
    presentation,
  } = props;
  const resultCount = countEntries(groups ?? []);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      animated={animated}
      presentation={presentation}
      footer={
        props.mode === 'multi' ? (
          <View style={styles.footerButton}>
            <Button
              label={confirmButtonLabel(props.selectedIds.length)}
              onPress={props.onConfirm}
              disabled={props.selectedIds.length === 0}
            />
          </View>
        ) : undefined
      }
    >
      {caption !== undefined && <Text style={styles.caption}>{caption}</Text>}

      <View style={styles.searchField}>
        <SearchField value={search} onChangeText={onSearchChange} placeholder="Search exercises" />
      </View>

      <View style={styles.filterRow}>
        <ExerciseFilterRow
          filters={filters}
          resultCount={resultCount}
          onRequestFilters={onRequestFilters}
          onResetFilters={onResetFilters}
        />
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
            {group.entries.map((entry) =>
              props.mode === 'multi' ? (
                <ListRow
                  key={entry.exercise.id}
                  title={entry.exercise.name}
                  subtitle={formatSubtitle(entry.lastSetLog)}
                  leading={{
                    type: 'checkbox',
                    checked: props.selectedIds.includes(entry.exercise.id),
                  }}
                  onPress={() =>
                    props.onChangeSelectedIds(
                      toggleExerciseSelection(props.selectedIds, entry.exercise.id),
                    )
                  }
                />
              ) : (
                <ListRow
                  key={entry.exercise.id}
                  title={entry.exercise.name}
                  subtitle={formatSubtitle(entry.lastSetLog)}
                  trailing={{ type: 'chevron' }}
                  onPress={() => {
                    props.onSelect(entry.exercise.id);
                    onClose();
                  }}
                />
              ),
            )}
          </View>
        ))}
    </BottomSheet>
  );
}
