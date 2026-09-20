import type { MesoTemplate } from '@domain/plan';
import type { Incoming } from '@domain/timestamps';
import type { TemplateRepository } from '@repositories/template';

import type { InMemoryStore } from './store';
import { stampCreated, stampUpdated } from './timestamps';

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

  async create(template: Incoming<MesoTemplate>): Promise<MesoTemplate> {
    return this.templates.insert(stampCreated(template));
  }

  async update(template: MesoTemplate): Promise<MesoTemplate> {
    return this.templates.update(template.id, (stored) => stampUpdated(stored, template));
  }

  async deleteById(id: string): Promise<void> {
    await this.templates.delete(id);
  }
}
