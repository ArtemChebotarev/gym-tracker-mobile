// How a template is named on screen — its title, its one-line subtitle, and the list's section
// headers. Shared by the template list (TemplateList.tsx) and the template preview sheet
// (TemplatePreviewSheet.tsx). The list groups templates by days a week, so its rows carry the bare
// name; the sheet stands alone and names the days in its title.

import type { MesoTemplate } from '@domain/plan';
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
