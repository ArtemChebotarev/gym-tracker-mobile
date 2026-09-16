// Presentational Exercises-library screen — see 08.6 · Библиотека упражнений, "Exercises —
// список". Fully controlled: all data and interaction state (search text, active filters) live
// in the caller, so this component can be rendered and asserted on with plain props, the same
// way design/components are tested — no QueryProvider or real repositories needed here.
//
// The "+" button and the search-empty state's "Create" action open 066 · New/Edit exercise (see
// ExerciseFormSheet.tsx); `onRequestFilters` opens 064 · Filters (see ExerciseFiltersSheet.tsx).
// The caller composes both sheets as siblings rather than this component rendering them
// directly, keeping this screen fully controlled and testable with plain props.
//
// JSX/rendering only — styles live in ExerciseLibraryScreenStyles.ts and pure helpers in
// ExerciseLibraryScreenLogic.ts, per AGENTS.md's "Code organization".

import { useMemo } from 'react';
import { SectionList, Text } from 'react-native';

import type {
  ExerciseListEntry,
  ExerciseListQuery,
  ExerciseListGroup,
} from '@domain/catalogListing';
import { EmptyState } from '@design/components/EmptyState';
import { IconButton } from '@design/components/IconButton';
import { ListRow } from '@design/components/ListRow';
import { RootScreen } from '@design/components/RootScreen';
import { SearchField } from '@design/components/SearchField';
import { SectionHeader } from '@design/components/SectionHeader';

import { ExerciseFilterRow } from './ExerciseFilterRow';
import {
  buildSections,
  countEntries,
  equipmentSuffix,
  formatSubtitle,
  hasActiveFilters,
  sectionDotColor,
  type ExerciseSection,
} from './ExerciseLibraryScreenLogic';
import { styles } from './ExerciseLibraryScreenStyles';

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
  const sections = useMemo<ExerciseSection[]>(() => buildSections(groups ?? []), [groups]);

  const showSearchEmptyState = !isPending && groups?.length === 0 && trimmedSearch.length > 0;
  const showFilterEmptyState =
    !isPending && groups?.length === 0 && trimmedSearch.length === 0 && filtersActive;
  const showList = !isPending && (groups?.length ?? 0) > 0;

  return (
    <RootScreen
      title="Exercises"
      trailing={
        <IconButton
          accessibilityLabel="Add exercise"
          variant="accent"
          onPress={() => onRequestCreate()}
        >
          <Text style={styles.addIcon}>+</Text>
        </IconButton>
      }
    >
      <SearchField value={search} onChangeText={onSearchChange} placeholder="Search exercises" />

      <ExerciseFilterRow
        filters={filters}
        resultCount={resultCount}
        onRequestFilters={onRequestFilters}
        onResetFilters={onResetFilters}
      />

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
              titleSuffix={equipmentSuffix(item.exercise)}
              subtitle={formatSubtitle(item.lastSetLog)}
              badge={item.exercise.source === 'custom' ? { label: 'Custom' } : undefined}
              trailing={{ type: 'chevron' }}
            />
          )}
        />
      )}
    </RootScreen>
  );
}
