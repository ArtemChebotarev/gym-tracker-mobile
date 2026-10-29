---
name: take-task
description: Take or do a task from the Notion "Backlog" database (inside "GymTracker — Product Spec") — find it by Key, move it through statuses, read the related spec, implement the Definition of Done, and get approval before closing it. Trigger with "take a task", "do task NNN", "work on task ...".
---

# Take a task

Requirements live in Notion, page **"GymTracker — Product Spec"**. Its subpages hold the spec sections (Scope, Domain Model, Persistence Layer Contract, Screens & Navigation, etc.).

Tasks are taken **only from the Notion Backlog database** (a child database of the same page, <https://app.notion.com/p/78932a42389c4b2e83bf94a9adb8ee7b>, data source `collection://15ab83b9-2d51-4399-badc-c6c76a1c7db1`). The old "Tasks" database is no longer a source. A task's number is the **`Key`** property (auto-increment id); "task 5" means the row with `Key = 5`. Relevant properties: `Name`, `Key`, `Type` (Epic / Story / Task / Spike / Bug), `Status`, `Parent` / `Sub-items` (story → tasks), `Rank`. Statuses: "Not started" → "In progress" → "Done". `Completed` is set by an automation on Done — don't fill it by hand.

Notion access requires a connected Notion MCP server (connected by default in Cowork; in Claude Code, add it via `claude mcp add` — see the Claude Code MCP docs). If it's not connected, tell the user and stop.

## Steps

1. `git fetch origin` and sync local `main` with `origin/main` (fast-forward pull, or rebase/merge into your branch) before touching any files — `main` is protected and moves between sessions, so a stale base causes avoidable conflicts and rediscovering already-fixed bugs.
2. Find the task in the Backlog database by `Key` (or by name). If the user gave no number, take the next "Not started" Task/Bug/Spike by `Rank` (within its story's order) and confirm the choice. A Story is a container: work on its sub-items, not the story itself, unless asked.
3. Move it to "In progress" before starting work.
4. Read the related Product Spec sections if the task references them.
5. Complete the Definition of Done from the task description.
6. Invoke the `commit-and-push` skill to verify, commit, push the branch, and open a PR against `main` (use a `task/<Key>-<short-name>` branch name).
7. Share the PR link with the user, describe what was done and how it satisfies the DoD, and wait for their review/approval — do not mark the task Done yet.
8. After approval, move the status to Done.
