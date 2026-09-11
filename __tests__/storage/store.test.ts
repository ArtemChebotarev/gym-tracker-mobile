import { InMemoryStore } from '@storage/store';

type Widget = { id: string; name: string };
type Gadget = { id: string; widgetId: string };

describe('InMemoryStore collections', () => {
  test('the same collection name always returns the same collection instance', () => {
    const store = new InMemoryStore();

    const first = store.collection<Widget>('widgets');
    const second = store.collection<Widget>('widgets');

    expect(first).toBe(second);
  });

  test('different collection names are independent of one another', async () => {
    const store = new InMemoryStore();
    await store.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });

    const gadgets = await store.collection<Gadget>('gadgets').list();

    expect(gadgets).toEqual([]);
  });
});

describe('InMemoryStore transactions', () => {
  test('writes made during a successful transaction are kept', async () => {
    const store = new InMemoryStore();

    const result = await store.transaction(async (tx) => {
      await tx.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });
      await tx.collection<Widget>('widgets').insert({ id: 'w2', name: 'Cog' });
      return 'ok';
    });

    expect(result).toBe('ok');
    const widgets = await store.collection<Widget>('widgets').list();
    expect(widgets.map((widget) => widget.id).sort()).toEqual(['w1', 'w2']);
  });

  test('a transaction that throws rolls back every write it made', async () => {
    const store = new InMemoryStore();
    await store.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });

    await expect(
      store.transaction(async (tx) => {
        await tx.collection<Widget>('widgets').insert({ id: 'w2', name: 'Cog' });
        throw new Error('something went wrong partway through');
      }),
    ).rejects.toThrow('something went wrong partway through');

    const widgets = await store.collection<Widget>('widgets').list();
    expect(widgets).toEqual([{ id: 'w1', name: 'Sprocket' }]);
  });

  test('a rolled-back transaction restores updates and deletes, not just inserts', async () => {
    const store = new InMemoryStore();
    await store.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });
    await store.collection<Widget>('widgets').insert({ id: 'w2', name: 'Cog' });

    await expect(
      store.transaction(async (tx) => {
        await tx.collection<Widget>('widgets').update('w1', (current) => ({
          ...current,
          name: 'Renamed',
        }));
        await tx.collection<Widget>('widgets').delete('w2');
        throw new Error('rollback me');
      }),
    ).rejects.toThrow('rollback me');

    const widgets = await store.collection<Widget>('widgets').list();
    expect(widgets.sort((a, b) => a.id.localeCompare(b.id))).toEqual([
      { id: 'w1', name: 'Sprocket' },
      { id: 'w2', name: 'Cog' },
    ]);
  });

  test('a rolled-back transaction empties a collection that was created during it', async () => {
    const store = new InMemoryStore();

    await expect(
      store.transaction(async (tx) => {
        await tx.collection<Widget>('brand-new').insert({ id: 'w1', name: 'Sprocket' });
        throw new Error('rollback me');
      }),
    ).rejects.toThrow('rollback me');

    const brandNew = await store.collection<Widget>('brand-new').list();
    expect(brandNew).toEqual([]);
  });

  test('a rejected promise returned from the transaction body also triggers a rollback', async () => {
    const store = new InMemoryStore();

    await expect(
      store.transaction(async (tx) => {
        await tx.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });
        return Promise.reject(new Error('async rejection'));
      }),
    ).rejects.toThrow('async rejection');

    const widgets = await store.collection<Widget>('widgets').list();
    expect(widgets).toEqual([]);
  });

  test('a rollback in one collection does not affect writes committed by an earlier, separate transaction', async () => {
    const store = new InMemoryStore();
    await store.transaction(async (tx) => {
      await tx.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });
    });

    await expect(
      store.transaction(async (tx) => {
        await tx.collection<Widget>('widgets').insert({ id: 'w2', name: 'Cog' });
        throw new Error('rollback me');
      }),
    ).rejects.toThrow('rollback me');

    const widgets = await store.collection<Widget>('widgets').list();
    expect(widgets).toEqual([{ id: 'w1', name: 'Sprocket' }]);
  });

  test('writes across multiple collections in one transaction commit together', async () => {
    const store = new InMemoryStore();

    await store.transaction(async (tx) => {
      await tx.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });
      await tx.collection<Gadget>('gadgets').insert({ id: 'g1', widgetId: 'w1' });
    });

    await expect(store.collection<Widget>('widgets').list()).resolves.toEqual([
      { id: 'w1', name: 'Sprocket' },
    ]);
    await expect(store.collection<Gadget>('gadgets').list()).resolves.toEqual([
      { id: 'g1', widgetId: 'w1' },
    ]);
  });

  test('writes across multiple collections in one transaction roll back together', async () => {
    const store = new InMemoryStore();

    await expect(
      store.transaction(async (tx) => {
        await tx.collection<Widget>('widgets').insert({ id: 'w1', name: 'Sprocket' });
        await tx.collection<Gadget>('gadgets').insert({ id: 'g1', widgetId: 'w1' });
        throw new Error('rollback me');
      }),
    ).rejects.toThrow('rollback me');

    await expect(store.collection<Widget>('widgets').list()).resolves.toEqual([]);
    await expect(store.collection<Gadget>('gadgets').list()).resolves.toEqual([]);
  });
});
