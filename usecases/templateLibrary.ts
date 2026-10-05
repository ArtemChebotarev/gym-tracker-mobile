// Template list use case — Flow B's step T (08.10 · Редактор мезоцикла — Flow B, "Шаг T"; GT-6).
// Reads every template; which of them the list shows, and in what order, is the domain's
// (`listTemplates` in domain/templateListing.ts), applied by the list itself.

import type { MesoTemplate } from '@domain/plan';
import type { TemplateRepository } from '@repositories/template';

export type TemplateLibraryDeps = {
  templateRepo: TemplateRepository;
};

/** Every template, hidden ones included — the list leaves those out itself. */
export async function listAllTemplates(deps: TemplateLibraryDeps): Promise<MesoTemplate[]> {
  return deps.templateRepo.getAll();
}
