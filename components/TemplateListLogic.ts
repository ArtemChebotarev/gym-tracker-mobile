// Pure helpers for TemplateList.tsx — see AGENTS.md, "Code organization". The row's title and
// subtitle are in templateLabels.ts, shared with the preview sheet.

import type { ListRowBadge } from '@design/components/ListRow';
import type { MesoTemplate } from '@domain/plan';

/** `Custom` on a user's own template; a catalog one carries no badge (08.10, "Строка"). */
export function templateBadge(template: Pick<MesoTemplate, 'source'>): ListRowBadge | undefined {
  return template.source === 'custom' ? { label: 'Custom' } : undefined;
}
