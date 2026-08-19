---
name: take-task
description: Take or do a task from the Notion "GymTracker — Product Spec" Tasks database — find it, move it through statuses, read the related spec, implement the Definition of Done, and get approval before closing it. Trigger with "take a task", "do task NNN", "work on task ...".
---

# Take a task

Requirements live in Notion, page/database **"GymTracker — Product Spec"**. Its subpages hold the spec sections (Scope, Domain Model, Persistence Layer Contract, Screens & Navigation, etc.). Tasks are tracked in the Notion **Tasks** database (a child database of the same page), numbered 001, 002, ... Statuses: "Not started" → "In progress" → "Done".

Notion access requires a connected Notion MCP server (connected by default in Cowork; in Claude Code, add it via `claude mcp add` — see the Claude Code MCP docs). If it's not connected, tell the user and stop.

## Steps

1. Find the task in the Tasks database by number or name.
2. Move it to "In progress" before starting work.
3. Read the related Product Spec sections if the task references them.
4. Complete the Definition of Done from the task description.
5. After checking the DoD, describe what was done and wait for the user's approval — do not mark the task Done yet.
6. After approval, move the status to Done.
