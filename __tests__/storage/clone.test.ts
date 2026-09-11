import { deepClone } from '@storage/clone';

describe('deepClone', () => {
  test('returns primitives unchanged', () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBeNull();
    expect(deepClone(undefined)).toBeUndefined();
  });

  test('produces a deeply equal but distinct object', () => {
    const original = { id: '1', tags: ['a', 'b'], target: { setNumber: 1 } };

    const clone = deepClone(original);

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.tags).not.toBe(original.tags);
    expect(clone.target).not.toBe(original.target);
  });

  test('mutating the clone does not affect the original', () => {
    const original = { id: '1', tags: ['a', 'b'] };

    const clone = deepClone(original);
    clone.tags.push('c');
    clone.id = 'mutated';

    expect(original).toEqual({ id: '1', tags: ['a', 'b'] });
  });

  test('mutating the original after cloning does not affect the clone', () => {
    const original = { id: '1', tags: ['a', 'b'] };

    const clone = deepClone(original);
    original.tags.push('c');
    original.id = 'mutated';

    expect(clone).toEqual({ id: '1', tags: ['a', 'b'] });
  });

  test('clones arrays element by element, preserving nested distinctness', () => {
    const original = [{ id: '1' }, { id: '2' }];

    const clone = deepClone(original);

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone[0]).not.toBe(original[0]);
  });

  test('clones a Date into a new Date instance with the same instant', () => {
    const original = new Date('2026-01-15T12:30:45.678Z');

    const clone = deepClone(original);

    expect(clone).not.toBe(original);
    expect(clone.getTime()).toBe(original.getTime());
  });

  test('leaves optional fields absent rather than introducing them', () => {
    const original: { id: string; note?: string } = { id: '1' };

    const clone = deepClone(original);

    expect('note' in clone).toBe(false);
  });
});
