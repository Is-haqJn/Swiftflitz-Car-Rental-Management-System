<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/reverb (REVERB) - v1
- laravel/sanctum (SANCTUM) - v4
- laravel/telescope (TELESCOPE) - v5
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v3
- phpunit/phpunit (PHPUNIT) - v11
- laravel-echo (ECHO) - v2
- tailwindcss (TAILWINDCSS) - v4

## Skills Activation

This project has domain-specific skills available. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

- `laravel-best-practices` — Apply this skill whenever writing, reviewing, or refactoring Laravel PHP code. This includes creating or modifying controllers, models, migrations, form requests, policies, jobs, scheduled commands, service classes, and Eloquent queries. Triggers for N+1 and query performance issues, caching strategies, authorization and security patterns, validation, error handling, queue and job configuration, route definitions, and architectural decisions. Also use for Laravel code reviews and refactoring existing Laravel code to follow best practices. Covers any task involving Laravel backend PHP code patterns.
- `pest-testing` — Use this skill for Pest PHP testing in Laravel projects only. Trigger whenever any test is being written, edited, fixed, or refactored — including fixing tests that broke after a code change, adding assertions, converting PHPUnit to Pest, adding datasets, and TDD workflows. Always activate when the user asks how to write something in Pest, mentions test files or directories (tests/Feature, tests/Unit) or architecture tests. Covers: test()/it()/expect() syntax, datasets, mocking, browser testing, arch(), Livewire component tests, RefreshDatabase, and all Pest 3 features. Do not use for editing factories, seeders, migrations, controllers, models, or non-test PHP code.
- `tailwindcss-development` — Always invoke when the user's message includes 'tailwind' in any form. Also invoke for: building responsive grid layouts (multi-column card grids, product grids), flex/grid page structures (dashboards with sidebars, fixed topbars, mobile-toggle navs), styling UI components (cards, tables, navbars, pricing sections, forms, inputs, badges), adding dark mode variants, fixing spacing or typography, and Tailwind v3/v4 work. The core use case: writing or fixing Tailwind utility classes in HTML templates (Blade, JSX, Vue). Skip for backend PHP logic, database queries, API routes, JavaScript with no HTML/CSS component, CSS file audits, build tool configuration, and vanilla CSS.
- `medialibrary-development` — Build and work with spatie/laravel-medialibrary features including associating files with Eloquent models, defining media collections and conversions, generating responsive images, and retrieving media URLs and paths.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

## Frontend Architecture

### Goal

Provide concise rules and conventions for the existing frontend (React + TypeScript + Vite + Tailwind v4) so contributors produce consistent, testable, and maintainable UI code.

### Principles

- Prefer reuse over duplication - check sibling files/components before adding new ones.
- Keep components small, focused, and composition-friendly.
- Follow existing naming, file placement and import patterns found in the repo.

### Directory & File Guidelines

- Follow the existing top-level folders: admin/, auth/, shared/, shells/, website/, store/, services/.
- Create new files only inside these directories. Do not add new top-level base folders without approval.
- Co-locate styles with the feature when the styles are feature-specific (e.g., components folder). Global styles belong in src/shared/styles/.

### Components

- Presentational components → src/shared/components/ui/ or admin/components/ui/.
- Feature-specific components → feature folder under pages or admin/components/.
- Use TSX with explicit prop types (interfaces or type aliases). Keep components pure where possible.
- Export components as default only when they represent a single primary export; otherwise use named exports.
- Prefer composition (children, render props) over large prop booleans.

### Layouts & Shells

- Use shells (src/shells/) to orchestrate global providers, route-level layout and auth checks.
- Layout components belong in src/layouts/ (or feature-specific layouts under admin/layouts/).
- Keep layout logic thin - delegate heavy logic to hooks/services.

### Pages & Routes

- Pages (route targets) go in pages/ under the appropriate domain (admin/page or website/).
- Use route modules (routes/) for route definitions and protected/guest wrappers (GuestRoute, ProtectedRoute).
- Prefer route-level code-splitting for large admin pages.

### State & Store

- Centralized state lives in src/store/; keep slices small and domain-focused.
- For async data prefer query clients (src/shared/libs/queryClient.ts) and hooks (useVehicles, useCustomers) - avoid duplicating network/state logic.
- Use selectors or custom hooks to expose derived state, not direct store access from UI components.

