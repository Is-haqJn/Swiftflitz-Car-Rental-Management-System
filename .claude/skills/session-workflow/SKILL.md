---
name: session-workflow
description: "Enforce session workflow conventions for the Swiftflitz Car Rental Management System. ALWAYS activate at the start of every session and before beginning any task. Use when: starting a new feature, fixing a bug, writing tests, making frontend changes, using MCP tools, managing memory/todos, approaching context limits, or any implementation work in this project. This skill defines the mandatory protocol for task management, memory updates, test-first development, build verification, and context preservation."
license: MIT
metadata:
  author: swiftflitz-team
---

# Session Workflow - Swiftflitz Car Rental Management System

Mandatory conventions for every session. Follow these before, during, and after every task.

## Core References - Read at Session Start, Consult Before Every Decision

Scan for ALL instruction files at the start of every session. Read each that exists; skip silently if absent. Precedence when files conflict: project-root CLAUDE.md > `.claude/CLAUDE.md` > AGENTS.md > `.claude/AGENTS.md`.

| File | Purpose |
|------|---------|
| `CLAUDE.md` (project root) | Known gotchas, test baseline, architecture decisions, coding conventions |
| `.claude/CLAUDE.md` (team notes) | Notification system, payment flows, frontend conventions, historical decisions |
| `AGENTS.md` (project root) | Agent-specific instructions - read if present; may duplicate or extend CLAUDE.md |
| `.claude/AGENTS.md` | Additional agent instructions scoped to `.claude/` tooling |
| `./MEMORY.md` (project root) | Current todos, session state, cross-session context |
| `graphify-out/GRAPH_REPORT.md` | God nodes, community clusters - use BEFORE grepping raw files |

After reading, **extract and internalize**:
- Active test baseline count (never regress below it)
- Known gotchas that apply to today's work domain
- Architecture constraints (service/repository layers, enum values, morph aliases, etc.)
- Any "never do X" or "always use Y" rules relevant to the task

When stuck or uncertain about an architectural decision, re-read these before proceeding. Also fallback to `laravel-boost-guidelines` for framework-specific standards.

## MCP Tools - Prefer Over Manual Alternatives

Always reach for MCP tools first:

- `laravel-boost` tools: `database-schema`, `database-query`, `search-docs`, `get-absolute-url`, `last-error`, `browser-logs`, `read-log-entries`
- `herd` tools: `get_all_sites`, `get_all_php_versions`, `secure_or_unsecure_site`

Use `search-docs` before writing any Laravel/framework-specific code. Use `database-schema` before writing migrations. Use `get-absolute-url` before sharing URLs. Use `database-query` instead of tinker for read-only queries.

## Task Management - MEMORY.md Protocol

### Before starting any implementation:

1. Open `./MEMORY.md` in the project root
2. Add all planned todos under a `## Current Session Todos` section using this format:
   ```
   - [ ] Task description
   - [ ] Another task
   ```
3. Do NOT begin implementation until todos are written

### During implementation:

- Do NOT mark a todo `[x]` until the task is fully complete (tests pass, build clean)
- Update `./MEMORY.md` immediately after completing each discrete task

### After all tasks are done:

- Mark all todos `[x]` or remove the completed section
- Write a session summary entry in `./MEMORY.md`
- **Invoke the graphify skill** to keep the knowledge graph current — use the Skill tool: `Skill({ skill: "graphify", args: ". --update" })`. This is NOT a bash command. Must be done by the parent agent — subagents cannot invoke skills. Fall back to `graphify . --update` via Bash only if the Skill tool is unavailable.

### Before context quota fills:

- Save conversation state to `CONVERSATION.md` in the project root
- Run `/remember` to update context for the next conversation (or manually store in `./MEMORY.md` if `/remember` is unavailable)
- Update `./MEMORY.md` with current state, what's done, what's remaining

## Test-First Development (Red-Green-Refactor)

TDD is mandatory within every implementation step — not just at task level. For EACH discrete change:

