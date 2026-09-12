import type { MesoTemplate } from '@domain/plan';
import type { TemplateRepository } from '@repositories/template';

import type { InMemoryStore } from './store';

const TEMPLATE_COLLECTION = 'MesoTemplate';

export class InMemoryTemplateRepository implements TemplateRepository {
  constructor(private readonly store: InMemoryStore) {}

  private get templates() {
    return this.store.collection<MesoTemplate>(TEMPLATE_COLLECTION);
  }

  async getAll(): Promise<MesoTemplate[]> {
    return this.templates.list();
  }

  async getById(id: string): Promise<MesoTemplate | null> {
    return (await this.templates.findById(id)) ?? null;
  }

  async create(template: MesoTemplate): Promise<MesoTemplate> {
    return this.templates.insert(template);
  }

  async update(template: MesoTemplate): Promise<MesoTemplate> {
    return this.templates.update(template.id, () => template);
  }

  async deleteById(id: string): Promise<void> {
    await this.templates.delete(id);
  }
}
