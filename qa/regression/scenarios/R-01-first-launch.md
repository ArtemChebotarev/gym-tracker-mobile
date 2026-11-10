# R-01 · First launch

Priority: P0 · Spec: 08.11, 08.0.1 · Where: Simulator

Precondition: empty database — the app freshly installed, never opened.

## Steps

1. Open the app.
2. Tap outside the dialog, on the dimmed background.
3. Tap "Got it".
4. Close the app completely and open it again.
5. Tap "Plan cycle".

## Expect

- Step 1: a dialog "Progressive training that adapts to you" over the Workout tab, with three
  rows: "Plan a training cycle", "Find your weight", "We handle progression".
- Step 2: nothing happens; the dialog stays.
- Step 3: the dialog closes onto the Workout tab, which says "Start your first training cycle"
  with a "Plan cycle" button. Closing the dialog does not open cycle creation.
- Step 4: the dialog does not appear again.
- Step 5: the "New cycle" sheet opens (the start of R-03 and R-04). Cancel it.