1. Check if tests already exist: `php artisan test --compact --filter=<FeatureName>`
2. If no tests exist, create them first: `php artisan make:test --pest <FeatureName>Test`
3. Write the specific `it()` cases that cover the behavior you are about to implement
4. Run tests to confirm they FAIL (Red) — if they pass before you implement, the test is wrong
5. Write the minimum implementation to make them pass (Green)
6. Refactor if needed, rerun to confirm still green
7. Never write implementation code before a failing test exists for it

For frontend: check `frontend/src/**/*.test.ts?(x)` before adding new test files. Write Vitest tests first for new hooks, services, and utility functions.

When instructing subagents to implement steps, always include the TDD mandate explicitly — subagents start cold and will skip TDD unless told. The planning skills (opusplan/sonnetplan) produce a "Test plan" section listing exact test files and `it()` cases; the implement skills (opusimplement/sonnetimplement) enforce Red-Green-Refactor in their step execution loop.

Run tests after every change:
- Backend: `cd backend && /c/Users/danny/.config/herd/bin/php84/php.exe artisan test --compact`
- Frontend: `cd frontend && npx vitest run`

Fix ALL test failures introduced by your changes before marking a task complete. Pre-existing failures (~0 on clean checkout per current baseline) must not increase.

## Frontend Changes - Build Verification

After every frontend file change:

1. Check TypeScript errors: `cd frontend && npx tsc -p tsconfig.app.json --noEmit`
2. Fix ALL TypeScript errors before proceeding
3. Run frontend tests: `cd frontend && npx vitest run`
4. Format changed files: `npx prettier --write . $(git diff --name-only --cached)`

If the user doesn't see a change reflected, ask them to run `npm run dev` or `composer run dev`.

## Code Formatting

After any PHP file change, run Duster (not Pint directly):
```bash
cd backend && /c/Users/danny/.config/herd/bin/php84/php.exe vendor/bin/duster fix --dirty
```

## Commenting Convention

Never use `// ──` or `──comment──` box-drawing comment wrappers. Use `/* ... */` for block comments.

## Typography Convention

Use short dash (`-`) in all text output. Never use long dash (`-`).

## Context Management

- Run `/compact` when context usage reaches 60% or after 15-20 messages in a session, whichever comes first.
- ALWAYS remember to execute this context management even when streaming a response or when operations/commands are running, interrupted, or done. Do not skip compacting just because a task was interrupted.
- Before compacting: save conversation state to `CONVERSATION.md` in the project root
- Use `/remember` to update context for the next conversation. If the `/remember` command is not available or fails, manually store the context in `./MEMORY.md` in the current project.

## Team Memory Updates

After completing any significant task — do these yourself, not via subagent:

1. **Update `./MEMORY.md`** — session state, todos, current test baseline. Read first, edit, verify write.
2. **Update `.claude/CLAUDE.md`** — new architectural decisions, gotchas, or patterns the team should know. Read first, append to relevant section, verify write. Keep entries concise and permanent, not session-specific.
3. Run project memory optimization if `.claude/CLAUDE.md` is getting stale or bloated.
4. **Invoke the graphify skill** to reflect code changes in the knowledge graph — use the Skill tool: `Skill({ skill: "graphify", args: ". --update" })`. NOT a bash command. Parent agent only — subagents cannot invoke skills. Bash fallback: `graphify . --update`

## Session Start Checklist

When beginning a session:

1. Discover and read all instruction files in this order (skip if absent):
   - `CLAUDE.md` (project root)
   - `.claude/CLAUDE.md`
   - `AGENTS.md` (project root)
   - `.claude/AGENTS.md`
2. Read `./MEMORY.md` - understand current todos and state from last session
3. Internalize: test baseline, active gotchas, "never do X" rules for today's domain
4. Check current test baseline: `php artisan test --compact 2>&1 | tail -5`
5. Note any pending todos from last session before adding new ones
6. If `graphify-out/GRAPH_REPORT.md` exists, read the God Nodes and Communities sections - use before grepping/reading files to orient quickly in the codebase