### Services & API

- Single responsibility services live under src/services/ and call shared/api/apiClient.ts.
- Services return typed DTOs (use shared types) and swallow no UI concerns.
- Always use shared/api/endpoints.ts for route constants.

### Hooks & Utilities

- Put reusable hooks in src/shared/hooks/ (or feature-level hooks next to their feature).
- Keep hooks focused (one responsibility) and well-typed.
- Utilities and validation live in src/shared/libs/.

### Types & Contracts

- Centralize shared types under src/shared/types/.
- Always prefer explicit types for props, service responses, and hook returns.
- Keep API response shapes in shared types and map to UI shapes in services or mappers.

### Styling

- Use Tailwind v4 utility-first approach, following repo conventions (src/shared/styles/index.css and admin/assets/css/style.css).
- Avoid inline styles; prefer utility classes or small component-level CSS when truly necessary.
- Use theme constants in src/admin/constants/theme.tsx for /admin or src/shared/styles for color/spacing tokens.

### Assets & Static Files

- Place static assets in public/ for Vite consumption; admin-specific assets in admin/assets/.
- Images referenced in components should be imported when processed by Vite or referenced from public/ for static paths.

### Templates

- search for available components in the templates directory end-specific (frontend) and recreate from it, but fallback to sleek when template doest have what you want to create

### Testing

- Add unit/feature tests for new logic where appropriate. Use the project’s testing conventions (ask before adding new test infra).
- For data-fetching logic test services/hooks via mocks; for components prefer shallow render + behavior tests.
- Run the minimum tests required locally (vite/test command if exists) before PR.
- Always fix any broken tests caused by your changes before finalizing.

### Tooling & Formatting

- Respect existing ESLint, Prettier, and tailwind config.
- If build artifacts are not reflected, run: npm run dev or npm run build (or composer run dev for backend assets).
- Add new dependencies only after approval.
- if done making changes, run: npx prettier --write . $(git diff --name-only --cached) to format only changed files. and you can run npx prettier --check . $(git diff --name-only --cached) to check formatting before committing.
- Alway check for typescript build errors and fix.

### PRs & Review

- Include small readable commits and describe UI behavior changes and any migration steps.
- Reference related backend endpoints or contract changes in the PR description.

### When in Doubt

- Inspect sibling files to match patterns.
- Ask before introducing new architecture patterns or folders.

(Keep this section brief in the repo README and expand only when requested.)

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.
- To check environment variables, read the `.env` file directly.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== herd rules ===

# Laravel Herd

- The application is served by Laravel Herd at `https?://[kebab-case-project-dir].test`. Use the `get-absolute-url` tool to generate valid URLs. Never run commands to serve the site. It is always available.
- Use the `herd` CLI to manage services, PHP versions, and sites (e.g. `herd sites`, `herd services:start <service>`, `herd php:list`). Run `herd list` to discover all available commands.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

## Database

- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries.
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.


### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## Controllers & Validation

- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

## Architecture Layers

- **Controllers** - Keep thin. Delegate business logic to services. Only handle HTTP request/response.
- **Services** - Place all business logic in service classes under `app/Services/`. Each service must have a corresponding interface in `app/Services/Contracts/`. Bind interfaces in `app/Providers/ServiceClassServiceProvider.php`.
- **Repositories** - Place all data access logic in repository classes under `app/Repositories/`. Each repository must have a corresponding interface in `app/Repositories/Contracts/`. Bind interfaces in `app/Providers/RepositoryServiceProvider.php`.
- **DTOs (Data Transfer Objects)** - Use DTOs under `app/DTOs/` to pass structured data between layers (e.g., from request to service). Use `readonly` properties and PHP 8 constructor promotion.
- **Form Requests** - Always use Form Request classes under `app/Http/Requests/` for validation. Never validate inline in controllers.
- **Resources** - Use Eloquent API Resources under `app/Http/Resources/` to transform model data for API responses. Never return raw models from API endpoints.
- **Jobs** - use Jobs under laravel default structure.
- **Events** - use Events under laravel default structure.

## Authentication & Authorization

- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).


## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Queues

- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

## Configuration

- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

## Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== laravel/v12 rules ===

# Laravel 12

- CRITICAL: ALWAYS use `search-docs` tool for version-specific Laravel documentation and updated code examples.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

## Laravel 12 Structure

- In Laravel 12, middleware are no longer registered in `app\Http/Kernel.php`.
- Middleware are configured declaratively in `bootstrap/app.php` using `Application::configure()->withMiddleware()`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- The `app\Console/Kernel.php` file no longer exists; use `bootstrap/app.php` or `routes/console.php` for console configuration.
- Console commands in `app\Console/Commands/` are automatically available and do not require manual registration.

## Database

- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 12 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models

- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== spatie/laravel-medialibrary rules ===

## Media Library

- `spatie/laravel-medialibrary` associates files with Eloquent models, with support for collections, conversions, and responsive images.
- Always activate the `medialibrary-development` skill when working with media uploads, conversions, collections, responsive images, or any code that uses the `HasMedia` interface or `InteractsWithMedia` trait.

=== tightenco/duster rules ===

## Duster Code Formatter

- You must run `vendor/bin/duster fix --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Duster wraps Laravel Pint and other formatters, so never run Pint directly. Always prefer Duster for formatting tasks.

=== chat sessions rules ===

## Chat Sessions

### Instructions: 

you are operating within a structured project workflow. Strict adherence to the following guidelines is required for all implementations.

**Core References & Tooling**
* Always consult `CLAUDE.md`, `AGENTS.md`, and `/skills` for project instructions, documentation, and whenever you are stuck on a decision.
* Prioritize the use of MCP tools, specifically `laravel boost` and `herd`.
* Always fallback to `laravel-boost-guidelines` for framework standards.

**Task & State Management**
* Document all to-dos in the root `./MEMORY.md` file before beginning any implementation. 
* Do not mark to-dos as complete or clear them until all tasks are fully finished.
* Update the root `./MEMORY.md` immediately after completing every task.
* Always: Ensure `./MEMORY.md` is updated before the context quota is full to preserve state for the next session.
* Update the project team's memory located in `.claude/CLAUDE.md` and perform project memory optimization.
* Always run tests `npm run test` (frontend) or `php artisan test` (backend) after changes, fix any failures either pre-existing or introduced before marking tasks complete.

**Conversation & Context Handling**
* Save the chat history to `CONVERSATION.md` before compacting the chat.
* Always run the `/compact` command after 15 to 20 messages or 70% context usage to optimize and preserve important information for future sessions.
* Use the `/remember` command to update context for the next chat conversation.

**Development & Quality Assurance**
* Write tests before beginning implementations if tests do not already exist.
* Always fix test errors immediately to ensure continuous compatibility.
* Check for and fix project build errors whenever frontend changes are made.

**Syntax & Typography Rules**
* Strictly use `/* ... */` for commenting. Never use double-slash followed by box-drawing dashes, or box-drawing comment wrappers.
* Always use a short dash (`-`) instead of a long dash in all text outputs.


</laravel-boost-guidelines>

## Project Quick Reference

### Monorepo Layout
```
/
├── backend/     Laravel 12 API (PHP 8.4)
└── frontend/    React 19 + TypeScript + Vite + Tailwind v4
```

### Commands

**PHP binary (not in PATH - must use full Herd path):**
```bash
/c/Users/danny/.config/herd/bin/php84/php.exe artisan <cmd>
```

| Task | Command |
|------|---------|
| Run tests | `cd backend && /c/Users/.../.config/herd/bin/php84/php.exe artisan test --compact` |
| Run single test | `... artisan test --compact --filter=ReportTest` |
| Format PHP | `cd backend && /c/Users/.../.config/herd/bin/php84/php.exe vendor/bin/duster fix --dirty` |
| TypeScript check | `cd frontend && npx tsc -p tsconfig.app.json --noEmit` |
| Frontend tests | `cd frontend && npx vitest run` |

**Always use Duster (not Pint directly):** `vendor/bin/duster fix --dirty`

### Pre-existing Test Failures
~29 tests fail on a clean checkout - this is the known baseline, not a regression:
- `CustomUrlGeneratorTest` (2 tests)
- Various tests in `VehicleTest`, `CustomerTest`, `ExportTest`, `RentalLifecycleTest`, etc.

### Known Gotchas

**Enum comparisons in Eloquent collections**
```php
// ✅ Correct - backed enums don't equal strings loosely
$r->status === RentalStatus::Completed
// ❌ Wrong
$r->status === 'completed'
```

**SQLite HAVING on withCount() virtual columns**
`->having('rentals_count', '>', 0)` after `withCount()` crashes in SQLite tests.
Use `->whereHas('rentals', fn($q) => ...)` instead.

**Eager-load nested relations - include FK in select**
`->with('rental:id,reference,vehicle_id,...', 'rental.vehicle:...')` - must include `vehicle_id` in the outer select or the nested relation returns null.

**RentalInspectionFactory is stale** - use `RentalInspection::create([...])` directly in tests.

**customerAnalysisReport uses Cache::remember (300s)**
Tests must call `Cache::flush()` before creating fixture data.

**Float JSON assertions**
`json_encode(0.0)` serializes as integer `0`. Cast when asserting:
```php
expect((float) $response->json('data.pending_payments'))->toBe(0.0);
```

**TLint rejects inline class references**
Add `use App\Models\Foo;` at file top; never `\App\Models\Foo::` inline in test files.

NOTE: dont use block comments formatted with box drawing characters like `//` followed by `──` or `──`+`comment`+`──`. Use `/*...*/` instead.

