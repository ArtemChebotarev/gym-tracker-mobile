# R-01 · First launch

Priority: P0 · Spec: 08.11, 08.0.1 · Where: Simulator

Precondition: empty database — the app freshly installed, never opened.

## Steps

1. Open the app and wait for the dialog (it appears a second or two after launch).
2. Tap the dimmed background above the dialog, just below the "Workout" header — not near the
   bottom, where the dimmed "Plan cycle" button and the tab bar are.
3. Tap "Got it".
4. Close the app completely (app switcher, swipe it away; simulator:
   `xcrun simctl terminate booted com.artemchebotarov.hybro`) and open it again.
5. Tap "Plan cycle".
6. Tap "Cancel".

## Expect

- Step 1: a dialog with the Hybro logo and an × in the corner, titled "Progressive training that
  adapts to you", with three rows:
  - "Plan a training cycle" — "Pick your days and exercises."
  - "Find your weight" — "Choose a load you can handle with a few reps in reserve."
  - "We handle progression" — "Each workout sets your targets for the next one."
  - and a "Got it" button.
- Step 2: nothing happens; the dialog stays.
- Step 3: the dialog fades out onto the Workout tab: "Start your first training cycle" — "Plan one
  and its workouts will show up here." — with a "Plan cycle" button. Cycle creation does not open.
- Step 4: the dialog does not appear again.
- Step 5: a sheet "New cycle" — "How do you want to start?" — with "From template" selected, "From
  scratch", and "Copy a cycle" greyed out with "Nothing to copy yet — finish a training cycle
  first"; buttons "Cancel" and "Next".
- Step 6: back on the empty Workout tab.
