---
name: sonnetplan
description: Deep planning with Claude Sonnet, then implementation with Claude Sonnet. Use this skill whenever the user types /sonnetplan or asks to "sonnetplan" a task. Triggers on any message containing /sonnetplan followed by a task description. The skill enters plan mode, runs a Sonnet subagent to produce a thorough implementation plan, presents the plan inside the plan mode popup (so the user can select steps and comment), iterates on the plan while the user is still reviewing, calls ExitPlanMode only when the user explicitly approves, then executes the plan using Sonnet subagents broken into focused steps.
---

# SonnetPlan Skill

Two-phase workflow: **Sonnet plans, Sonnet builds.**

## When This Skill Is Active

User typed `/sonnetplan <task>`. Run the full workflow below from start to finish.

---

## Skill Routing Check (do this first, before anything else)

Read the task. Route to a more appropriate skill when the task clearly fits one of these cases:

| Task nature | Action |
|---|---|
| Requirements are fuzzy, incomplete, or just "build X" with no spec | Run `/to-prd` first. Don't enter plan mode against a vague spec. |
| Task is primarily a refactor, module consolidation, or architecture improvement | Invoke `improve-codebase-architecture` skill first to identify boundaries before planning implementation. |
| Task is purely about writing or fixing tests, or user says "TDD this" | Delegate to `tdd` skill instead — it owns the red-green-refactor loop end to end. |
| Task requires creating a new Claude skill | Invoke `write-a-skill` skill. Don't plan a skill manually. |
| Task is a normal feature, bug fix, or mixed build | Continue below. |

Only proceed below after this check.

---

## Before You Start — Session Workflow Checks

1. **Invoke `/session-workflow` first** and follow it.
2. **Read `./MEMORY.md`** — check current todos and session state. Note any pending work.
3. **Add current-task todos now** under `## Current Session Todos` in `./MEMORY.md`.
4. **Verify todos were saved** by re-reading `./MEMORY.md`.
5. **Run graph query now (mandatory, parent scope only)** — extract 2-4 keywords from the task:

   ```bash
   py .claude/graph_query.py "keyword1 keyword2 keyword3"
   ```

   Capture the full stdout. Paste it verbatim into every subagent's `GRAPH CONTEXT` block.
   Also skim `graphify-out/GRAPH_REPORT.md`: **God Nodes** and **Surprising Connections**.

### Context quota guard

Run `/compact` at 60% context usage or 15-20 messages. Save `CONVERSATION.md` + `/remember` before compacting.

---

## Phase 1: Plan (Claude Sonnet)

### Step 1 — Enter plan mode

Call `EnterPlanMode` after pre-planning checks are complete.

### Step 2 — Research with Sonnet

Spawn a **Sonnet subagent** (`model: "sonnet"`) with:

```
You are a senior software architect. Deep planning only — no code changes.

Task: <user's task verbatim>

Codebase context:
<summarize relevant context from CLAUDE.md, .claude/CLAUDE.md, and graph query results below.
Include god node warnings and architectural constraints.>

GRAPH CONTEXT (pre-queried — start here, not with file reads):
<paste full stdout of `py .claude/graph_query.py "..."` verbatim>

GRAPH USAGE RULES:
- Files in NODES: use graph data — only open for specific line numbers not in graph.
- File read budget: max 12 raw file reads. Graph covers most structure.
- God node warnings: those classes cascade — touch carefully.
- Read EDGES first to understand call chains.

Session context: Check CLAUDE.md and .claude/CLAUDE.md for gotchas, test baseline, conventions.

Produce structured plan:
1. Problem analysis — what changes and why
2. Files to create/modify — cross-reference NODES list
3. Step-by-step sequence (ordered, dependency-aware)
4. Risks/gotchas — especially god nodes
5. Test plan — EXACT file names, class names (Pest `php artisan make:test --pest`), specific
   `it()` cases with input + expected output. Frontend: Vitest paths + coverage.
   Tests written FIRST — Red-Green-Refactor per step.

Be thorough. The Sonnet implementer only sees your plan.
```

### Step 3 — Present plan in plan mode popup

Output complete plan. Stay in plan mode until user explicitly approves.

### Step 3b — Iterate if needed

Revise and re-output until explicit approval. Spawn another Sonnet subagent for deeper research if needed.

---

## Phase 2: Implement (Claude Sonnet)

### Step 4 — Exit plan mode

Call `ExitPlanMode`. Capture user feedback.

### Step 5 — Refine MEMORY.md and update team notes

**a)** Refine todos with concrete steps.
**b)** Update `.claude/CLAUDE.md` with new architectural decisions from planning.

### Step 6 — Break into steps

2–5 focused steps. Each: cohesive file set, independently verifiable, feeds next.

### Step 7 — Execute steps sequentially

Spawn a **Sonnet subagent** (`model: "sonnet"`) per step:

```
You are implementing step N of M.

Overall task: <task>
User feedback: <plan feedback or "none">
Your step: <step description>
Files involved: <list>

Full plan:
<paste plan>

GRAPH CONTEXT (pre-queried — use before reading files):
<paste full stdout of `py .claude/graph_query.py "..."` verbatim>

GRAPH USAGE RULES:
- Files in NODES: use graph relationships, not file reads, for structure.
- Only open files for exact line numbers / method bodies not in graph.
- File read budget: max 12 raw reads this step.
- God node warnings: surgical changes, run tests after every edit.
- Check EDGES to confirm call chain before writing code.

TDD mandate — Red-Green-Refactor:
1. Write failing test. Run — confirm Red.
2. Minimum implementation — Green.
3. Refactor — confirm still Green.
Never write implementation before a failing test.

Project conventions:
- Tests: cd backend && /c/Users/danny/.config/herd/bin/php84/php.exe artisan test --compact
  Frontend: cd frontend && npx vitest run
- PHP format: vendor/bin/duster fix --dirty
- Frontend format: npx prettier --write . $(git diff --name-only --cached)
- TypeScript: cd frontend && npx tsc -p tsconfig.app.json --noEmit
- No // ── comments. Use /* ... */
- CLAUDE.md Known Gotchas before Eloquent/SQLite/factory code
- Architecture: services → repositories, DTOs, Resources for API

Report: what changed, tests passed, issues found.
```

Mark todo `[x]` in `./MEMORY.md` after each subagent before spawning next.

### Step 8 — Final verification (PARENT AGENT)

1. Run full test suite (backend + frontend). Report results.
2. Fix any failures.
3. `cd frontend && npm run build` — fix TS/Vite errors.
4. Update `./MEMORY.md` — mark todos `[x]`, session summary with test counts.
5. Update `.claude/CLAUDE.md` — durable architectural decisions.
6. Invoke graphify: `Skill({ skill: "graphify", args: ". --update" })`

---

## Key Rules

- **EnterPlanMode first, ExitPlanMode only on explicit approval.**
- **Run graph query in parent scope before spawning subagents** — paste output into every GRAPH CONTEXT block.
- **12-file read budget per subagent** — graph context replaces bulk file exploration.
- **God nodes = cascade risk** — note in plan, surgical edits only.
- **Todos in MEMORY.md before entering plan mode.**
- **Full plan + graph context + user feedback in every implementation subagent.**
- **Fix test failures and build errors before marking complete.**
- **Update .claude/CLAUDE.md with durable findings.**
- **Invoke graphify after completion — mandatory.**
- **Compact at 60% context or 15-20 messages.**
