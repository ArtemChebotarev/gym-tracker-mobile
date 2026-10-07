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
// No Filters button, chips or muscle-group colors — deliberately left out of v1.0 (08.10, "Чего
// нет в v1.0"). Every row has a subtitle — see `formatTemplateSubtitle`.
//
// JSX only — pure helpers live in TemplateListLogic.ts, per AGENTS.md's "Code organization".

import { useMemo } from 'react';
import { SectionList } from 'react-native';

import { EmptyState } from '@design/components/EmptyState';
import { ListRow } from '@design/components/ListRow';
import { SearchField } from '@design/components/SearchField';
import { SectionHeader } from '@design/components/SectionHeader';
import { SearchIcon } from '@design/icons/SearchIcon';
import type { MesoTemplate } from '@domain/plan';
import { groupTemplatesByDayCount, listTemplates } from '@domain/templateListing';

import { formatTemplateSubtitle, templateSectionTitle } from './templateLabels';
import { templateBadge } from './TemplateListLogic';

export type TemplateListProps = {
  templates: readonly MesoTemplate[];
  search: string;
  onSearchChange: (search: string) => void;
  onSelectTemplate: (template: MesoTemplate) => void;
};

export function TemplateList({
  templates,
  search,
  onSearchChange,
  onSelectTemplate,
}: TemplateListProps) {
  const visible = useMemo(() => listTemplates(templates, search), [templates, search]);
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

  return (
    <>
      <SearchField value={search} onChangeText={onSearchChange} placeholder="Search templates" />

      {visible.length === 0 && trimmedSearch.length > 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={`No templates match "${trimmedSearch}"`}
          description="Check the spelling or clear the search."
          actionLabel="Clear search"
          onAction={() => onSearchChange('')}
        />
      ) : (
        <SectionList
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