**PaymentTransactionStatus enum - 5 values**
`Pending`, `Paid`, `Failed`, `UnderReview` (`'under_review'`), `Refunded` (`'refunded'`).
Any match/switch must handle all 5. `UnderReview` = verify failed or amount mismatch; admin resolves via `POST /api/v1/transactions/{tx}/resolve` (requires `transactions.resolve` permission).

**Hubtel callback vs verify API - different field names**
Callback: `Data.Status = "Success"` (payment success). Verify API: `data.status = "Paid"/"Unpaid"/"Refunded"`. Never assume same field works for both.

**payment_transactions uses SoftDeletes**
Never call `->delete()` on PaymentTransaction - financial audit trail must be preserved. Use `->update(['status' => 'superseded'])` to invalidate.

**Monetary columns are decimal(15,2)**
All monetary DB columns widened from decimal(10,2). NGN branches need 9-digit values. Don't regress to 10,2 in new migrations.

**Branch currency_code validated via CurrencyCode enum**
`backend/app/Enums/CurrencyCode.php` - 13 ISO 4217 codes. Adding a new supported currency = add it to the enum first.
---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)


## Worktree Workflow

<!-- - For each task or sprint, create a new git worktree in the `/worktrees` directory.
- Use a descriptive name for the worktree and branch, e.g., `sprint-01-tenancy` for Sprint 1 or `task-123-user-auth` for a specific issue or feature.
- Perform all changes in the worktree only. 
- Do not modify the main branch or root working directory directly. All work must be done in the respective worktree to keep changes organized and isolated.
- Keep all work isolated to the worktree until it's ready for review and merging. This allows for cleaner commits, easier reviews, and better organization of work by sprint or task.
- When finished, prepare the branch for review and merging.
- Ask user to either delete the worktree if the task is complete or keep it if there are follow-up tasks related to the same sprint or feature.
- Always ensure that the worktree is properly cleaned up after merging to avoid clutter and confusion in the repository.
- Keep a short status note for each active worktree in session memory or `MEMORY.md` with the branch name, current task, last completed step, and next step so an agent can resume without losing context. -->
- Update that status note after each meaningful milestone, especially before handing work back or switching tasks.
- Make commit messages should be clear and descriptive, following the format: `feat(scope): Short description of the change`. For example: `feat(tenancy): Implement tenancy middleware` or `fix(api): Add post scheduling endpoint` or `refactor(auth): Implement user authentication`. and `[Sprint #]: short description of the change`. For example: `[Sprint 1] Implement tenancy middleware` or `[Sprint 3] Add post scheduling endpoint` or `[Task 123] Implement user authentication` for only when merging into the main branch. You can also use conventional commit format if preferred, such as `feat(scope): Implement tenancy middleware` for the merging if user agrees.
- Don't co-author commits with agents. only use user's name in commits. Agents should not be listed as co-authors to maintain clarity on human contributions.
