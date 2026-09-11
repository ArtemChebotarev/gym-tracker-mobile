import type { TransactionalStore } from '@repositories/transaction';
import { InMemoryStore } from '@storage/store';

type Widget = { id: string; name: string };

// Exercises `InMemoryStore` only through the `TransactionalStore` contract (task 021), not
// through the concrete class, to prove the interface itself is enough for a caller to get
// an atomic batch of writes — this is what a use case or a future non-in-memory adapter
// would depend on.
async function runAsBatch<T>(
  store: TransactionalStore<InMemoryStore>,
  work: (store: InMemoryStore) => Promise<T> | T,
): Promise<T> {
  return store.transaction(work);
}

describe('TransactionalStore contract', () => {
  test('an InMemoryStore satisfies the TransactionalStore<InMemoryStore> interface', () => {
    const store = new InMemoryStore();
    const asContract: TransactionalStore<InMemoryStore> = store;

    expect(typeof asContract.transaction).toBe('function');
  });

  test('a batch that completes keeps every write it made', async () => {
    const store = new InMemoryStore();

    await runAsBatch(store, async (tx) => {
      await tx.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });
      await tx.collection<Widget>('widgets').insert({ id: 'w2', name: 'Cog' });
    });

    const widgets = await store.collection<Widget>('widgets').list();
    expect(widgets.map((widget) => widget.id).sort()).toEqual(['w1', 'w2']);
  });

  test('DoD: a failure partway through a batch leaves no partially-written data', async () => {
    const store = new InMemoryStore();
    await store.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });

    await expect(
      runAsBatch(store, async (tx) => {
        await tx.collection<Widget>('widgets').insert({ id: 'w2', name: 'Cog' });
        await tx.collection<Widget>('widgets').insert({ id: 'w3', name: 'Gear' });
        throw new Error('failure partway through the batch');
      }),
    ).rejects.toThrow('failure partway through the batch');

    // Only the pre-existing record survives — w2 and w3 must not be observable at all,
    // not even partially (e.g. w2 committed but not w3).
    const widgets = await store.collection<Widget>('widgets').list();
    expect(widgets).toEqual([{ id: 'w1', name: 'Sprocket' }]);
  });
});
