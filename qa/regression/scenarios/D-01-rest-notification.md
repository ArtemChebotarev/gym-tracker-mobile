# D-01 · Rest notification in the background and on the lock screen

Priority: P0 · Spec: 05, 08 · Where: Phone (TestFlight)

Precondition: during a real workout; rest timer on.

## Steps

1. If notifications are off: Settings tab → "Turn on" in the notifications section → allow in the
   system dialog.
2. Log a set so a rest starts, then go to the home screen.
3. Wait for the rest to run out.
4. Start another rest and lock the phone; wait for it to run out.
5. Open the app.

## Expect

- Step 1: the system permission dialog appears only after "Turn on", never on its own.
- Steps 3 and 4: a "Rest is over" notification arrives, on the home screen and on the lock screen.
- Step 5: the notification is gone from the notification list, without a sound on opening.
