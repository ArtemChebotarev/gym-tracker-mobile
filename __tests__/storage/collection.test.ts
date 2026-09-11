import { InMemoryCollection } from '@storage/collection';
import { ConflictError, NotFoundError } from '@storage/errors';

type Widget = { id: string; name: string; tags: string[] };

function newCollection(): InMemoryCollection<Widget> {
  return new InMemoryCollection<Widget>('Widget');
}

describe('InMemoryCollection write and read', () => {
  test('a record inserted can be read back by id', async () => {
    const collection = newCollection();
    const widget: Widget = { id: 'w1', name: 'Sprocket', tags: ['metal'] };

    await collection.insert(widget);

    await expect(collection.getById('w1')).resolves.toEqual(widget);
  });

  test('list returns every inserted record', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });
    await collection.insert({ id: 'w2', name: 'Cog', tags: [] });

    const all = await collection.list();

    expect(all).toHaveLength(2);
    expect(all.map((widget) => widget.id).sort()).toEqual(['w1', 'w2']);
  });

  test('find returns only records matching the predicate', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: ['metal'] });
    await collection.insert({ id: 'w2', name: 'Cog', tags: ['plastic'] });

    const metalOnly = await collection.find((widget) => widget.tags.includes('metal'));

    expect(metalOnly).toEqual([{ id: 'w1', name: 'Sprocket', tags: ['metal'] }]);
  });

  test('listByIds preserves the requested order and skips missing ids', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });
    await collection.insert({ id: 'w2', name: 'Cog', tags: [] });

    const found = await collection.listByIds(['w2', 'missing', 'w1']);

    expect(found.map((widget) => widget.id)).toEqual(['w2', 'w1']);
  });

  test('findById returns undefined for a missing id instead of throwing', async () => {
    const collection = newCollection();

    await expect(collection.findById('missing')).resolves.toBeUndefined();
  });

  test('getById rejects with NotFoundError for a missing id', async () => {
    const collection = newCollection();

    await expect(collection.getById('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  test('inserting a duplicate id rejects with ConflictError and leaves the original intact', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });

    await expect(
      collection.insert({ id: 'w1', name: 'Impostor', tags: [] }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(collection.getById('w1')).resolves.toEqual({
      id: 'w1',
      name: 'Sprocket',
      tags: [],
    });
  });

  test('update replaces a record with the result of the updater', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });

    const updated = await collection.update('w1', (current) => ({
      ...current,
      name: 'Renamed Sprocket',
    }));

    expect(updated).toEqual({ id: 'w1', name: 'Renamed Sprocket', tags: [] });
    await expect(collection.getById('w1')).resolves.toEqual(updated);
  });

  test('update rejects with NotFoundError for a missing id', async () => {
    const collection = newCollection();

    await expect(
      collection.update('missing', (current) => current),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('update rejects with ConflictError if the updater changes the id', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });

    await expect(
      collection.update('w1', (current) => ({ ...current, id: 'w2' })),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(collection.getById('w1')).resolves.toEqual({
      id: 'w1',
      name: 'Sprocket',
      tags: [],
    });
  });

  test('delete removes a record so it can no longer be read', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });

    await collection.delete('w1');

    await expect(collection.getById('w1')).rejects.toBeInstanceOf(NotFoundError);
  });

  test('delete rejects with NotFoundError for a missing id', async () => {
    const collection = newCollection();

    await expect(collection.delete('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('InMemoryCollection does not share references with stored data', () => {
  test('mutating the object passed to insert after the call does not affect the store', async () => {
    const collection = newCollection();
    const widget: Widget = { id: 'w1', name: 'Sprocket', tags: ['metal'] };

    await collection.insert(widget);
    widget.name = 'Mutated after insert';
    widget.tags.push('extra');

    await expect(collection.getById('w1')).resolves.toEqual({
      id: 'w1',
      name: 'Sprocket',
      tags: ['metal'],
    });
  });

  test('mutating a record returned by getById does not affect the store', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: ['metal'] });

    const read = await collection.getById('w1');
    read.name = 'Mutated read';
    read.tags.push('extra');

    await expect(collection.getById('w1')).resolves.toEqual({
      id: 'w1',
      name: 'Sprocket',
      tags: ['metal'],
    });
  });

  test('mutating a record returned by list does not affect the store', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });

    const [first] = await collection.list();
    first!.name = 'Mutated list item';

    await expect(collection.getById('w1')).resolves.toEqual({
      id: 'w1',
      name: 'Sprocket',
      tags: [],
    });
  });

  test('two reads of the same record return independent objects', async () => {
    const collection = newCollection();
    await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });

    const first = await collection.getById('w1');
    const second = await collection.getById('w1');

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  test('the record returned by insert is independent of the stored one', async () => {
    const collection = newCollection();

    const inserted = await collection.insert({ id: 'w1', name: 'Sprocket', tags: [] });
    inserted.name = 'Mutated insert result';

    await expect(collection.getById('w1')).resolves.toEqual({
      id: 'w1',
      name: 'Sprocket',
      tags: [],
    });
  });
});

describe('InMemoryCollection artificial asynchrony', () => {
  test('insert does not resolve within the same tick it is called', async () => {
    const collection = newCollection();
    let resolved = false;

    const pending = collection.insert({ id: 'w1', name: 'Sprocket', tags: [] }).then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);
    await pending;
    expect(resolved).toBe(true);
  });

  test('a synchronous throw inside the operation surfaces as a rejected promise, not a thrown error', () => {
    const collection = newCollection();
    let pending: Promise<Widget> | undefined;

    expect(() => {
      pending = collection.getById('missing');
    }).not.toThrow();

    return expect(pending).rejects.toBeInstanceOf(NotFoundError);
  });
});
