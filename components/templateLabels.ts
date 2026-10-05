// How a template is named on screen — its title and one-line subtitle. Shared by the template list
// (TemplateList.tsx) and the template preview sheet (TemplatePreviewSheet.tsx), which head a
// template the same way (08.10: the sheet's title and the line under it repeat the row's).

import type { MesoTemplate } from '@domain/plan';
import { templateDayCount } from '@domain/templateListing';

function plural(count: number, noun: string): string {
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`;
}

/**
 * The row's title, `Full Body · 3 days` — one line in one color, as 08.10's mockup draws it. The
 * day count isn't part of the template's name; the list appends it from the week plan.
 */
export function formatTemplateTitle(template: Pick<MesoTemplate, 'name' | 'weekPlan'>): string {
  return `${template.name} · ${plural(templateDayCount(template), 'day')}`;
}

/**
 * The row's subtitle. Every row has one, so rows keep the mockup's two-line height (08.10, "Строка").
 * It will be the template's own description once GT-5 adds `MesoTemplate.description`, with this
 * summary of the week — `20 exercises · 68 sets a week` — as the fallback for a template that has none.
 */
export function formatTemplateSubtitle(template: Pick<MesoTemplate, 'weekPlan'>): string {
  const exercises = template.weekPlan.days.flatMap((day) => day.exercises);
  const sets = exercises.reduce((total, exercise) => total + exercise.sets, 0);
  return `${plural(exercises.length, 'exercise')} · ${plural(sets, 'set')} a week`;
}
