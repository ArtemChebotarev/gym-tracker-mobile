import type { MesoTemplate } from '@domain/plan';
import type { Incoming } from '@domain/timestamps';
import type { TemplateRepository } from '@repositories/template';
import { eq } from 'drizzle-orm';

import { NotFoundError } from '../errors';
import { stampCreated, stampUpdated } from '../timestamps';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { rowToTemplate, templateToRow } from './mappers';
import { templates } from './schema';

export class SqliteTemplateRepository implements TemplateRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async getAll(): Promise<MesoTemplate[]> {
    const rows = await runQuery(() => this.db.select().from(templates).all());
    return rows.map(rowToTemplate);
  }

  async getById(id: string): Promise<MesoTemplate | null> {
    const row = await runQuery(() =>
      this.db.select().from(templates).where(eq(templates.id, id)).get(),
    );
    return row ? rowToTemplate(row) : null;
  }

  async create(template: Incoming<MesoTemplate>): Promise<MesoTemplate> {
    const stored = stampCreated(template);
    await runQuery(() => this.db.insert(templates).values(templateToRow(stored)).run());
    return stored;
  }

  async update(template: MesoTemplate): Promise<MesoTemplate> {
    const current = await this.getById(template.id);
    if (!current) {
      throw new NotFoundError(`MesoTemplate with id "${template.id}" was not found.`);
    }
    const next = stampUpdated(current, template);
    await runQuery(() =>
      this.db.update(templates).set(templateToRow(next)).where(eq(templates.id, next.id)).run(),
    );
    return next;
  }

  // Asked before told, rather than reading the driver's affected-row count: that count is the one
  // part of a Drizzle handle whose type differs between expo-sqlite and better-sqlite3, and the
  // whole point of this adapter is that both drivers run the same code (see `SqliteDatabase`).
  async deleteById(id: string): Promise<void> {
    if (!(await this.getById(id))) {
      throw new NotFoundError(`MesoTemplate with id "${id}" was not found.`);
    }
    await runQuery(() => this.db.delete(templates).where(eq(templates.id, id)).run());
  }
}
