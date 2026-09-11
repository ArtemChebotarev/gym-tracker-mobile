// Deep clone used at every store boundary — see 07 · Persistence Layer Contract, DoD for
// task 022: callers must never be able to mutate stored state through a returned object
// (or leak their own mutations into the store by holding onto the object they inserted).
//
// A structural recursive clone rather than `structuredClone` or a JSON round-trip: it
// needs to run the same way on Hermes (the app) and Node (Jest), and domain records are
// plain data (strings, numbers, booleans, arrays, nested objects, optional fields) — no
// functions, class instances, Map/Set, or circular references to worry about.
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as unknown as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  const clone = {} as T;
  for (const key of Object.keys(value) as (keyof T)[]) {
    clone[key] = deepClone(value[key]);
  }
  return clone;
}
