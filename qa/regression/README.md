# Regression scenarios

The release regression for GymTracker: what is checked before a release, and how. It is meant to
be run three ways from the same text — by hand on a phone, by an agent driving the iOS simulator,
and later by Maestro (story GT-249 turns these files into `.maestro/` flows).

## Three sources, three questions

| Source | Answers | Lives in |
|---|---|---|
| Product Spec | how it *should* behave, and why | Notion |
| Code | how it *does* behave | this repo |
| These scenarios | *what we check*, and how to get there | `qa/regression/` |

A scenario does not restate the spec's rules. It holds steps and observable results, and points at
the spec section with `Spec:`. The less product logic a scenario carries, the less it can drift.

Keeping them in sync:

- A PR that changes visible behaviour updates the scenarios it touches, in the same PR. Find them
  by the `Spec:` field: change 08.7, look at every scenario that cites 08.7.
- A failed step is one of three things: a bug in the code, a stale scenario, or a stale spec.
  Decide which and fix that one. Bugs become Backlog tasks; they are not fixed during the run.

## Scenario format

One file per scenario in [`scenarios/`](scenarios/), named `R-NN-short-name.md` (simulator) or
`D-NN-short-name.md` (phone only).

```markdown
# R-NN · Title

Priority: P0 | P1 · Spec: 08.7, 05 · Where: Simulator | Phone

Precondition: the state the scenario starts from — a named step of the chain below, or
"empty database".

## Steps

1. Action on something visible: tap "Label", type 60 into the weight field of set 1.
2. …

## Expect

- What is visible afterwards, stated so it can be checked without judgement.

## Manual only

- What the simulator can't show (sound, vibration, notifications, lock screen). Omit if none.
```

Rules for steps:

- **Act on what is on screen.** Use the visible label in quotes ("Start workout"). Where a label is
  ambiguous, name the element by its place ("the ⋯ in the header", "the weight field of set 2").
  These map one to one to Maestro's `tapOn` / `inputText` / `assertVisible` later.
- **A precondition is a state, not a list of steps.** Every scenario names the state it starts
  from, so it can be run on its own once named seed states exist (GT-251). Until then the chain
  below produces those states by hand.
- **Expectations are observable.** "Set 1 shows ✓", not "the set is saved correctly".
- **Check behaviour, not copy.** Wording changes often and cheaply — after feedback, or on a second
  thought — and a scenario that quotes it fails without anything being broken. So:
  - titles, descriptions, hints and dialog texts are described by what they are and where they
    appear ("a one-time dialog introduces the deload week", "a hint under the button says why"),
    never quoted;
  - a button that a step taps is named by its short label ("Finish workout") — the only way a
    person finds it. Maestro will find it by `testID` instead (GT-252). A renamed button fails a
    scenario loudly at that step and is fixed in the same PR as the rename;
  - values computed by the app are checked exactly, because they are the behaviour: reps +1, a
    rest of 0:15 after 0:20, half the weight on deload, 2 of 2 workouts, Week 2 Day 1;
  - states are checked exactly: disabled, ✓ logged, read-only, planned / active / completed.

## Priorities

- **P0** — a broken P0 blocks the release. The short smoke set, and later what the `e2e` PR label
  runs.
- **P1** — the rest of the coverage. Run in full before a release, together with P0.

## Where each scenario runs

- **Simulator, Release build** — everything that writes data. Release, not Debug, because the
  TestFlight build is Release and some behaviour differs (keep-awake: Debug holds the screen on
  regardless).
- **Phone, TestFlight build** — only what the simulator can't show and what doesn't write test data
  into the real training history: notifications, lock screen, sound, vibration, keep-awake, an
  ordinary workout, and an export. The database on the phone is the only copy of real training
  data, so no test cycles are created there.

## Before a run

- Simulator: switch its keyboard to English, or typed text comes out in another layout. Tap
  steppers slowly — quick repeated taps register once. Let sheets (the ⊞ week grid) settle before
  tapping into them.
- A first run on an empty database shows every one-time hint: on the first planned cycle in
  Cycles, the three-step tour on the first workout, the rest hint after the first log, the
  weight-ranges hint in week 2, the deload dialog in the last week. They are R-01 / R-02
  material; elsewhere close them and go on. Each swallows the tap that closes it.
- The rest bar and the rest-over banner sit over the bottom of the workout list. Close them with
  × when they cover a button.
- After a log the list can shift for a second or two. Look again before the next tap — a tap
  that lands late hits the row that moved under it.
