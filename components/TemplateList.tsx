// The template list — 08.10 · Редактор мезоцикла — Flow B, "Шаг T". Modeled on the exercise
// library's list (08.6): a search field on top, `ListRow`s under it. Reusable on purpose: today it
// sits inside the wizard's step T, later it may also live in Library or Cycles (08.10, open
// question), so it knows nothing about what a tap opens — the row's template goes out through
// `onSelectTemplate` and the host decides.
//
// Fully controlled, like ExerciseLibraryScreen: the search text lives in the caller. Hidden
// templates are never shown and rows come in `listTemplates` order.
//
// No Filters button, chips, sections or muscle-group colors — deliberately left out of v1.0
// (08.10, "Чего нет в v1.0"). No subtitle yet either: it is `MesoTemplate.description`, which GT-5
// adds; until then a row is the name and its day count.
//
// JSX only — pure helpers live in TemplateListLogic.ts, per AGENTS.md's "Code organization".

import { useMemo } from 'react';
import { FlatList } from 'react-native';

import { EmptyState } from '@design/components/EmptyState';
import { ListRow } from '@design/components/ListRow';
import { SearchField } from '@design/components/SearchField';
import { SearchIcon } from '@design/icons/SearchIcon';
import type { MesoTemplate } from '@domain/plan';
import { listTemplates } from '@domain/templateListing';

import { formatDayCount, templateBadge } from './TemplateListLogic';

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
        <FlatList
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          data={visible}
          keyExtractor={(template) => template.id}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              titleSuffix={formatDayCount(item)}
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
