---
name: opusimplement
description: Direct implementation with Claude Opus 4.6 (default). Use this skill whenever the user types /opusimplement or asks to "opusimplement" a task. Triggers on any message containing /opusimplement followed by a task description. The skill skips plan mode, follows the same session workflow and memory checks as opusplan, researches the codebase as needed, executes focused implementation steps with Opus subagents, and validates the result before updating memory. Default model is Opus 4.6 (claude-opus-4-6); use Opus 4.7 (claude-opus-4-7) only when the user explicitly requests it.
license: MIT
metadata:
  author: swiftflitz-team
---

# OpusImplement Skill

One-phase workflow: **Opus researches, then implements immediately.**

## When This Skill Is Active

User typed `/opusimplement <task>`. Run the full workflow below from start to finish.

---

## Skill Routing Check (do this first, before anything else)

Read the task. Route to a more appropriate skill when the task clearly fits one of these cases:

| Task nature | Action |
|---|---|
| Requirements are fuzzy, incomplete, or just "build X" with no spec | Run `/to-prd` first. Don't implement against a vague spec. |
| Task is purely about writing or fixing tests, or user says "TDD this" | Delegate to `tdd` skill instead. |
| Task is primarily a refactor or architecture improvement | Invoke `improve-codebase-architecture` skill first, then come back to implement the identified changes. |
| Task requires creating a new Claude skill | Invoke `write-a-skill` skill. |
| Task is a normal feature, bug fix, or mixed build | Continue below. |

Only proceed below after this check.

---

## Model Selection

**Default: Opus 4.6** (`claude-opus-4-6`). Only use Opus 4.7 (`claude-opus-4-7`) when the user explicitly requests it (e.g. `/opusimplement --opus47 ...`).

The Agent tool accepts `model: "opus"` shorthand. Include `"Preferred model: claude-opus-4-6"` in every subagent prompt so the intent is traceable when tool gains version-specific IDs.

---

## Before You Start — Session Workflow Checks

1. **Invoke `/session-workflow` first** and follow it.
2. **Read `./MEMORY.md`** — check current todos and session state.
3. **Add current-task todos now** under `## Current Session Todos` in `./MEMORY.md`.
4. **Verify todos were saved** by re-reading `./MEMORY.md`.
5. **Run graph query now (mandatory, parent scope only)** — extract 2-4 keywords from the task:

   ```bash
   py .claude/graph_query.py "keyword1 keyword2 keyword3"
   ```

   Capture the full stdout. Paste it verbatim into every subagent's `GRAPH CONTEXT` block.
   Also skim `graphify-out/GRAPH_REPORT.md`: **God Nodes** and **Surprising Connections**.

### Context quota guard

Run `/compact` at 60% context or 15-20 messages. Save `CONVERSATION.md` + `/remember` before compacting.

---

## Implementation Workflow

### Step 1 — Research the task

Spawn an **Opus subagent** (`model: "opus"` — preferred: `claude-opus-4-6`) with:

```
You are a senior software engineer. Implementation-focused research — no plan mode, no user approval.

Task: <user's task verbatim>

Codebase context:
<summarize relevant context from CLAUDE.md, .claude/CLAUDE.md, and graph results below.
Include god node warnings and architectural constraints.>

GRAPH CONTEXT (pre-queried — start here, not with file reads):
<paste full stdout of `py .claude/graph_query.py "..."` verbatim>

GRAPH USAGE RULES:
- Files in NODES: use graph data — only open for specific line numbers not in graph.
- File read budget: max 12 raw file reads. Every read of a file already in graph wastes budget.
- God node warnings: those classes cascade — changes here affect many dependents.
- Read EDGES first to understand call chains before opening source files.

Session context: Check CLAUDE.md and .claude/CLAUDE.md for gotchas, test baseline, conventions.

Produce:
1. Concise implementation summary
2. Smallest safe file set to touch — cross-reference NODES list
3. Focused step-by-step execution order
4. Risks/gotchas — especially god nodes in change set
5. Test-first execution: for each step, (a) test file + specific `it()` cases (run Red first),
   then (b) implementation files to make them pass (Green). Red-Green-Refactor per step.

Return concrete guidance to start implementing immediately.
```

### Step 2 — Execute the implementation

Implement immediately after the research pass. Break into focused steps, each touching a cohesive file set.

For each step follow Red-Green-Refactor strictly:
- Write failing test first — `php artisan make:test --pest` or Vitest file
- Run — confirm Red before any implementation code
- Write minimum implementation — Green
- Refactor if needed — rerun, confirm still Green
- Never write implementation before a failing test
- Mark corresponding todo `[x]` in `./MEMORY.md` as soon as step passes — no batching

**Within each step, spawn an Opus subagent if the step is complex:**

```
You are implementing step N of M (no plan mode — direct execution).

Task: <task>
This step: <description>
Files: <list>

Research output: <paste the research from Step 1>

GRAPH CONTEXT (pre-queried — use before reading files):
<paste full stdout of `py .claude/graph_query.py "..."` verbatim>

GRAPH USAGE RULES:
- Files in NODES: graph data replaces file reads for structure/relationships.
- Only open files for exact line numbers / method bodies not in graph.
- File read budget: max 12 raw reads this step.
- God node warnings: surgical changes, run tests after every edit.

TDD: write failing test → confirm Red → implement → Green → refactor.
Never implementation before failing test.

Project conventions:
- Tests: cd backend && /c/Users/danny/.config/herd/bin/php84/php.exe artisan test --compact
  Frontend: cd frontend && npx vitest run
- PHP format: vendor/bin/duster fix --dirty
- Frontend format: npx prettier --write . $(git diff --name-only --cached)
- TypeScript: cd frontend && npx tsc -p tsconfig.app.json --noEmit
- No // ── comments. Use /* ... */
- CLAUDE.md Known Gotchas before Eloquent/SQLite/factory code
- Architecture: services → repositories, DTOs, Resources for API

Report: what changed, tests passed, issues.
```

### Failure delegation (during Step 2)

If a test failure persists after 2 fix attempts, or a bug's root cause is unclear:
- **Stop implementing.** Invoke `diagnose` skill with the failing test output, relevant code, and what's been tried.
- Resume only after `diagnose` produces a confirmed hypothesis.

If implementation reveals an architectural smell:
- Note it in `.claude/CLAUDE.md`.
- After the task completes, offer to run `improve-codebase-architecture`.

### Step 3 — Final verification (PARENT AGENT)

1. Run affected tests — backend + frontend. Fix failures.
2. `cd frontend && npm run build` — fix TS/Vite errors.
3. Update `./MEMORY.md` — todos `[x]`, session summary with test counts.
4. Update `.claude/CLAUDE.md` — durable architectural decisions.
5. `Skill({ skill: "graphify", args: ". --update" })`

---

## Key Rules

- No plan mode. No user approval before implementing.
- **Run graph query in parent scope before spawning subagents** — paste output into every GRAPH CONTEXT block.
- **12-file read budget per subagent** — graph context replaces bulk file exploration.
- **God nodes = cascade risk** — surgical edits, test after every change.
- **Same session workflow and test rigor as planning skills.**
- **Fix failures and build errors before marking complete.**
- **Invoke graphify after completion — mandatory.**
- **Compact at 60% or 15-20 messages.**