- The prefilled reps target is grey like a placeholder, but tapping Log logs it as-is.
- The first tap after a menu or dropdown closes is often lost, and the next one lands. Mind the
  header ⋯ of a workout: "Stop cycle" is in it (its confirmation asks to type END CYCLE, so a
  stray tap can't stop the cycle by itself).

## Run order (the chain)

Scenarios are independent by their preconditions, but the states they need are produced by
earlier steps: only one cycle can be active, Copy needs a finished cycle, deload is the last week,
onboarding needs an empty database. Run by hand, this order makes each step's end state the next
one's precondition.

Cycle **A** is created from the "Upper / Lower + Boxing Hybrid" template cut to 2 days a week and
4 weeks: Day 1 is strength (with weighted and plain bodyweight), Day 2 adds power, an interval
(heavy bag) and mobility (cooldown). That puts every exercise type into the chain.

| Step | State | Scenarios |
|---|---|---|
| 1 | Empty database | R-01, R-02 |
| 2 | Cycle A planned → active | R-03, R-07 |
| 3 | A, week 1 | R-08 – R-19 |
| 4 | A active, a second cycle B planned | R-04, R-07 (second Start blocked), R-06 |
| 5 | A, weeks 2 – 4 | R-20, R-21, R-22 |
| 6 | A completed | R-25, R-26 |
| 7 | Cycle C copied from A | R-05, R-23 |
| 8 | A and C in Completed | R-24 |
| 9 | Any | R-27 – R-30 |
| 10 | Last (an import replaces the database) | R-31, R-32 |

Phone scenarios D-01 – D-05 run separately, on real workouts with the TestFlight build.

## Scenario index

| ID | Scenario | P | Spec | Where |
|---|---|---|---|---|
| [R-01](scenarios/R-01-first-launch.md) | First launch: Welcome → empty Workout → Plan cycle | P0 | 08.11, 08.0.1 | Sim |
| [R-02](scenarios/R-02-first-workout-hints.md) | First-workout tour: steps, Skip, not shown again after relaunch | P1 | 08.11 | Sim |
| [R-03](scenarios/R-03-cycle-from-template.md) | Flow B: cycle from a template | P0 | 08.10 | Sim |
| [R-04](scenarios/R-04-cycle-from-scratch.md) | Flow A: cycle from scratch | P0 | 08.5 | Sim |
| [R-05](scenarios/R-05-copy-cycle.md) | Flow C: copy a week of a finished cycle, targets from history | P0 | 08.8, 04 | Sim |
| [R-06](scenarios/R-06-planned-cycle.md) | Planned cycle: discard draft, edit, delete | P1 | 08.5, 08.3 | Sim |
| [R-07](scenarios/R-07-start-cycle.md) | Start a cycle; a second Start is blocked while one is active | P0 | 08.3 | Sim |
| [R-08](scenarios/R-08-log-strength-workout.md) | Log a strength workout and finish it | P0 | 05, 08.7 | Sim |
| [R-09](scenarios/R-09-rest-timer.md) | Rest timer in the app | P0 | 05, 08 | Sim |
| [R-10](scenarios/R-10-one-workout-in-progress.md) | Only one workout in progress | P1 | 05 | Sim |
| [R-11](scenarios/R-11-exercise-menu.md) | Exercise ⋯ menu: replace, sets, move, skip, delete | P1 | 08.7 | Sim |
| [R-12](scenarios/R-12-header-menu.md) | Header ⋯ menu: add exercise, skip workout, rename, history | P1 | 08.7 | Sim |
| [R-13](scenarios/R-13-weight-swap.md) | Weight swap: reps recalculated, ⓘ, estimates, out of range | P1 | 08.7.1 | Sim |
| [R-14](scenarios/R-14-bodyweight.md) | Bodyweight: body weight once per cycle, added weight | P1 | 05 | Sim |
| [R-15](scenarios/R-15-power.md) | Power exercise | P1 | 08.7 | Sim |
| [R-16](scenarios/R-16-interval-timer.md) | Interval timer: phases, minimize, end early, summary, manual log | P1 | 05, 08 | Sim |
| [R-17](scenarios/R-17-mobility.md) | Mobility block | P1 | 08.7 | Sim |
| [R-18](scenarios/R-18-kill-mid-workout.md) | Kill the app mid-workout, state restored | P0 | 05 | Sim |
| [R-19](scenarios/R-19-grid-and-preview.md) | Week grid and preview of a future day | P1 | 08.7 | Sim |
| [R-20](scenarios/R-20-week-progression.md) | Week 1 → 2: reps +1, structure carries, RIR by week | P0 | 03 | Sim |
| [R-21](scenarios/R-21-deload.md) | Deload week | P0 | 03, 08.11 | Sim |
| [R-22](scenarios/R-22-finish-cycle.md) | Last workout → Finish cycle → Completed | P0 | 04, 08.3 | Sim |
| [R-23](scenarios/R-23-stop-cycle.md) | Stop a cycle | P1 | 08.3 | Sim |
| [R-24](scenarios/R-24-completed-archive-copy.md) | Completed: archive and copy | P1 | 08.3 | Sim |
| [R-25](scenarios/R-25-cycle-detail.md) | Cycle detail: stats, volume, grid → history mode | P1 | 08.9 | Sim |
| [R-26](scenarios/R-26-exercise-history.md) | Exercise history across cycles | P1 | 08.6 | Sim |
| [R-27](scenarios/R-27-library-search-filters.md) | Library: search, filters, create from search | P1 | 08.6 | Sim |
| [R-28](scenarios/R-28-custom-exercise.md) | Custom exercise: create, edit, hide | P1 | 08.6 | Sim |
| [R-29](scenarios/R-29-exercise-overview.md) | Exercise overview, "Watch how to perform" | P1 | 08.6 | Sim |
| [R-30](scenarios/R-30-timer-settings.md) | Timer settings take effect | P1 | 08 | Sim |
| [R-31](scenarios/R-31-export-import.md) | Export on the phone → import on the simulator | P0 | 08 | Phone + Sim |
| [R-32](scenarios/R-32-import-refusals.md) | Import: cancel changes nothing, a wrong file is refused | P1 | 08 | Sim |
| [D-01](scenarios/D-01-rest-notification.md) | Rest notification in the background and on the lock screen | P0 | 05, 08 | Phone |
| [D-02](scenarios/D-02-real-workout.md) | An ordinary workout on the TestFlight build | P0 | 05, 08.7 | Phone |
| [D-03](scenarios/D-03-sound-vibration.md) | In-app sound and vibration follow Settings | P1 | 08 | Phone |
| [D-04](scenarios/D-04-keep-awake.md) | Keep-awake during rest | P1 | 05 | Phone |
| [D-05](scenarios/D-05-interval-background.md) | Interval timer in the background: ticks in silent mode, mixes with music | P1 | 05 | Phone |

Not covered on purpose: error states that can't be produced by hand (they are covered by unit
tests), and what the spec defers past 1.0.
