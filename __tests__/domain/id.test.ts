import { generateId } from '@domain/id';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mockRandomUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

// expo-crypto wraps a native module that isn't available under Jest (the auto-generated
// mock jest-expo ships for it is an empty stub). Substitute a plain RFC4122 v4 generator
// so we can test our wrapper's contract without depending on the native implementation.
jest.mock('expo-crypto', () => ({
  randomUUID: () => mockRandomUuidV4(),
}));

describe('generateId', () => {
  test('returns a valid v4 UUID', () => {
    expect(generateId()).toMatch(UUID_V4_PATTERN);
  });

  test('generates unique ids across many calls', () => {
    const ids = Array.from({ length: 10000 }, () => generateId());
    expect(new Set(ids).size).toBe(ids.length);
  });
});
