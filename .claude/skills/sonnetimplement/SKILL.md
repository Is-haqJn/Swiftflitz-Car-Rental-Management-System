---
name: sonnetimplement
description: Direct implementation with Claude Sonnet. Use this skill whenever the user types /sonnetimplement or asks to "sonnetimplement" a task. Triggers on any message containing /sonnetimplement followed by a task description. The skill skips plan mode, follows the same session workflow and memory checks as sonnetplan, researches the codebase as needed, executes focused implementation steps with Sonnet subagents, and validates the result before updating memory.
license: MIT
metadata:
  author: swiftflitz-team
---

# SonnetImplement Skill

One-phase workflow: **Sonnet researches, then implements immediately.**

## When This Skill Is Active

User typed `/sonnetimplement <task>`. Run the full workflow below from start to finish.

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

Spawn a **Sonnet subagent** (`model: "sonnet"`) with:

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
- God node warnings: those classes cascade — changes affect many dependents.
- Read EDGES first to understand call chains before opening source files.

Session context: Check CLAUDE.md and .claude/CLAUDE.md for gotchas, test baseline, conventions.

Produce:
1. Concise implementation summary
2. Smallest safe file set to touch — cross-reference NODES list
3. Focused step-by-step execution order
4. Risks/gotchas — especially god nodes
5. Test-first execution: for each step, (a) test file + specific `it()` cases (Red first),
   then (b) implementation files to make them pass (Green). Red-Green-Refactor per step.

Return concrete guidance to start implementing immediately.
```

### Step 2 — Execute the implementation

Implement immediately after the research pass. Break into focused steps per cohesive file set.

For each step follow Red-Green-Refactor strictly:
- Write failing test first — `php artisan make:test --pest` or Vitest
- Run — confirm Red
- Minimum implementation — Green
- Refactor — rerun, confirm Green
- Never implementation before failing test
- Mark todo `[x]` in `./MEMORY.md` as soon as step passes

**For complex steps, spawn a Sonnet subagent:**

```
You are implementing step N of M (no plan mode — direct execution).

Task: <task>
This step: <description>
Files: <list>

Research output: <paste research from Step 1>

GRAPH CONTEXT (pre-queried — use before reading files):
<paste full stdout of `py .claude/graph_query.py "..."` verbatim>

GRAPH USAGE RULES:
- Files in NODES: graph data replaces file reads for structure.
- Only open files for exact lines / method bodies not in graph.
- File read budget: max 12 raw reads this step.
- God node warnings: surgical changes, test after every edit.

TDD: failing test → Red → implement → Green → refactor.

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
- **12-file read budget per subagent.**
- **God nodes = cascade risk — surgical edits, test after every change.**
- **Same session workflow and test rigor as planning skills.**
- **Fix failures and build errors before marking complete.**
- **Invoke graphify after completion — mandatory.**
- **Compact at 60% or 15-20 messages.**
