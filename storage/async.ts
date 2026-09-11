// Artificial asynchrony — see 07 · Persistence Layer Contract, "Hard rules", rule 1:
// "All operations are asynchronous, even if the current storage is synchronous. Otherwise
// swapping in a network adapter later would break every call site." The in-memory engine
// does its actual work synchronously; this is the one seam where that fact is hidden from
// callers, so code written against it keeps working unchanged once a real (slow, fallible)
// adapter replaces it.
//
// Deferring through a microtask (rather than resolving immediately) is what makes the
// asynchrony real and not just a type: the result is never observable in the same tick as
// the call, exactly as with a genuinely async adapter.
export function runAsync<T>(operation: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queueMicrotask(() => {
      try {
        resolve(operation());
      } catch (error) {
        reject(error);
      }
    });
  });
}
