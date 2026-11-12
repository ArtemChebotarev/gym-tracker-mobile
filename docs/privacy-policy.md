<!--
DRAFT for GT-244 — placeholders below are filled in before the PR leaves draft.
Before publishing, fill in every [[...]] placeholder:
  [[DATE]]       — the day the policy goes live
IP discard checked 2026-11-12: EU org default is on and events carry no $ip — section 3 relies on it.
Retention "1 year" is the PostHog Free plan (fixed). A paid plan keeps events 3 / 5 / 7 years
(Boost / Scale / Enterprise) unless lowered in project settings — update section 3 on upgrade.
Source of truth for what is collected: state/README.md → "Telemetry" → "What is collected".
Any new event or property means updating this page AND the App Store privacy labels.
-->

# Hyperbro — Privacy Policy

_Last updated: [[DATE]]_

Hyperbro is a workout tracker made by Artem Chebotarov, an individual developer. This policy explains
what happens to your data when you use the app. The short version:

- **Your workouts stay on your phone.** There is no account, no sign-in and no server that holds
  your training data.
- **The app sends a few anonymous usage events** so I can see whether people actually train with it
  and come back. They contain no names, weights, notes or anything you type, and they are not
  linked to you.
- **No ads, no tracking, nothing is sold.**

## 1. Who is responsible

Artem Chebotarov is the controller of the data described here. Contact: [artemchebotarov@gmail.com](mailto:artemchebotarov@gmail.com).

## 2. Data stored on your device

Everything you create in Hyperbro — training cycles and templates, workouts, sets, weights, reps,
body weight if you enter it, your own exercises and settings — is stored in a database inside the app on your device. It is not sent to
me or to anyone else, and I cannot see it.

Because there is no backup or sync yet, **deleting the app deletes this data permanently.** If you
export a backup or diagnostic logs from the app, the file goes only where you choose to share it
through the system share sheet.

Rest-timer alerts are local notifications scheduled on your device. No push service is involved.

## 3. Anonymous usage analytics

To understand whether the app is useful, Hyperbro sends a small number of events to
[PostHog](https://posthog.com), an analytics service, hosted in the European Union.

**Events sent:**

| Event | When | Extra information |
|---|---|---|
| App opened | The app starts or returns from the background | — |
| Cycle created | You save a new training cycle | How it was built: from scratch, from a template, or by copying a week |
| Workout completed | You finish a workout day with work logged in it | Its type: strength or hybrid |

**Sent with each event** (added automatically by the analytics SDK): app version and build, operating
system and its version, device manufacturer and model, screen size, language and region setting,
time zone.

**Identifier:** a random ID created on your device when the app first runs. It is not your Apple ID,
email, name or advertising identifier (IDFA), and it is never linked to any of them. Reinstalling
the app creates a new ID.

**Never sent:** your workouts, weights, reps, exercise or template names or anything else you
type; your location; screen views or taps; screen recordings; crash reports; contacts, photos,
health data or microphone.

**IP address:** like any internet request, the analytics request reaches PostHog's servers with your
device's IP address. PostHog is configured not to store it and not to derive a location from it.

**Why (legal basis):** my legitimate interest in understanding whether the app works for the people
using it, so I can improve it (Art. 6(1)(f) GDPR). The data is minimal and anonymous by design.

**How long:** events are kept for up to 1 year, after which PostHog deletes them.

**Who processes it:** PostHog Inc. acts as a processor on my behalf, with servers in the EU. It does
not use this data for its own purposes. Analytics data is not shared with anyone else, not sold and
not used for advertising.

## 4. Links to other services

The exercise screen has a link that opens a YouTube search for the exercise's technique. Tapping it
sends the exercise name to YouTube as the search query — including the name of a custom exercise
you created. From then on YouTube's (Google's) privacy policy applies. Nothing is sent until you tap
the link.

## 5. Your rights

Under the GDPR you have the right to access, correct, delete or object to the processing of your
personal data, and to complain to a data protection authority.

- **Your workout data** is on your device only; you control it fully and can delete it by deleting
  the app.
- **Analytics data** is anonymous: I have no way to tell which events came from you, so I cannot
  look them up. Deleting or reinstalling the app ends the link between your device and any
  previously sent events. If you have a question or request anyway, write to [artemchebotarov@gmail.com](mailto:artemchebotarov@gmail.com).

## 6. Children

Hyperbro is not directed at children under 16 and does not knowingly collect data from them.

## 7. Health notice

Hyperbro is a training log and planning tool, not a medical device, and it does not give medical
advice. Its suggested weights, reps and rest times are calculated from what you logged and may not
suit your health, fitness level or injuries. Consult a doctor before starting or changing an
exercise programme, especially if you have a medical condition, an injury or are pregnant. Stop
exercising and seek medical help if you feel pain, dizziness or shortness of breath. You train at
your own risk.

## 8. Changes

If what the app collects changes, this page will be updated before the new version is released, and
the date at the top will change.

## 9. Contact

Questions about this policy or your data: [artemchebotarov@gmail.com](mailto:artemchebotarov@gmail.com).
