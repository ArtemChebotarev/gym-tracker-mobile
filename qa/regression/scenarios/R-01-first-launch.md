# R-01 · First launch

Priority: P0 · Spec: 08.11, 08.0.1 · Where: Simulator

Precondition: empty database — the app freshly installed, never opened.

## Steps

1. Open the app and wait for the welcome dialog (it appears a second or two after launch).
2. Tap the dimmed background above the dialog, just below the screen header — not near the
   bottom, where the dimmed "Plan cycle" button and the tab bar are.
3. Tap "Got it".
4. Close the app completely (app switcher, swipe it away; simulator:
   `xcrun simctl terminate booted com.artemchebotarov.hybro`) and open it again.
5. Tap "Plan cycle".
6. Tap "Cancel".

## Expect

- Step 1: a welcome dialog over the Workout tab: the logo, a close ×, three rows (plan a cycle,
  find your weight, progression is handled), and a "Got it" button.
- Step 2: nothing happens; the dialog stays.
- Step 3: the dialog closes onto the Workout tab's empty state for a first cycle, with a "Plan
  cycle" button. Cycle creation does not open by itself.
- Step 4: the dialog does not appear again.
- Step 5: the new-cycle sheet opens with three methods — from template (selected), from scratch,
  and copy a cycle, which is disabled with a reason (nothing finished yet) — and "Cancel" / "Next".
- Step 6: back on the empty Workout tab.
