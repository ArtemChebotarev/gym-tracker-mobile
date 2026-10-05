// Pure helpers for TemplateList.tsx — see AGENTS.md, "Code organization".

import type { ListRowBadge } from '@design/components/ListRow';
import type { MesoTemplate } from '@domain/plan';
import { templateDayCount } from '@domain/templateListing';

/** `1 day`, `3 days` — the qualifier after the template's name (08.10, `Full Body · 3 days`). */
export function formatDayCount(template: Pick<MesoTemplate, 'weekPlan'>): string {
  const days = templateDayCount(template);
  return days === 1 ? '1 day' : `${days} days`;
}

/** `Custom` on a user's own template; a catalog one carries no badge (08.10, "Строка"). */
export function templateBadge(template: Pick<MesoTemplate, 'source'>): ListRowBadge | undefined {
  return template.source === 'custom' ? { label: 'Custom' } : undefined;
}
