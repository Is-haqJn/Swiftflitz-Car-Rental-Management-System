---
name: opusplan
description: Deep planning with Claude Opus 4.6 (default), then implementation with Claude Sonnet. Use this skill whenever the user types /opusplan or asks to "opusplan" a task. Triggers on any message containing /opusplan followed by a task description. The skill enters plan mode, runs an Opus subagent to produce a thorough implementation plan, presents the plan inside the plan mode popup (so the user can select steps and comment), iterates on the plan while the user is still reviewing, calls ExitPlanMode only when the user explicitly approves, then executes the plan using Sonnet subagents broken into focused steps. Default model is Opus 4.6 (claude-opus-4-6); use Opus 4.7 (claude-opus-4-7) only when the user explicitly requests it.
---

# OpusPlan Skill

Two-phase workflow: **Opus plans, Sonnet builds.**

## When This Skill Is Active

User typed `/opusplan <task>`. Run the full workflow below from start to finish.

---

## Skill Routing Check (do this first, before anything else)

Read the task. Route to a more appropriate skill when the task clearly fits one of these cases — don't force everything through the planning flow:

| Task nature | Action |
|---|---|
| Requirements are fuzzy, incomplete, or just "build X" with no spec | Run `/to-prd` first. Don't enter plan mode against a vague spec — a bad plan is worse than no plan. |
| Task is primarily a refactor, module consolidation, or architecture improvement | Invoke `improve-codebase-architecture` skill first to identify the right boundaries before planning implementation. |
| Task is purely about writing or fixing tests, or user says "TDD this" | Delegate to `tdd` skill instead — it owns the red-green-refactor loop end to end. |
| Task requires creating a new Claude skill | Invoke `write-a-skill` skill. Don't plan a skill manually. |
| Task is a normal feature, bug fix, or mixed build | Continue below — this is what opusplan is for. |

Only proceed below after this check.

---

## Before You Start — Session Workflow Checks

Do these checks before planning:

1. **Invoke `/session-workflow` first** and follow it.
2. **Read `./MEMORY.md`** — check current todos and session state from the last session. Note any pending work.
3. **Add current-task todos now (before planning)** under `## Current Session Todos` in `./MEMORY.md`.
4. **Verify todos were saved** by re-reading `./MEMORY.md`. If missing, stop and add them before continuing.
5. **Run graph query now (mandatory, parent scope only)** — extract 2-4 keywords from the task and run:

   ```bash
   py .claude/graph_query.py "keyword1 keyword2 keyword3"
   ```

   Capture the full stdout. You will paste it verbatim into the `GRAPH CONTEXT` block of every subagent prompt below. This replaces open-ended Grep/Glob for any files already in the graph.

   Also skim `graphify-out/GRAPH_REPORT.md` sections: **God Nodes** and **Surprising Connections**.

### Context quota guard (mandatory)

Run `/compact` when either condition is met (whichever comes first):
- context usage reaches 60%
- the session reaches 15-20 messages

Before `/compact`, save current state to `CONVERSATION.md`, then run `/remember`.

---

## Model Selection

**Default: Opus 4.6** (`claude-opus-4-6`). Only upgrade to Opus 4.7 (`claude-opus-4-7`) when the user explicitly requests it (e.g. `/opusplan --opus47 ...`).

The Agent tool currently accepts `model: "opus"` (shorthand). If the tool gains version-specific IDs, pass `claude-opus-4-6` explicitly. Until then, include a note in every subagent prompt: `"Preferred model: claude-opus-4-6"` so the intent is traceable.

---

## Phase 1: Plan (Claude Opus)

### Step 1 — Enter plan mode

Call `EnterPlanMode` only after the pre-planning checks above are complete. Do not skip this.

### Step 2 — Research with Opus

Spawn an **Opus subagent** (`model: "opus"` — preferred: `claude-opus-4-6`) with this mission:

```
You are a senior software architect. Your job is deep planning only — no code changes.

Task: <user's task verbatim>

Codebase context:
<summarize relevant context from CLAUDE.md, .claude/CLAUDE.md, and the graph query results below.
Include god node warnings and architectural constraints. You cannot invoke skills — use graph data.>

GRAPH CONTEXT (pre-queried by parent — start here, not with file reads):
<paste the full stdout of `py .claude/graph_query.py "..."` verbatim>

GRAPH USAGE RULES:
- Any file in the NODES list: use graph data for structure/relationships. Only open the file when
  you need a specific line or method body not shown in the graph.
- File read budget: max 12 raw file reads. Every read of a file already in the graph wastes budget.
- God node warnings are real: those classes have 20+ dependents — changes cascade widely.
- Read EDGES first to understand call chains before opening any source file.

Session context: Check CLAUDE.md (project root) and .claude/CLAUDE.md for known gotchas, test
baseline, architecture decisions, and conventions the plan must respect.

Produce a structured implementation plan:
1. Problem analysis — what needs to change and why
2. Files to create or modify (paths) — cross-reference with NODES list above
3. Step-by-step implementation sequence (ordered, dependency-aware)
4. Risks or gotchas — especially god nodes in your change set
5. Test plan — EXACT test files, class names (Pest `php artisan make:test --pest`), and specific
   `it()` / `test()` cases with inputs + expected outputs. Frontend: Vitest file paths + coverage.
   Tests are written FIRST — implementer follows Red-Green-Refactor within each step.

Be thorough. The Sonnet implementer will only see your plan.
```

