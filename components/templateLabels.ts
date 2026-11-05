// How a template is named on screen — its title, its one-line subtitle, and the list's section
// headers. Shared by the template list (TemplateList.tsx) and the template preview sheet
// (TemplatePreviewSheet.tsx). The list groups templates by days a week, so its rows carry the bare
// name; the sheet stands alone and names the days in its title.

import type { ListRowBadge } from '@design/components/ListRow';
import type { MesoTemplate, TemplateTag } from '@domain/plan';
import { templateDayCount } from '@domain/templateListing';

function plural(count: number, noun: string): string {
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`;
}

/**
 * The preview sheet's title, `Full Body · 3 days` — one line in one color, as 08.10's mockup draws
 * it. The day count isn't part of the template's name; it is appended from the week plan. The
 * list's rows don't carry it: their section header already says it (`templateSectionTitle`).
 */
export function formatTemplateTitle(template: Pick<MesoTemplate, 'name' | 'weekPlan'>): string {
  return `${template.name} · ${plural(templateDayCount(template), 'day')}`;
}

/** A section of the template list: `3 days a week`. */
export function templateSectionTitle(dayCount: number): string {
  return `${plural(dayCount, 'day')} a week`;
}

/**
 * The row's subtitle, and the line under the preview sheet's title. Every row has one, so rows
 * keep the mockup's two-line height (08.10, "Строка"). It is the template's own `description`; a
 * template that has none gets the summary of its week — `20 exercises · 68 sets a week` — instead.
 */
export function formatTemplateSubtitle(
  template: Pick<MesoTemplate, 'weekPlan' | 'description'>,
): string {
  const description = template.description?.trim();
  if (description) {
    return description;
  }
  const exercises = template.weekPlan.days.flatMap((day) => day.exercises);
  const sets = exercises.reduce((total, exercise) => total + exercise.sets, 0);
  return `${plural(exercises.length, 'exercise')} · ${plural(sets, 'set')} a week`;
}

const TAG_LABELS: Record<TemplateTag, string> = {
  'full-body': 'Full body',
  upper: 'Upper body',
  lower: 'Lower body',
  hybrid: 'Hybrid',
};

/** A template tag as the list, the filter row and the Filters sheet name it (GT-217). */
export function templateTagLabel(tag: TemplateTag): string {
  return TAG_LABELS[tag];
}

/**
 * A template's tags as its row shows them, under the description (GT-217, canvas «Шаблоны»,
 * `TemplatesRows`): grey pills, `Hybrid` in the accent — the one tag a new user is asked to
 * notice, and the one the Filters sheet explains.
 */
export function templateRowTags(template: Pick<MesoTemplate, 'tags'>): ListRowBadge[] {
  return (template.tags ?? []).map((tag) => ({
    label: templateTagLabel(tag),
    variant: tag === 'hybrid' ? 'accent' : 'neutral',
  }));
}

/** A Days option in the Filters sheet, and its chip in the filter row: `2 days`. */
export function templateDayCountLabel(dayCount: number): string {
  return plural(dayCount, 'day');
}
