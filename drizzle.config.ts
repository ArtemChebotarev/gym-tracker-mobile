import { defineConfig } from 'drizzle-kit';

// Generates the SQL for `storage/sqlite/schema.ts` into `drizzle/`. The generated files are the
// only source of DDL: nothing hand-writes CREATE TABLE, so the schema and the database cannot
// drift. Running them at app start, with a version to compare against, is task 069.
export default defineConfig({
  schema: './storage/sqlite/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
});
