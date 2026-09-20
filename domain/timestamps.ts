/**
 * The record-keeping stamps every stored entity carries — see 07 · Persistence Layer Contract,
 * "Подготовка к backend": "`createdAt` / `updatedAt` на каждой записи — основа для last-write-wins
 * или любой другой стратегии".
 *
 * They are written by the storage adapter, not by the domain (unlike ids, which the domain
 * generates before saving — rule 3). An id has to exist before a record is stored because the
 * domain refers to entities by it; a stamp only answers "when was this row last written", which
 * is something only the writer knows. Keeping that with the adapter is also what makes the
 * backend migration boring: an HTTP adapter hands the question to the server, and every call
 * site stays as it is.
 */
export type Timestamps = {
  /** When the record was first stored. Never changes afterwards. */
  createdAt: string;
  /** When the record was last written. Equal to `createdAt` until the first update. */
  updatedAt: string;
};

/**
 * An entity on its way into storage, before it has any stamps: what a repository's `create`
 * takes, and what the domain builds. The stored entity comes back from `create` complete.
 */
export type Unsaved<T extends Timestamps> = Omit<T, keyof Timestamps>;

/**
 * What a repository's `create` accepts: an entity without stamps, or one that brings its own.
 *
 * Bringing them is for restoring records that already existed — importing a backup (task 070)
 * has to put back the stamps the records were written with, not the moment of the import, or
 * every restore would rewrite the history it is restoring. Ordinary callers leave them out and
 * the adapter stamps.
 */
export type Incoming<T extends Timestamps> = Unsaved<T> & Partial<Timestamps>;
