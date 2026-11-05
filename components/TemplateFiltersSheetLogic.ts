// Pure, non-JSX logic behind TemplateFiltersSheet.tsx and the template list's filter row — see the
// code-style skill, "Screens keep the same split, one level up".

import { filterApplyLabel } from '@design/components/FilterSheet';
import type { FilterRowChip } from '@design/components/FilterRow';
import { TEMPLATE_TAG_GROUP, TEMPLATE_TAGS, type TemplateTag } from '@domain/plan';
import type { TemplateFilters } from '@domain/templateListing';

import { templateDayCountLabel, templateTagLabel } from './templateLabels';

/** The Focus options, in `TEMPLATE_TAGS` order: Full body, Upper body, Lower body. */
export const FOCUS_TAGS: readonly TemplateTag[] = TEMPLATE_TAGS.filter(
  (tag) => TEMPLATE_TAG_GROUP[tag] === 'focus',
);

function toggled<T>(values: readonly T[] | undefined, value: T): T[] | undefined {
  const current = values ?? [];
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
  // Deselecting the last value clears the field, the same as `ExerciseFiltersSheetLogic`: empty or
  // omitted both mean "no narrowing".
  return next.length > 0 ? next : undefined;
}

export function toggleDayCount(filters: TemplateFilters, dayCount: number): TemplateFilters {
  return { ...filters, dayCounts: toggled(filters.dayCounts, dayCount) };
}

export function toggleTag(filters: TemplateFilters, tag: TemplateTag): TemplateFilters {
  return { ...filters, tags: toggled(filters.tags, tag) };
}

/** The Hybrid switch: on keeps only hybrid templates, off lets every one through. */
export function setHybridOnly(filters: TemplateFilters, hybridOnly: boolean): TemplateFilters {
  const others = (filters.tags ?? []).filter((tag) => tag !== 'hybrid');
  const tags = hybridOnly ? [...others, 'hybrid' as const] : others;
  return { ...filters, tags: tags.length > 0 ? tags : undefined };
}

export function isHybridOnly(filters: TemplateFilters): boolean {
  return filters.tags?.includes('hybrid') ?? false;
}

/**
 * Options laid out `perRow` to a row, the last row shorter: side by side past that, the equal-width
 * options squeeze their labels (`5 days`, `Lower body`) past their width. Days go four to a row,
 * Focus three — its labels are longer.
 */
export function optionRows<T>(values: readonly T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < values.length; index += perRow) {
    rows.push(values.slice(index, index + perRow));
  }
  return rows;
}

const DAY_OPTIONS_PER_ROW = 4;
const FOCUS_OPTIONS_PER_ROW = 3;

/** The Days options, four to a row. */
export function dayOptionRows(dayCounts: readonly number[]): number[][] {
  return optionRows(dayCounts, DAY_OPTIONS_PER_ROW);
}

/** The Focus options, three to a row — longer labels than the days'. */
export function focusOptionRows(tags: readonly TemplateTag[]): TemplateTag[][] {
  return optionRows(tags, FOCUS_OPTIONS_PER_ROW);
}

/** The confirm button: `Show 3 templates`, or `No matches` at zero. */
export function templateApplyLabel(resultCount: number): string {
  return filterApplyLabel(resultCount, 'template');
}

/**
 * The filter row's chips for the applied filters: the days first, fewest first, then the tags in
 * `TEMPLATE_TAGS` order — the order the sheet lists them in, not the order they were tapped.
 */
export function templateFilterChips(filters: TemplateFilters): FilterRowChip[] {
  const dayCounts = [...(filters.dayCounts ?? [])].sort((a, b) => a - b);
  const tags = TEMPLATE_TAGS.filter((tag) => filters.tags?.includes(tag));
  return [
    ...dayCounts.map((dayCount) => ({
      key: `days-${dayCount}`,
      label: templateDayCountLabel(dayCount),
    })),
    ...tags.map((tag) => ({ key: `tag-${tag}`, label: templateTagLabel(tag) })),
  ];
}
