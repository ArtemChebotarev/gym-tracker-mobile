# D-03 · In-app sound and vibration follow Settings

Priority: P1 · Spec: 08 · Where: Phone (TestFlight)

Precondition: during a real workout, the app on screen, the phone not in silent mode.

## Steps

1. Settings → in-app signals: sound on, vibration on. Let a rest run out with the app open.
2. Turn sound off; let a rest run out.
3. Turn vibration off as well; let a rest run out.
4. Turn both back on.

## Expect

- Step 1: a sound and a vibration at the end of rest.
- Step 2: vibration only.
- Step 3: neither; the rest-over banner still appears.
