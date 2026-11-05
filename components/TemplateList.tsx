// The template list — 08.10 · Редактор мезоцикла — Flow B, "Шаг T". Modeled on the exercise
// library's list (08.6): a search field on top, `ListRow`s under it. Reusable on purpose: today it
// sits inside the wizard's step T, later it may also live in Library or Cycles (08.10, open
// question), so it knows nothing about what a tap opens — the row's template goes out through
// `onSelectTemplate` and the host decides.
//
// Fully controlled, like ExerciseLibraryScreen: the search text lives in the caller. Hidden
// templates are never shown.
//
// Grouped by days a week, under the same sticky SectionHeader the library groups exercises by
// muscle — `3 days a week` and how many templates train that often (Artem, 05.10.2026; 08.10
// first left sections out on the grounds that the day count was in every row's title, and the
// count moved from the rows into the headers instead). Within a section, by name.
//
// Rows are divided under band headers, as in Library (GT-237; GT-217 had set them as blocks). A
// row carries the template's description, then its tags (`templateRowTags`). Under the search
// field, the same Filters row as the library's (`FilterRow`): the Filters chip, a chip per applied
// value, Reset. It lifts 08.10's "no filters in v1.0" (GT-217). The sheet it opens is the caller's
// — see MesoTemplateEditorScreen — and so are the applied filters, like the search text.
//
// A search that finds nothing says so and offers to clear the search; filters that leave nothing,
// with no search typed, say so and offer to reset them — the library's two empty states.
//
// JSX only — pure helpers live in TemplateListLogic.ts, per AGENTS.md's "Code organization".

import { useMemo } from 'react';
import { SectionList } from 'react-native';

import { EmptyState } from '@design/components/EmptyState';
import { FilterRow } from '@design/components/FilterRow';
import { ListRow } from '@design/components/ListRow';
import { SearchField } from '@design/components/SearchField';
import { listBleed, SectionHeader } from '@design/components/SectionHeader';
import { SearchIcon } from '@design/icons/SearchIcon';
import type { MesoTemplate } from '@domain/plan';
import {
  groupTemplatesByDayCount,
  hasActiveTemplateFilters,
  listTemplates,
  type TemplateFilters,
} from '@domain/templateListing';

import { formatTemplateSubtitle, templateRowTags, templateSectionTitle } from './templateLabels';
import { templateFilterChips } from './TemplateFiltersSheetLogic';
import { templateBadge } from './TemplateListLogic';

const BLEED = listBleed();

export type TemplateListProps = {
  templates: readonly MesoTemplate[];
  search: string;
  onSearchChange: (search: string) => void;
  /** The applied filters (GT-217). */
  filters: TemplateFilters;
  onRequestFilters: () => void;
  onResetFilters: () => void;
  onSelectTemplate: (template: MesoTemplate) => void;
};

export function TemplateList({
  templates,
  search,
  onSearchChange,
  filters,
  onRequestFilters,
  onResetFilters,
  onSelectTemplate,
}: TemplateListProps) {
  const visible = useMemo(
    () => listTemplates(templates, search, filters),
    [templates, search, filters],
  );
  const sections = useMemo(
    () =>
      groupTemplatesByDayCount(visible).map((group) => ({
        key: String(group.dayCount),
        title: templateSectionTitle(group.dayCount),
        data: group.templates,
      })),
    [visible],
  );
  const trimmedSearch = search.trim();
  const filtersActive = hasActiveTemplateFilters(filters);

  return (
    <>
      <SearchField value={search} onChangeText={onSearchChange} placeholder="Search templates" />

      <FilterRow
        chips={templateFilterChips(filters)}
        resultCount={visible.length}
        onRequestFilters={onRequestFilters}
        onReset={onResetFilters}
      />

      {visible.length === 0 && trimmedSearch.length > 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={`No templates match "${trimmedSearch}"`}
          description="Check the spelling or clear the search."
          actionLabel="Clear search"
          onAction={() => onSearchChange('')}
        />
      ) : visible.length === 0 && filtersActive ? (
        <EmptyState
          icon={SearchIcon}
          title="No templates match your filters"
          description="Try different filters, or reset them."
          actionLabel="Reset filters"
          onAction={onResetFilters}
        />
      ) : (
        <SectionList
          style={BLEED.style}
          contentContainerStyle={BLEED.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled
          sections={sections}
          keyExtractor={(template) => template.id}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} count={section.data.length} />
          )}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={formatTemplateSubtitle(item)}
              tags={templateRowTags(item)}
              badge={templateBadge(item)}
              trailing={{ type: 'chevron' }}
              onPress={() => onSelectTemplate(item)}
            />
          )}
        />
      )}
    </>
  );
}
