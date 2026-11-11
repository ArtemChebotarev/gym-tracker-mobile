# D-04 · Keep-awake during rest

Priority: P1 · Spec: 05 · Where: Phone (TestFlight — a Debug build always keeps the screen on)

Precondition: during a real workout; the phone's auto-lock set short (e.g. 30 s).

## Steps

1. Log a set and leave the phone untouched while the rest runs.
2. After the rest is over and closed, leave the phone untouched.
3. Start an interval timer and leave the phone untouched.

## Expect

- Step 1: the screen stays on while a rest exists.
- Step 2: the screen locks after the usual auto-lock time.
- Step 3: the screen stays on while the timer runs.
