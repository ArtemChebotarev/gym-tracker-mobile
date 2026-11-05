// Template listing — what the template list shows and in what order (08.10 · Редактор мезоцикла —
// Flow B, "Шаг T"). Kept separate from `domain/plan.ts` (types only) per the single-responsibility
// rule in AGENTS.md; the exercise library's counterpart is `domain/catalogListing.ts`.

import { nameMatchesSearch } from './names';
import {
  TEMPLATE_TAG_GROUP,
  TEMPLATE_TAGS,
  type MesoTemplate,
  type TemplateTag,
  type TemplateTagGroup,
} from './plan';

/**
 * What the template list is narrowed to (GT-217). Empty or omitted means no narrowing, the same
 * contract as the exercise library's `ExerciseListQuery`.
 */
export type TemplateFilters = {
  /** Templates that train this many days a week — any of them. */
  dayCounts?: readonly number[];
  /** Tags, combined per `TEMPLATE_TAG_GROUP`: any within a group, every group. */
  tags?: readonly TemplateTag[];
};

export function hasActiveTemplateFilters(filters: TemplateFilters): boolean {
  return Boolean(filters.dayCounts?.length || filters.tags?.length);
}

/**
 * Whether `template` passes `filters`: its day count is one of the selected ones, and for every
 * tag group with something selected it carries at least one of the selected tags of that group.
 */
export function matchesTemplateFilters(
  template: Pick<MesoTemplate, 'weekPlan' | 'tags'>,
  filters: TemplateFilters,
): boolean {
  if (filters.dayCounts?.length && !filters.dayCounts.includes(templateDayCount(template))) {
    return false;
  }
  const selectedByGroup = new Map<TemplateTagGroup, TemplateTag[]>();
  for (const tag of filters.tags ?? []) {
    const group = TEMPLATE_TAG_GROUP[tag];
    selectedByGroup.set(group, [...(selectedByGroup.get(group) ?? []), tag]);
  }
  const carried = template.tags ?? [];
  return [...selectedByGroup.values()].every((selected) =>
    selected.some((tag) => carried.includes(tag)),
  );
}

/** The day counts the visible templates train, fewest first — the options of the Days filter. */
export function templateDayCountOptions(templates: readonly MesoTemplate[]): number[] {
  const counts = new Set(
    templates
      .filter((template) => !template.isHidden)
      .map((template) => templateDayCount(template)),
  );
  return [...counts].sort((a, b) => a - b);
}

/**
 * A template's tags in `TEMPLATE_TAGS` order with anything else dropped: a database written by a
 * newer build may hold a tag this one does not know, and that tag is simply not shown.
 */
export function knownTemplateTags(tags: readonly string[]): TemplateTag[] {
  return TEMPLATE_TAGS.filter((tag) => tags.includes(tag));
}

/** How many training days a template's week has — the `· 3 days` on its row. */
export function templateDayCount(template: Pick<MesoTemplate, 'weekPlan'>): number {
  return template.weekPlan.days.length;
}

/**
 * The templates the list shows for `search` and `filters`: hidden ones never, the rest matched by
 * name (`nameMatchesSearch`) and by `matchesTemplateFilters`. Fewest days first, then by name — a new user picks a split by how often
 * they can train, and the day count is what the rows lead with after the name.
 */
export function listTemplates(
  templates: readonly MesoTemplate[],
  search: string = '',
  filters: TemplateFilters = {},
): MesoTemplate[] {
  return templates
    .filter(
      (template) =>
        !template.isHidden &&
        nameMatchesSearch(template.name, search) &&
        matchesTemplateFilters(template, filters),
    )
    .sort((a, b) => templateDayCount(a) - templateDayCount(b) || a.name.localeCompare(b.name));
}

/** A run of templates with the same number of training days — one section of the list. */
export type TemplateDayGroup = {
  dayCount: number;
  templates: MesoTemplate[];
};

/**
 * `templates` split by how many days a week they train, fewest first — the list's sections, so a
 * split is found by how often one can train (08.10, "Шаг T"). Within a group the order is kept,
 * so passing `listTemplates`' result keeps its by-name order.
 */
export function groupTemplatesByDayCount(templates: readonly MesoTemplate[]): TemplateDayGroup[] {
  const groups = new Map<number, MesoTemplate[]>();
  for (const template of templates) {
    const dayCount = templateDayCount(template);
    groups.set(dayCount, [...(groups.get(dayCount) ?? []), template]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dayCount, group]) => ({ dayCount, templates: group }));
}
