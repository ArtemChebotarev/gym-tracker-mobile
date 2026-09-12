// Presentational Exercises-library screen — see 08.6 · Библиотека упражнений, "Exercises —
// список". Fully controlled: all data and interaction state (search text, active filters) live
// in the caller, so this component can be rendered and asserted on with plain props, the same
// way design/components are tested — no QueryProvider or real repositories needed here.
//
// The "+" button, the "Filters" chip, and the search-empty state's "Create" action all point at
// sheets that don't exist yet (066 · New/Edit exercise, 064 · Filters) — task 063 scopes to this
// list screen only, so `onRequestCreate`/`onRequestFilters` are the caller's problem to wire up
// once those sheets ship.

import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import type { Exercise, MuscleGroup } from '@domain/catalog';
import type { ExerciseListEntry, ExerciseListGroup, ExerciseListQuery } from '@domain/catalogListing';
import type { SetLog } from '@domain/execution';
import { parseUtcIso } from '@domain/time';
import { Chip } from '@design/components/Chip';
import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
import { ListRow } from '@design/components/ListRow';
import { SearchField } from '@design/components/SearchField';
import { SectionHeader } from '@design/components/SectionHeader';
import { formatRelativeDate } from '@design/formatDate';
import { getCategoryColor, getMuscleGroupCategory } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export type ExerciseLibraryFilters = Omit<ExerciseListQuery, 'search'>;

export type ExerciseLibraryScreenProps = {
  groups: ExerciseListGroup[] | undefined;
  isPending: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  filters: ExerciseLibraryFilters;
  onResetFilters: () => void;
  onRequestCreate: (prefillName?: string) => void;
  onRequestFilters: () => void;
};

type ExerciseSection = {
  muscleGroup: MuscleGroup;
  title: string;
  data: ExerciseListEntry[];
};

const NEVER_PERFORMED = 'Never performed';

function hasActiveFilters(filters: ExerciseLibraryFilters): boolean {
  return Boolean(filters.muscleGroups?.length || filters.sources?.length || filters.performedOnly);
}

function countEntries(groups: ExerciseListGroup[]): number {
  return groups.reduce((total, group) => total + group.entries.length, 0);
}

function formatSubtitle(lastSetLog: SetLog | null): string {
  if (!lastSetLog) {
    return NEVER_PERFORMED;
  }
  const when = formatRelativeDate(parseUtcIso(lastSetLog.completedAt));
  return `${lastSetLog.weight} kg × ${lastSetLog.reps} · ${when}`;
}

function sectionDotColor(muscleGroup: MuscleGroup): string | undefined {
  const category = getMuscleGroupCategory(muscleGroup);
  return category ? getCategoryColor(category) : undefined;
}

function sourceLabel(source: Exercise['source']): string {
  return source === 'custom' ? 'Custom' : 'Catalog';
}

export function ExerciseLibraryScreen({
  groups,
  isPending,
  search,
  onSearchChange,
  filters,
  onResetFilters,
  onRequestCreate,
  onRequestFilters,
}: ExerciseLibraryScreenProps) {
  const trimmedSearch = search.trim();
  const filtersActive = hasActiveFilters(filters);
  const resultCount = useMemo(() => (groups ? countEntries(groups) : 0), [groups]);

  const sections = useMemo<ExerciseSection[]>(
    () =>
      (groups ?? []).map((group) => ({
        muscleGroup: group.muscleGroup,
        title: getMuscleGroupLabel(group.muscleGroup),
        data: group.entries,
      })),
    [groups],
  );

  const showSearchEmptyState = !isPending && groups?.length === 0 && trimmedSearch.length > 0;
  const showFilterEmptyState =
    !isPending && groups?.length === 0 && trimmedSearch.length === 0 && filtersActive;
  const showList = !isPending && (groups?.length ?? 0) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercises</Text>
        <IconButton accessibilityLabel="Add exercise" variant="accent" onPress={() => onRequestCreate()}>
          <Text style={styles.addIcon}>+</Text>
        </IconButton>
      </View>

      <SearchField value={search} onChangeText={onSearchChange} placeholder="Search exercises" />

      <View style={styles.filterRow}>
        <Chip variant="selectable" label="Filters" selected={filtersActive} onPress={onRequestFilters} />
        {filters.muscleGroups?.map((muscleGroup) => (
          <Chip
            key={`muscle-group-${muscleGroup}`}
            variant="static"
            label={getMuscleGroupLabel(muscleGroup)}
            dotColor={sectionDotColor(muscleGroup)}
          />
        ))}
        {filters.sources?.map((source) => (
          <Chip key={`source-${source}`} variant="static" label={sourceLabel(source)} />
        ))}
        {filters.performedOnly && <Chip variant="static" label="Performed only" />}
        <Chip variant="counter" label="Exercises" count={resultCount} />
      </View>

      {isPending && <Text style={styles.status}>Loading…</Text>}

      {showSearchEmptyState && (
        <EmptyState
          title={`No exercises match "${trimmedSearch}"`}
          description="Try a different search, or add it as a new exercise."
          actionLabel={`Create "${trimmedSearch}"`}
          onAction={() => onRequestCreate(trimmedSearch)}
        />
      )}

      {showFilterEmptyState && (
        <EmptyState
          title="No exercises match your filters"
          description="Try different filters, or reset them."
          actionLabel="Reset filters"
          onAction={onResetFilters}
        />
      )}

      {showList && (
        <SectionList<ExerciseListEntry, ExerciseSection>
          sections={sections}
          keyExtractor={(item) => item.exercise.id}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              count={section.data.length}
              dotColor={sectionDotColor(section.muscleGroup)}
            />
          )}
          renderItem={({ item }) => (
            <ListRow
              title={item.exercise.name}
              subtitle={formatSubtitle(item.lastSetLog)}
              badge={item.exercise.source === 'custom' ? { label: 'Custom' } : undefined}
              trailing={{ type: 'chevron' }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/screen'],
    gap: SPACING['space/gap'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: TYPOGRAPHY['type/screen-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/screen-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  addIcon: {
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['accent/on'],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
});
