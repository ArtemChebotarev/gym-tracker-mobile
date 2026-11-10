# D-02 · An ordinary workout on the TestFlight build

Priority: P0 · Spec: 05, 08.7 · Where: Phone (TestFlight)

R-08 on real data: the release build with the real database, without creating any test data.

Precondition: the TestFlight build installed over the previous one; a real workout planned for
today.

## Steps

1. Open the app after the update.
2. Do the workout as usual: log every set, use the rest timer, finish.

## Expect

- Step 1: the app opens on the data from before the update — the same active cycle, week and day,
  and history. No can't-open-your-data error screen.
- Logging, rest, and Finish work as in R-08 and R-09; the summary shows next week's progression.
- Nothing looks different from the previous build except what the release notes promise.