### Step 3 — Present plan in plan mode popup

Output the complete plan. Format clearly with numbered steps, files, and risks.

**Stay in plan mode.** Only call `ExitPlanMode` when user explicitly approves (e.g. "yes", "proceed"). Comments and questions keep you in plan mode.

### Step 3b — Iterate if needed

Revise and re-output plan until user explicitly approves. Spawn another Opus subagent if deeper research is needed.

---

## Phase 2: Implement (Claude Sonnet)

### Step 4 — Exit plan mode

Call `ExitPlanMode`. Capture user feedback to shape implementation.

### Step 5 — Refine MEMORY.md and update team notes

**a) Update `./MEMORY.md`** — refine todos with concrete implementation steps:
```
- [ ] Implement step 1: <description>
- [ ] Implement step 2: <description>
```

**b) Update `.claude/CLAUDE.md`** — append new architectural decisions or gotchas surfaced during planning.

### Step 6 — Break into steps

Split the plan into 2–5 focused steps. Each step: cohesive file set, independently verifiable, feeds next step.

### Step 7 — Execute steps sequentially

For each step, spawn a **Sonnet subagent** (`model: "sonnet"`) with:

```
You are implementing step N of M in a planned task.

Overall task: <user's original task>
User feedback: <comments from plan review, or "none">
Your step: <step description>
Files involved: <list from plan>

Full plan:
<paste full plan>

GRAPH CONTEXT (pre-queried — use before reading files):
<paste the full stdout of `py .claude/graph_query.py "..."` verbatim>

GRAPH USAGE RULES:
- Files in NODES: use graph relationships, not file reads, for structure.
- Only open a file for exact line numbers / method bodies not covered by graph data.
- File read budget: max 12 raw file reads for this step.
- God node warnings above: surgical changes only, run tests after every edit.
- Check EDGES to confirm your call chain before writing code.

TDD mandate — Red-Green-Refactor every step:
1. Write failing test first. Run — confirm Red.
2. Write minimum implementation to pass — Green.
3. Refactor if needed — rerun, confirm still Green.
Never write implementation before a failing test exists.

Project conventions:
- Tests: cd backend && /c/Users/danny/.config/herd/bin/php84/php.exe artisan test --compact
  Frontend: cd frontend && npx vitest run
- PHP format: vendor/bin/duster fix --dirty (never Pint directly)
- Frontend format: npx prettier --write . $(git diff --name-only --cached)
- TypeScript: cd frontend && npx tsc -p tsconfig.app.json --noEmit
- No // ── box-drawing comments. Use /* ... */
- Known gotchas: CLAUDE.md Known Gotchas section — check before Eloquent/SQLite/factory code
- Architecture: services → repositories, DTOs between layers, Resources for API output

After changes: run affected tests, fix failures, report what changed + test results.
```

Wait for each step. After each subagent, mark todo `[x]` in `./MEMORY.md` before spawning next.

### Step 8 — Final verification (PARENT AGENT)

1. **Run full test suite** — backend + frontend. Report results.
2. **Fix any failures.**
3. **Check build** — `cd frontend && npm run build`. Fix TS/Vite errors.
4. **Update `./MEMORY.md`** — mark all todos `[x]`, write session summary with test counts.
5. **Update `.claude/CLAUDE.md`** — append durable architectural decisions or gotchas.
6. **Invoke graphify skill**:
   ```
   Skill({ skill: "graphify", args: ". --update" })
   ```
   Parent scope only. Fallback: `py .claude/graph_query.py` is read-only; run `graphify . --update` via Bash for the update.

---

## Key Rules

- **EnterPlanMode first, ExitPlanMode only on explicit approval.**
- **Run graph query in parent scope before spawning any subagent** — paste output into every GRAPH CONTEXT block.
- **12-file read budget per subagent** — graph context replaces bulk file exploration.
- **God nodes flagged by graph query = cascade risk** — note in plan, surgical edits only.
- **Todos in MEMORY.md before planning** — never enter plan mode without them.
- **Opus 4.6 plans, Sonnet 4.6 implements** — default. Use Opus 4.7 only on explicit user request.
- **Full plan + graph context + user feedback in every Sonnet subagent prompt.**
- **Fix test failures and build errors before marking complete.**
- **Update .claude/CLAUDE.md** with durable findings — parent agent, not subagents.
- **Invoke graphify after completion** — mandatory final step.
- **Compact at 60% context or 15-20 messages** — save CONVERSATION.md + /remember first.
