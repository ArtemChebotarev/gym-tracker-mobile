// Template listing — what the template list shows and in what order (08.10 · Редактор мезоцикла —
// Flow B, "Шаг T"). Kept separate from `domain/plan.ts` (types only) per the single-responsibility
// rule in AGENTS.md; the exercise library's counterpart is `domain/catalogListing.ts`.

import { nameMatchesSearch } from './names';
import type { MesoTemplate } from './plan';

/** How many training days a template's week has — the `· 3 days` on its row. */
export function templateDayCount(template: Pick<MesoTemplate, 'weekPlan'>): number {
  return template.weekPlan.days.length;
}

/**
 * The templates the list shows for `search`: hidden ones never, the rest matched by name
 * (`nameMatchesSearch`). Fewest days first, then by name — a new user picks a split by how often
 * they can train, and the day count is what the rows lead with after the name.
 */
export function listTemplates(
  templates: readonly MesoTemplate[],
  search: string = '',
): MesoTemplate[] {
  return templates
    .filter((template) => !template.isHidden && nameMatchesSearch(template.name, search))
    .sort((a, b) => templateDayCount(a) - templateDayCount(b) || a.name.localeCompare(b.name));
}
