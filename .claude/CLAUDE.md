# Team Notes - Swiftflitz Car Rental Management System

This file documents architectural decisions and team conventions for contributors.

---

## Notification Channels

The system supports three notification channels: **Email**, **WhatsApp**, and **SMS**.

### Common Pattern (Adapter Architecture)

All channels follow the same pattern:
```
NotificationChannelInterface
    <- WhatsAppChannel (Meta Cloud API)
    <- SmsChannel (delegates to provider adapters)

SmsProviderInterface
    <- TwilioSmsAdapter
    <- ArkesselSmsAdapter
    <- NaloSmsAdapter
```

**Service bindings are contextual** (not flat) in `ServiceClassServiceProvider.php`:
- `WhatsAppNotificationService` injects `WhatsAppChannel` **directly** (not via interface) - needed to access `sendTemplate()`
- `SmsNotificationService` receives `SmsChannel` for `NotificationChannelInterface` (still via interface)

This avoids conflicts when both services depend on the same interface.

### Two-Tier Toggle System

For each channel, **two** checks must pass before a notification sends:

1. **Per-channel settings** (`WhatsAppSettings` / `SmsSettings`) - `send_{type}` booleans
2. **System-wide settings** (`NotificationSystemSettings`) - `{channel}_{type}` booleans

Both must be `true` for `shouldSend()` to return `true`.

### Delivery Mode Priority (both channels)

`test_mode` > `notify_customers=false` (skip) > `admin_only_mode` > normal recipient

### Adding a New Notification Type

1. Add `send_{type}` boolean to `WhatsAppSettings` + `SmsSettings` (with settings migration)
2. Add `{type}`, `email_{type}`, `whatsapp_{type}`, `sms_{type}` booleans to `NotificationSystemSettings` (with settings migration)
3. Add mapping in `NotificationService::resolveSettingKey()` `$map` array
4. Create `Event`, `Listener`, and `Job` classes following the existing pattern
5. Register event->listener in `EventServiceProvider`
6. Fire the event from the relevant service method
7. Add `notify{Type}()` method to both `WhatsAppNotificationService` + `SmsNotificationService` and their interfaces
8. Add seed record to `WhatsAppTemplateSeeder` + `SmsTemplateSeeder`
9. Add Mail class + Blade view under `resources/views/emails/`
10. Add toggle rows to `NotificationSettings.tsx` (frontend) + update `notification.types.ts`
11. Register scheduled jobs in `routes/console.php` if applicable

### Notification Event -> Listener -> Job Pipeline (added 2026-04-13)

All new notification types follow this pattern:
```
Service fires Event -> Listener dispatches Job -> Job handles all channels
```

**Branch-aware recipient resolution** (used in all airport/chauffeur jobs):
```php
$branchManagerIds = $booking->branch
    ? $booking->branch->managers()->pluck('users.id')->toArray()
    : [];
$globalAdminIds = User::whereHas('roles', fn($q) => $q->whereIn('name', ['super_admin', 'admin']))->pluck('id')->toArray();
$staffIds = collect(array_merge($branchManagerIds, $globalAdminIds))->unique()->values()->all();
```
- Branch managers receive only their branch's notifications
- Super admins and admins always receive all notifications regardless of branch

### Implemented Notification Types (as of 2026-04-13)

| Type | Email | In-App | WhatsApp | SMS |
|------|-------|--------|----------|-----|
| new_booking | - | - | - | - |
| rental_cancelled | - | - | - | - |
| pickup_reminder | - | - | - | - |
| return_reminder | - | - | - | - |
| overdue_alert | - | - | - | - |
| payment_confirmation | - | - | - | - |
| rental_status_change | - | - | - | - |
| admin_new_booking | - | - | - | - |
| airport_booking | - | - | - | - |
| airport_booking_cancelled | - | - | - | - |
| airport_booking_status_changed | - | - | - | - |
| chauffeur_booking | - | - | - | - |
| chauffeur_booking_cancelled | - | - | - | - |
| chauffeur_booking_status_changed | - | - | - | - |
| chauffeur_pickup_reminder | - | - | - | - |
| driver_document_expiry | - | - | - | - |
| vehicle_expiry | - | - | - | - |

### In-App Notification Navigation (action_url)

All notification jobs include `action_url` in the `data` payload passed to `NotificationService::send()`. This enables one-click navigation from the notification dropdown and notification detail page:
- Rental jobs -> `/management/rentals/{id}`
- Airport jobs -> `/management/airport-transfer/bookings/{id}`
- Chauffeur jobs -> `/management/chauffeur-rental/bookings/{id}`
- Payment confirmation -> type-aware: resolves to the correct booking detail URL based on `transactable_type`

The `Header.tsx` dropdown uses `n.action_url` directly; `NotificationDetail.tsx` renders a "View Details ->" button when present.

### Scheduled Notification Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `SendPickupReminderJob` | daily 07:00 | Rental pickups tomorrow |
| `SendChauffeurPickupReminderJob` | daily 07:00 | Chauffeur pickups tomorrow |
| `SendDueReturnReminders` | daily 08:00 | Rental returns tomorrow |
| `CheckVehicleExpiryJob` | daily 09:00 | Vehicle document expiry (30-day window) |
| `CheckDriverDocumentExpiryJob` | daily 09:15 | Driver license/ID expiry (30-day window) |

---

## WhatsApp Template System (added 2026-04-13)

WhatsApp API v25.0 requires **template messages** for all business-initiated outbound messages. Templates must be registered and approved in Meta WhatsApp Manager before use.

### How it works

- `WhatsAppChannel::sendTemplate(string $to, string $templateName, string $languageCode, array $bodyParams)` - sends a template message. Positional params map to `{{1}}`, `{{2}}` etc. in the Meta template body.
- `WhatsAppTemplateService` (interface: `WhatsAppTemplateServiceInterface`) - loads templates from DB (cached 5 min), resolves named variables to positional param array.
- DB table: `whatsapp_templates` - stores `key`, `template_name`, `header`, `body`, `footer`, `variables` (ordered JSON array), plus `default_*` mirrors.

**Critical:** Laravel auto-converts `WhatsAppTemplate` model name to `whats_app_templates`. The model must explicitly set `protected $table = 'whatsapp_templates'`.

### Template variables

The `variables` column is an ordered JSON array: `["customer_name", "booking_reference", "vehicle_name"]`. This maps `{{1}}` -> `customer_name`, `{{2}}` -> `booking_reference`, etc. at send time. The template body registered in Meta must use positional format `{{1}}`, `{{2}}`.

### Test endpoint

`POST /api/v1/settings/whatsapp/test` uses the pre-approved `hello_world` template (no body params). All tests mock `WhatsAppChannel::sendTemplate()`, not `send()`.

### Admin UI

Settings > WhatsApp Templates (`/management/settings/whatsapp-templates`) - permission: `settings.edit_whatsapp_templates` (super_admin + admin only, not manager).

### CRUD API

`GET/PUT/POST /api/v1/whatsapp-templates/{key}` - cache key `whatsapp_template:{key}` is cleared on update/reset.

---

## SMS Template System (added 2026-04-13)

SMS templates use **named variables** (e.g., `{{customer_name}}`) - no Meta approval needed.

- `SmsTemplateService` (interface: `SmsTemplateServiceInterface`) - `render(SmsTemplate, array)` does str_replace of `{{token}}` tokens.
- DB table: `sms_templates` - stores `key`, `body`, `default_body`.
- `SmsNotificationService` now uses `SmsTemplateService` for all `notify*()` methods.

### Admin UI

Settings > SMS Templates (`/management/settings/sms-templates`) - permission: `settings.edit_sms_templates` (super_admin + admin, separate from `edit_sms`).

### CRUD API

`GET/PUT/POST /api/v1/sms-templates/{key}` - cache key `sms_template:{key}` cleared on update/reset.

### Credential masking

The credential mask is **16 bullet characters** `••••••••••••••••` - not 8. Tests must use exactly 16 bullets when testing the mask-skip logic.

---

## SMS Integration (added 2026-04-12)

### Provider Configuration

| Provider | Credentials in DB | Method | Base URL |
|---|---|---|---|
| Twilio | `twilio_account_sid`, `twilio_auth_token`, `twilio_from_number` | POST | Derived from account_sid |
| Arkessel | `arkessel_api_key`, `arkessel_sender_id` | POST | `ARKESEL_BASE_URL` in `.env` |
| Nalo | `nalo_api_key`, `nalo_sender_id` | GET (query params) | `NALO_BASE_URL` in `.env` |

Default provider is selected via `SmsSettings->default_provider` in the admin UI at `/management/settings/sms`.

Sensitive credentials are masked on GET responses: `arkessel_api_key`, `twilio_auth_token`, `nalo_api_key`. The mask `••••••••` is skipped on save so real values are not overwritten.

### Provider API Details

- **Twilio** - POST `https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json`, Basic auth, fields: `To`, `Body`, `From`
- **Arkessel (V2)** - POST `{base_url}/sms/send`, `api-key` header, JSON body: `sender`, `message`, `recipients[]`. Response: JSON `{"status":"success"}`
- **Nalo** - GET `{base_url}/send-message/`, query params: `key`, `source`, `destination`, `message`, `type=0`, `dlr=1`. Response: plain text `1701|...` (`1701` = success)

### Required .env Variables

```
ARKESEL_BASE_URL=https://sms.arkesel.com/api/v2
NALO_BASE_URL=https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo
```

Config keys in `services.php`: `services.sms.arkesel_base_url`, `services.sms.nalo_base_url`

---

## WhatsApp Integration (Channel + Webhooks)

Meta Cloud API. Webhook routes in `routes/v1/api.php` (public group, no auth, no CSRF):
- `GET /api/v1/webhooks/whatsapp` - hub verification
- `POST /api/v1/webhooks/whatsapp` - incoming messages (HMAC-SHA256 verified)

### Credentials - all in DB (WhatsAppSettings)

`access_token`, `phone_number_id`, `business_account_id`, `app_secret`, `webhook_verify_token`.

- `app_secret` - Meta App Secret (found in Meta App > Settings > Basic). Used to verify HMAC-SHA256 signatures on incoming webhook payloads. Different from `access_token` (which is for sending).
- `webhook_verify_token` - Token you choose, set in Meta > WhatsApp > Configuration > Webhooks for hub verification.
- Both configurable from admin dashboard (Settings > WhatsApp > API Credentials). `app_secret` is masked on GET.
- **DB-first, env fallback**: controller reads `$settings->app_secret ?: config('services.whatsapp.app_secret')`. Env vars (`WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`) still work as fallback.

### Webhook payload parsing

`WhatsAppWebhookController::handle()` parses full Meta Cloud API v25.0 payload:
- Only processes `object === 'whatsapp_business_account'` (silently acks others)
- Iterates `entry[] -> changes[] -> value` for `field=messages`
- Logs incoming messages (from, type, text.body) and delivery status updates (sent/delivered/read/failed)

---

## Settings Architecture

Settings use `spatie/laravel-settings` stored in the DB:
- `backend/app/Settings/` - all settings classes
- `backend/database/settings/` - settings migrations (run with `php artisan settings:migrate`)
- Settings are grouped (e.g., `SmsSettings::group()` returns `'sms'`)

---

## Frontend Conventions

- API endpoints: `frontend/src/shared/api/endpoints.ts`
- Routes: `frontend/src/shared/routes/index.ts`
- Permissions: `frontend/src/shared/config/permissions.ts`
- Sidebar nav: `frontend/src/admin/constants/sideBarItems.tsx`
- Settings hooks: `frontend/src/shared/hooks/queries/useSettings.ts`
- Settings service: `frontend/src/services/settingsService.ts`
- Template hooks: `frontend/src/shared/hooks/queries/useWhatsAppTemplates.ts`, `useSmsTemplates.ts`, `useEmailTemplates.ts`
- Template services: `frontend/src/services/whatsappTemplateService.ts`, `smsTemplateService.ts`, `emailTemplateService.ts`
- Template types: `frontend/src/shared/types/whatsapp-template.types.ts`, `sms-template.types.ts`, `email-template.types.ts`

---

## Test Baseline

0 pre-existing failures. 984 tests pass total (as of 2026-04-28). Frontend: 263 Vitest tests.

---

## Seeder Interactive Prompts (added 2026-04-28)

`DatabaseSeeder.php` uses Laravel Prompts for a three-level interactive flow:
1. "Proceed with database seeding?" (default: true)
2. "Run ALL seeders without prompting?" (default: false)
3. Per-seeder "Run [Label]?" (default: true) - only shown when runAll=false

In non-interactive/CI mode, prompts use their defaults and all seeders run as before.

### Production Guards

All dev-data seeders use `confirm()` instead of silent `return`:
```php
if (app()->isProduction()) {
    warning('[SeederName] seeds development data...');
    if (!confirm('[SeederName] - Run in production?', default: false)) {
        $this->command->warn('[SeederName] skipped.');
        return;
    }
}
```
In production CI (non-interactive), defaults to false (skip). Operators can answer yes to override.

### Unguarded Seeders (safe in prod - no interactive guard)
PermissionsSeeder, RolesSeeder, RolePermissionSeeder, NotificationSettingSeeder, CategorySeeder, FeatureSeeder, EmailTemplateSeeder, WhatsAppTemplateSeeder, SmsTemplateSeeder

### Adding a New Seeder with Dev Data
1. Add `use function Laravel\Prompts\confirm; use function Laravel\Prompts\warning;`
2. Apply the production guard pattern above at the top of `run()`
3. Add it to `DatabaseSeeder.php`'s `$seeders` array with a readable label

---

## Damage Payment Link - purpose=damage (added 2026-04-20)

`RentalService::sendDamagePaymentLink()` appends `purpose=damage` to the payment URL.

`PaymentService::resolvePayableAmount(type, id, purpose)` accepts optional `purpose`:
- When `purpose='damage'` for rental: returns only `damage_balance_due ?? estimated_repair_cost` (not the combined rental+damage formula).

`MarkTransactableAsPaid` listener checks `$transaction->metadata['purpose'] === 'damage'`:
- Sets `damage_balance_due = null`, `damage_settlement_status = 'settled'`
- Tags transaction type as `DamageCharge`
- Does NOT update `amount_paid` or `payment_status` (damage payment is separate from rental balance)

Frontend `PaymentPage.tsx`:
- Reads `purpose` from URL params
- Passes `purpose` in `getPayableAmount` query, callback URL, and payment initiate `metadata`
- Shows "Damage / Repair Cost" label and generic settled message on success

## Online Damage Payment - No Duplicate Transaction (updated 2026-05-01)

`PaymentService::initiate()` damage path (purpose=damage):
- Looks for an existing pending `RepairCost` transaction for the rental
- If found: **updates** it with the payment `reference`, `provider_reference`, payer info, and metadata - does NOT create a new `PaymentTransaction`
- If not found (edge case): falls back to creating a new `PaymentTransaction` as usual
- This prevents a spurious "Payment - Pending" row appearing beside the RepairCost estimate in history during payment initiation

`MarkTransactableAsPaid` listener, damage path:
- When `purpose === 'damage'`, wraps in `DB::transaction()`, tries to delete pending RepairCost (query filters `status=pending` so it won't match the now-paid transaction), then tags the transaction as `DamageCharge`.
- The transaction (the one on the `PaymentStatusUpdated` event) must NOT be deleted - doing so causes `ModelNotFoundException` in the queued broadcast job because `SerializesModels` tries to refetch it.
- Airport/chauffeur online payments also wrapped in `DB::transaction()` and tagged `FullPayment` when type is `null` or the default `Payment`.

## Report Pages - StatCard Component (added 2026-04-21)

`ReportPageLayout` exports a `StatCard` component for consistent summary metric display across all report pages:
- Signature: `StatCard({ label, value, color?, colClass? })`
- Renders `border-start border-4 border-{color}` card with `shadow-sm`
- All report pages use `StatCard` for stat rows; all `<Card>` wrappers use `border-0 shadow-sm`; all `Card.Header` use `bg-white border-bottom`

## Test Notifications Use DB Templates (added 2026-04-20)

`SettingsController::testSms()` - injects `SmsTemplateServiceInterface`, looks up template by key, renders with sample data (falls back to embedded string when no DB template).

`SettingsController::testWhatsApp()` - injects `WhatsAppTemplateServiceInterface`, calls `getTemplate()` + `resolveParams()`. When DB template exists, uses `$dbTemplate->template_name` for Meta API call.

---

## Damage & Repair Transaction Recording (added 2026-04-14)

`TransactionType` enum now includes:
- `DamageCharge` (`damage_charge`) - recorded when damage is settled (forfeited or direct settled) or damage balance collected
- `RepairCost` (`repair_cost`) - recorded when estimated repair cost is updated via `recordRepairCost()`

Methods that create transactions:
- `RentalService::recordRepairCost()` - creates `RepairCost` with `estimated_repair_cost`, **status=pending** (estimate, not yet confirmed)
- `RentalService::settleDamage()` - finds the pending `RepairCost` transaction and updates it with `actual_repair_cost`, marks it `status=paid`. Falls back to creating a new `DamageCharge` only if no pending RepairCost exists.
- `RentalService::collectDamageBalance()` - creates `DamageCharge` with `damage_balance_due`

Repair cost lifecycle: `pending` (estimated) → `paid` (actual, on settle). This means a single transaction tracks the repair from estimate to settlement.

References use `DMG-` prefix (vs `MAN-` for manual payments).

### Transaction Query Auto-Refresh

All mutations in `useRentals.ts` that create transactions now invalidate `transactionKeys.all`:
- `useProcessPickup`, `useProcessReturn`, `useSettleRental`, `useSettleDamage`, `useRecordRepairCost`, `useCollectDamageBalance`, `useSettleWithDeposit`

This means the `TransactionHistorySection` in RentalDetail refreshes instantly on any payment or damage action.

### Pagination & per_page

`TransactionController::index()` reads `per_page` from the request (default 20). `TransactionHistorySection` in RentalDetail requests 15 per page. `TransactionsList` page requests 20 per page.

See `CLAUDE.md` (project root) for full known gotchas.

---

## Dashboard & Transaction Finance (added 2026-04-14)

### Revenue Source

Dashboard `this_month` revenue comes from `PaymentTransaction` (status=paid, paid_at in month), NOT from `Rental.total_cost`. This represents actual collected cash.

`pending_payments` still uses `Rental` model (sum of total_cost - amount_paid for active/confirmed/overdue).

Revenue trend (monthly/daily) also uses `PaymentTransaction.paid_at`.

### Branch Scoping

`DashboardService::getStats(User $user)` and all supporting repository methods accept `$branchIds[]`:
- Empty array = global (super_admin/admin)
- Non-empty = filter by branch_id

Repository methods added to RentalRepository, AirportBookingRepository, ChauffeurBookingRepository:
- `countByStatuses(array $statuses, array $branchIds): int`
- `countInPeriod(from, to, excludeStatus, branchIds): int`

`PaymentTransactionRepository::summaryStats()` also branch-scoped (non-admin sees only their branch totals in stats API).

`PaymentTransactionRepositoryInterface::revenueInPeriod(from, to, branchIds): float` for period revenue.

### Partial Payment Transactions

`RentalService::processPickup()` and `processReturn()` now call `recordManualTransaction()` when `amount_paid > 0` in the request, ensuring every partial payment recorded at pickup/return appears in the PaymentTransaction ledger.

`PaymentTransactionSeeder` creates transaction records for all seeded rentals with `amount_paid > 0`.

### Status Tag Formatting

`formatStatus(value: string | null | undefined): string` added to `frontend/src/shared/libs/utils.ts`. Converts `partially_paid` -> `Partially Paid`, handles null safely (returns `-`). Use this everywhere status/enum values are displayed as text instead of inline `.replace()`.

---

## Notification System - Known Gotchas

### Mail Configuration
`MAIL_MAILER=log` in `.env` is intentional for safety. `EmailServiceProvider` overrides it at runtime using `EmailSettings` from the DB (currently Mailtrap sandbox SMTP). Do not change `.env` directly - configure via Settings > Email in admin panel.

### Queue Worker Required
Notifications are dispatched to the `database` queue. A queue worker must be running:
```bash
php artisan queue:work --queue=email,high,default
```
Without a running worker, no emails, WhatsApp, or SMS notifications will be sent.

### RentalService Event Dispatches (fixed 2026-04-13)
`RentalService` must fire lifecycle events at the end of each state transition:
- `RentalCreated` - `create()`
- `RentalPickedUp` + `RentalStatusChanged` - `processPickup()`
- `RentalReturned` + `RentalStatusChanged` - `processReturn()`
- `RentalCompleted` + `RentalStatusChanged` - `approveReturn()`
- `RentalStatusChanged` - `confirm()`

### Email View Variables
Admin notification emails pass `$admin` (type `User`) as the recipient variable name - not `$recipient`. Views must use `{{ $admin->name }}`.
Airport/Chauffeur admin emails use `$recipient` (matched to their Mail class constructors).

### Reverb (Real-time)
In-app notifications broadcast via Reverb. Reverb server must be running: `php artisan reverb:start`.
Credentials are in `.env` (REVERB_APP_ID, REVERB_APP_KEY, REVERB_APP_SECRET).

### In-App Notifications Not Appearing? (2026-04-14)

If users don't see real-time in-app notifications:

1. **Verify Reverb server is running**
   ```bash
   php artisan reverb:start
   # Should show: "Reverb WebSocket server started on ws://localhost:8080"
   ```

2. **Verify queue worker is running**
   ```bash
   php artisan queue:work --queue=email,high,default
   # Without this, NO notifications (email/SMS/in-app) are sent
   ```

3. **Frontend must be rebuilt** to pick up Reverb env variables
   ```bash
   npm run dev
   # or for production
   npm run build
   ```

4. **Check browser console** for Echo connection errors
   - If you see "You must pass your app key when you instantiate Pusher", frontend wasn't rebuilt
   - If ws:// connection fails, Reverb server isn't running

5. **Fixed issues (2026-04-14)**
   - NotificationSetting model now has all 9 notification types (rental_cancelled, airport_booking, etc.)
   - Database migration added 18 missing columns to notification_settings table
   - All 7 broadcasting tests passing; system is correctly configured

6. **Fixed: Broadcasting auth 419 CSRF bug (root cause of in-app notifications not arriving)**
   - `Broadcast::routes()` in `routes/v1/api.php` defaulted to `web` middleware which includes CSRF
   - Echo/Pusher POSTs to `/api/v1/broadcasting/auth` without a CSRF token - caused silent 419 failure
   - Fix: `Broadcast::routes(['middleware' => ['auth:sanctum', 'disable-activitylog']])`
   - Always override the default middleware when calling `Broadcast::routes()` inside an API route group

7. **Fixed: NotificationCreatedEvent jobs failing when broadcaster is down (added feat/offline)**
   - `NotificationService::send()` used `broadcast(new NotificationCreatedEvent(...))` - synchronous call blocked HTTP thread up to 30s when Reverb/Pusher unreachable
   - Fix: dispatches `BroadcastNotificationJob` instead - custom job with `$tries = 1`, calls `$broadcaster->broadcast(...)` directly (not facade) so try/catch captures outage errors, swallows with `Log::warning`
   - Direct `Broadcaster::broadcast()` call is critical: `broadcast()` facade re-queues a `BroadcastEvent` job that would escape the try/catch
   - Driver-agnostic: works with Reverb, Pusher, or any future broadcaster configured in `config/broadcasting.php`
   - Also added `connect_timeout: 3` / `timeout: 5` Guzzle options in `config/broadcasting.php` `reverb.client_options`
   - No `SerializesModels` on job - payload is primitives only (string userId + array notification)
   - Notification data is always persisted to DB before the broadcast attempt - no data loss on Reverb failure

---

## Frontend UI Conventions (added 2026-04-14)

### Date & Time Inputs
**Never use native `<input type="date">` or `<input type="time">`.**
Always use:
- `DatePickerField` from `@adminComponents/DatePickerField`
- `TimePickerField` from `@adminComponents/TimePickerField`

With react-hook-form `register()`, swap to `Controller`:
```tsx
<Controller
  name="my_date"
  control={control}
  render={({ field }) => (
    <DatePickerField value={field.value ?? ''} onChange={field.onChange} />
  )}
/>
```

### Select Input Height
Global CSS in `frontend/src/admin/assets/index.css` gives all `.form-select` a consistent `height: 2.9rem` (matching normal inputs). Do not add inline height styles.

### Dark Mode Conventions
- Theme attribute on `<body>`: `data-theme-version="dark"`
- Select inputs handled globally via CSS in `index.css`
- Custom inline-styled elements: add a CSS class, then override with `[data-theme-version="dark"] .my-class { ... !important }` in `index.css`
- `!important` beats inline `style` props

### Header Hover Card
`.header-profile .profile-detail` uses `z-index: 9999` in `index.css` to always appear above page content (Bootstrap cards, modals backdrop, etc.).

---

## Report System (added 2026-04-14)

### Revenue Report Source of Truth

`ReportService::revenueReport()` uses `PaymentTransaction` (status=paid, paid_at in period) for `total_revenue` and chart data - **not** `Rental.total_cost`. This aligns with the dashboard metric.

- `total_revenue` / `paid_revenue` = sum of paid transactions in the period (by `paid_at`)
- `pending_payments` = outstanding balance from non-cancelled Rentals (pickup in period)
- `total_rentals` = count of non-cancelled Rentals with pickup in period
- `chart` = daily collected cash grouped by `paid_at` date

### Branch Filtering

All report endpoints accept an optional `branch_id` query parameter (`ReportFilterRequest` validates it). Each report method applies branch scoping:
- Revenue: `whereHasMorph` on transactable's `branch_id`
- Vehicles: vehicle query + rental sub-queries filtered by `branch_id`
- Manager performance, outstanding payments, customer analysis: Rental `branch_id` filter
- Vehicle expenses: `whereHas('vehicle', ...)` checking `branch_id`

### Morph Map Aliases (critical for tests)

Morph map: `'rental'`, `'airport_booking'`, `'chauffeur_booking'`. When creating `PaymentTransaction` fixtures in tests, always use the alias:
```php
'transactable_type' => 'rental'   /* correct */
'transactable_type' => Rental::class  /* wrong - whereHasMorph won't match */
```

### Revenue Report chart_period (added 2026-04-27)

`ReportFilterRequest` accepts an optional `chart_period` parameter (`in:daily,weekly,monthly,yearly`).

`ReportService::revenueReport()` reads `$filters['chart_period'] ?? 'daily'` and groups the chart data:
- `daily` - groups by `toDateString()` (default, existing behavior)
- `weekly` - groups by `startOfWeek()->toDateString()`, label = `W{weekNum} MMM`
- `monthly` - groups by `format('Y-m')`, label = `M Y`
- `yearly` - groups by `format('Y')`, label = `Y`

Each chart row now includes a `period_label` field for frontend display.

Frontend `RevenueReport.tsx` has Daily/Weekly/Monthly/Yearly toggle buttons (ButtonGroup, matching Dashboard pattern). Passes `chart_period` in filters to the hook. Chart shows `period_label ?? date` on x-axis.

---

## Dashboard Revenue Trend - Smart Start Date (added 2026-04-27)

`DashboardService` trend methods (`getMonthlyRevenueTrend`, `getWeeklyRevenueTrend`, `getDailyRevenueTrend`) now:
- Query the earliest `paid_at` from `PaymentTransaction` (status=paid)
- Return `[]` if no transactions exist (frontend shows "No revenue data available")
- Start from first transaction's period (not an arbitrary fixed lookback)
- Cap: monthly=24 months, weekly=24 weeks, daily=90 days

---

## Dashboard Revenue Trend - Single Query Pattern (added 2026-04-29)

`DashboardService` trend methods (`getWeeklyRevenueTrend`, `getMonthlyRevenueTrend`, `getDailyRevenueTrend`) each use a **single DB query** - never N+1 loops. The pattern:
1. Query `firstPaidAt` from `PaymentTransaction`
2. Build the period range (`$start` to `$end`)
3. Fetch all transactions in range: `->select(['paid_at', 'amount'])->get()`
4. Group in PHP by period key using Carbon
5. Map weeks/months/days array against grouped results (zero-fill missing periods)

Never use `->first()` inside a collection `->map()` loop for DB aggregations - use a single fetch + PHP grouping instead.

`max(Carbon1, Carbon2)` is replaced with explicit `$a->greaterThan($b) ? $a : $b` comparisons.

---

## CI/CD Deploy-to-Staging Pipeline (added 2026-04-29)

**File**: `.github/workflows/deploy-staging.yml`

**Trigger**: Push to `development` branch with `[to staging]` in the commit message.

**What it does**:
- Builds frontend (`npm ci && npm run build`) - takes `frontend/dist/` only
- Builds backend (`composer install --no-dev --optimize-autoloader`)
- Force-pushes built artifacts to the `staging` branch:
  - `staging/frontend/` = Vite dist contents only (no source)
  - `staging/backend/` = Laravel app + vendor (excludes `.env`, `*.md`, `node_modules/`, runtime storage dirs)
- Root-level `.gitignore` on staging ignores runtime files
- Commits are tagged `[skip ci]` to prevent recursive triggers

---

## Revenue Snapshots - DB-Backed Trend Cache (added 2026-04-30)

Dashboard revenue trend charts now read from the `revenue_snapshots` table instead of running live aggregate queries. This eliminates the "weekly trend never loads" issue.

**Table:** `revenue_snapshots` - columns: `period_type` (daily/weekly/monthly/yearly), `period_key` (date string), `period_label`, `revenue`, `transaction_count`, `calculated_at`. Unique index on `(period_type, period_key)`.

**Job:** `RecalculateRevenueSnapshotsJob` - runs every 30 minutes, fetches all paid non-refund transactions in a single query, groups by all 4 period types in PHP, upserts in chunks of 100.

**DashboardService:** `getMonthlyRevenueTrend()`, `getDailyRevenueTrend()`, `getWeeklyRevenueTrend()` all query the snapshot table first. If empty (first boot), they fall back to live calculation and dispatch `RecalculateRevenueSnapshotsJob::dispatch()` as a bootstrap.

## ApexCharts Tooltip Convention (added 2026-04-30)

All ApexCharts tooltips must include `fillSeriesColor: false` to prevent the series color from being used as the tooltip background (causes unreadable colored-text-on-colored-background). Also always set `theme: 'light'` and `style: { fontFamily: 'inherit' }`.

All charts must include `chart: { foreColor: '#6b7280' }` for readable axis labels. Donut chart legends must include `labels: { colors: '#374151' }`.

## Revenue Report - period_note (added 2026-04-30)

`ReportService::revenueReport()` returns a `period_note` field explaining that gross/outstanding use rental pickup_date while collected/refunded use transaction paid_at. The frontend shows this as a hoverable info badge above the stat cards. `average_per_rental` uses `collected_revenue / total_rentals` (not net_revenue).

---

## Test Baseline

0 pre-existing failures. 1204 backend / 313 frontend tests pass (as of payment-channel-normalization 2026-05-06).

## Payment Channel Normalization - Pass-Through Pattern (added 2026-05-06)

Payment `channel` values from providers are stored as-is when not in the known map. Never drop unknown values to null.

**Backend rule - adapters and service methods:**
- `PaystackAdapter::verify()` + `buildVerifyResultFromPaystackWebhook()`: `default => $rawChannel ?: null` (not `default => null`)
- `resolvePaymentChannel()` in Rental/Airport/ChauffeurBookingService: `default => $method ? strtolower(trim($method)) : null`
- HubtelAdapter already does this correctly - never change it

**Known normalized values:** `momo`, `card`, `cash`, `bank_transfer`, `online`
**Null-channel transactions** are grouped as `'manual'` in `channelBreakdown()` - correct by design.

**Frontend rule - always use `formatChannelLabel()` / `getChannelVariant()`:**
- Both exported from `frontend/src/shared/types/transaction.types.ts`
- `formatChannelLabel(channel)`: checks label map first, then title-cases underscore strings, returns `-` for null
- `getChannelVariant(channel)`: Bootstrap variant lookup, falls back to `'secondary'`
- Never use `CHANNEL_LABELS[x] ?? 'Unknown'` directly - use `formatChannelLabel(x)` instead
- `TransactionChannel` union includes `'manual'`; all label/variant/color maps include `manual: 'Manual Payment'`

## RentalPolicy VIEW_PERMISSIONS (updated fix/payment-hook)

`RentalPolicy::VIEW_PERMISSIONS` includes all permissions that grant list/detail access - not just `view_all`/`view_own`. Staff with manage-level permissions can access the rental list:

```php
private const VIEW_PERMISSIONS = [
    'rentals.view_all',
    'rentals.view_own',
    'rentals.view_quotes',
    'rentals.manage_pending_bookings',
    'rentals.manage_active',
    'rentals.manage_overdue',
];
```

This allows staff to access Pending Bookings, Active Rentals, Overdue Rentals, and Quote Requests sidebar routes without 403.

## Notification Recipient Resolution - Permission-Based (updated fix/payment-hook)

All `resolveStaffIds()` methods in notification jobs are PERMISSION-BASED and BRANCH-SCOPED. Pattern:

```php
// Branch users with the relevant view permission
$branchUserIds = $booking->branch_id
    ? User::whereHas('permissions', fn($q) => $q->whereIn('name', $permissions))
        ->whereHas('branches', fn($q) => $q->where('branches.id', $booking->branch_id))
        ->pluck('id')->toArray()
    : [];

// Global users (no branch) with view_all = cross-branch visibility
$globalUserIds = User::whereHas('permissions', fn($q) => $q->where('name', 'X.view_all'))
    ->whereDoesntHave('branches')
    ->pluck('id')->toArray();
```

Permission strings by domain:
- Rental: `rentals.view_all`, `rentals.view_own`
- Airport: `airport_transfer.view_all`, `airport_transfer.manage_bookings`, `airport_transfer.manage_active`
- Chauffeur: `chauffeur_rental.view_all`, `chauffeur_rental.manage_bookings`

Rental jobs also include `$rental->manager_id` (assigned manager always notified).

## Branch ID - Tables with branch_id (updated fix/payment-hook)

Tables WITH branch_id: rentals, airport_bookings, chauffeur_bookings, payment_transactions, vehicles, fleet_vehicles, rental_locations, chauffeur_locations, airport_locations, additional_charges, discount_rules, quote_requests, drivers, vehicle_expenses, airport_packages, rental_inspections.

`PaymentTransaction::$fillable` includes `branch_id`.

## Hubtel Webhook - Dual-Path Update (added feat/offline)

Hubtel's Transaction Status Check API requires IP whitelisting. If the server IP is not whitelisted, `verify()` returns 403/timeout silently and the DB is never updated.

**Fix:** `PaymentService::handleWebhook()` now uses a two-step approach for Hubtel:
1. Build a `PaymentVerifyResult` from the callback payload (primary notification per Hubtel docs)
2. Always call `verify()` (mandatory per Hubtel docs)
3. Use `verify()` result when available; fall back to webhook payload result when `verify()` fails

**Action required for new deployments:** Submit server public IPs to Hubtel Retail Systems Engineer for whitelisting. Max 4 IPs per service.

Helper method: `PaymentService::buildVerifyResultFromHubtelWebhook(Request)` extracts status, channel (momo/card), and paymentPhone from callback payload.

## CarbonImmutable - Type Hint Convention (added feat/offline)

`now()` in this Laravel 12 environment returns `Carbon\CarbonImmutable`, not `Carbon\Carbon`. These are sibling classes (not parent/child). Always use `CarbonInterface` in type hints for closure parameters that receive Carbon instances - never `Carbon` alone.

Affected files: `CalculateDailyReportStatsJob`, `CalculateMonthlyReportStatsJob`, `CalculateYearlyReportStatsJob`.

## Broadcasting - Payment Channel (added feat/offline)

`useEcho` from `@laravel/echo-react` defaults to private channels (`visibility = "private"`). For the customer-facing payment pending page, use `useEchoPublic` instead - it uses `Echo.channel()` (no auth required, works for unauthenticated customers).

`PaymentStatusUpdated` event broadcasts on public `Channel("payment.{reference}")` which matches `useEchoPublic`.

## Skeleton Loaders - Complete Coverage (added feat/new-rental phase 2)

All admin pages now use skeleton loaders instead of full-page spinners. New skeleton component added:
- `frontend/src/admin/components/skeletons/TemplateListSkeleton.tsx` - 2-column card grid for template list pages

Use `<SettingsFormSkeleton />` for settings/form pages, `<TemplateListSkeleton />` for template list pages, `<DetailPageSkeleton />` for detail pages, `<ReportSkeleton />` for report pages, `<ChartSkeleton />` inside chart card bodies, `<SkeletonFormRows />` / `<SkeletonTableRows />` for inline loading states within existing card structures. Never use `<Spinner animation="border">` for page-level loading.

## Cross-Invalidation Pattern for Embedded Data (added feat/new-rental)

When a mutation changes data that is embedded in another entity's API response (e.g. `rental.customer.profile_status`), the mutation's `onSuccess` must cross-invalidate the embedding entity's full query key family.

Example: `useVerifyCustomer` (`useCustomers.ts`) invalidates `rentalKeys.all` because rental detail responses embed the customer's `profile_status`. Without this, the "Profile Incomplete" badge on the rental page stays stale after customer verification.

---

## Report Pages - Frontend Conventions (added 2026-04-27)

All report stat cards must use the `StatCard` component from `ReportPageLayout.tsx` (not inline Card HTML).

All currency formatting in report pages must use `useFormatCurrency` hook from `@/shared/hooks/queries/useSettings` (not the bare `formatCurrency` util from `@/shared/libs/utils`) - the hook respects the app's configured currency symbol.

---

## Payment Pending Page - DB Status Endpoint + Real-Time Fix (added fix/payment-hook)

### Root Cause
`PaymentService::verify()` always called the external Hubtel Status Check API, which requires IP whitelisting. Without whitelist, polling returned `pending` indefinitely, timed out at 90s, and showed false failure even when webhook had already marked the transaction `paid` in DB.

### Fixes

**`PaymentService::verify()` DB short-circuit:**
- Before calling adapter, checks if transaction is already `paid`/`failed` in DB
- Returns immediately without external API call if so
- If webhook arrives before user, initial verify() call returns `paid` directly (no pending_confirmation needed)

**New `GET /api/v1/payments/status/{reference}` (public):**
- `PaymentService::getStatus()` reads only from DB, never calls external API
- Used by frontend for polling (safe to call every 15s)

**Frontend `PaymentPage.tsx`:**
- Polling: uses `getStatus()` (DB-only) instead of `verify()` (Hubtel API)
- Polling interval: 15s, runs indefinitely - no timeout-to-failed (Sprint J)
- Callback handler: any `pending` verify result shows `pending_confirmation` (not cancelled) - Paystack abandoned correctly maps to `failed`, so `pending` always means genuine processing
- `pending_confirmation` UI: "Booking Received!" (indigo, `fas fa-paper-plane`) - positive state, no countdown timer. Includes email info panel, "Track Your Rental" green button (`/track/{bookingRef}`), "Return to Home" grey button. Echo listener upgrades to full success when `CheckPendingHubtelPaymentsJob` resolves and fires `PaymentStatusUpdated`.
- Countdown timer: removed entirely (Sprint J). Timeout-to-failed is removed - explicit `failed` from DB still shows failed state.

**Paystack vs Hubtel:**
- Paystack: `abandoned` -> `failed` in adapter; verify() always returns definitive status; rarely enters pending_confirmation
- Hubtel: redirects user with `?status=success`; Status Check API needs IP whitelist; webhook is primary notification (no whitelist needed)
- `CheckPendingHubtelPaymentsJob`: runs every 5 min, calls verify() on stale pending Hubtel transactions, fires `PaymentStatusUpdated` when resolved - frontend Echo catches this broadcast

---

## Hubtel Webhook - Under Review Flow (added feat/dual-currency)

`PaymentTransactionStatus` enum now has 5 values: `Pending`, `Paid`, `Failed`, `Refunded`, `UnderReview`.

**When verify() fails (IP not whitelisted) OR amount mismatch detected:**
- Transaction set to `under_review` instead of auto-marking paid
- `SendUnderReviewNotificationJob` dispatched - notifies users with `transactions.resolve` or `transactions.view_all` permission
- Returns 200 to Hubtel (prevents retry loop)

**Hubtel status mapping (verify API):** `"Paid"` → Paid, `"Refunded"` → Refunded, `"Unpaid"` → Failed. Previously `Refunded`/`Unpaid` both mapped to `Pending` indefinitely - fixed.

**Hubtel callback vs verify:** Callback uses `Data.Status = "Success"` for payment success; verify API uses `data.status = "Paid"`. `buildVerifyResultFromHubtelWebhook()` maps `"Success"` → paid (not `"Paid"`).

**Amount validation:** Before marking paid, asserts `abs($result->amount - $transaction->amount) < 0.01`. Mismatch → `under_review`.

**Manual resolution:** `POST /api/v1/transactions/{transaction}/resolve`
- Permission: `transactions.resolve` (super_admin + admin only)
- Body: `{ action: "approve"|"reject", notes?: string }`
- `approve` → status `paid`, fires `PaymentStatusUpdated` (triggers full downstream: rental update + customer notifications)
- `reject` → status `failed`, fires `PaymentStatusUpdated`
- Notes written to `metadata` for audit trail

## Payment Transaction - New Columns (added feat/dual-currency)

`payment_transactions` table now has:
- `gateway_amount decimal(15,2) nullable` - actual GHS amount sent to Hubtel (before conversion back)
- `gateway_currency varchar(10) nullable` - always `'GHS'` for Hubtel transactions
- `deleted_at` (soft deletes) - financial records must not be hard-deleted
- Indexes: `(status, paid_at)`, `(branch_id, status, paid_at)`, unique `(provider, provider_reference)`

All monetary columns across rentals/bookings/transactions widened to `decimal(15,2)` (was `decimal(10,2)`) to support high-value currencies like NGN.

## CurrencyCode Enum (added feat/dual-currency)

`App\Enums\CurrencyCode` at `backend/app/Enums/CurrencyCode.php`. Supported codes: GHS, USD, EUR, GBP, NGN, ZAR, KES, ZMW, XOF, XAF, RWF, UGX, TZS.

Branch `currency` field validated against `CurrencyCode::values()` in both `StoreBranchRequest` and `UpdateBranchRequest`. Use `CurrencyCode::values()` for any future ISO 4217 validation.

## resolveProfileComplete - Returns Structured Array (added feat/dual-currency)

`PaymentController::resolveProfileComplete()` now returns `array{complete: bool, error_code: string|null}` instead of `bool`.

`payableAmount` response includes `profile_error_code` field (string or null) alongside `customer_profile_complete` (bool, backward-compatible).

Error codes: `PROFILE_LICENSE_EXPIRED` when `license_expiry_date` is in the past.

## Frontend Date Formatting - Intl.DateTimeFormat (added feat/dual-currency)

`formatDate`, `formatTime`, `formatDateTime` in `frontend/src/shared/libs/utils.ts` use `Intl.DateTimeFormat` (date-fns removed from this file).

New `useFormatDate()` hook in `frontend/src/shared/hooks/queries/useSettings.ts` - reads app timezone from `GeneralSettings`, returns `{ formatDate, formatTime }` with timezone applied. Use the hook in components (like `useFormatCurrency`), use bare utils only in non-component contexts.

## Payment Security - under_review Status (added feat/dual-currency)

`PaymentTransactionStatus` has two new values: `UnderReview = 'under_review'`, `Refunded = 'refunded'`.

When Hubtel webhook arrives and `verify()` fails (403/timeout - IP not whitelisted) OR amount mismatch detected (`abs($result->amount - $transaction->amount) > 0.01`): transaction moves to `under_review` instead of auto-marking paid. `SendUnderReviewNotificationJob` dispatches on `high` queue to notify admins.

Admin resolution: `POST /api/v1/transactions/{transaction}/resolve` - body `{ action: 'approve'|'reject', notes?: string }`. Requires `transactions.resolve` permission (super_admin + admin only). `approve` fires `PaymentStatusUpdated` event (same downstream as real webhook).

Hubtel verify() status mapping (per official docs, Transaction Status Check API):
- `"Paid"` → `PaymentTransactionStatus::Paid`
- `"Refunded"` → `PaymentTransactionStatus::Refunded`
- `"Unpaid"` → `PaymentTransactionStatus::Failed`
- anything else → `PaymentTransactionStatus::Pending`

Callback payload uses `Data.Status = "Success"` (not "Paid") - `buildVerifyResultFromHubtelWebhook()` maps this correctly.

## Payment Throttle Rates (added feat/dual-currency)

- `payments/webhook/{provider}` - 30/min per IP
- `payments/status/{reference}` - 30/min per IP
- `payments/verify/{reference}` - 6/min per IP
- `payments/payable-amount` - 20/min per IP

## Currency & DB Standards (added feat/dual-currency)

`CurrencyCode` enum at `backend/app/Enums/CurrencyCode.php` - 13 ISO 4217 codes (GHS, USD, EUR, GBP, NGN, ZAR, KES, ZMW, XOF, XAF, RWF, UGX, TZS). Branch `currency` field validated via `Rule::in(CurrencyCode::values())`.

Monetary columns widened to `decimal(15,2)` across rentals/bookings/payment_transactions (was `decimal(10,2)` - overflows for NGN branches with ₦100m+ values).

`payment_transactions` has soft deletes (`SoftDeletes` trait). Use `->update(['status' => 'superseded'])` not `->delete()` for financial record invalidation.

`gateway_amount` + `gateway_currency` columns on `payment_transactions` - stores the exact GHS amount sent to Hubtel for reconciliation (set in `PaymentService::initiate()` when `requiresGhsConversion()`).

Composite indexes on `payment_transactions`: `(status, paid_at)`, `(branch_id, status, paid_at)`, unique `(provider, provider_reference)`.

## Dual-Currency Standards - Fixed (added feat/dual-currency comprehensive crosscheck)

**PaymentService::initiate() always stores exchange_rate**
- Global-currency branches now get `exchange_rate = 1.0` (not null). Every transaction is self-describing.
- Old null-rate transactions are treated as global-currency (no conversion) in PHP aggregations.

**PaymentTransactionRepository - FX-aware aggregation (no raw SQL)**
- `summaryStats()`, `trendSeries()`, `channelBreakdown()`, `revenueInPeriod()` use PHP-level `toGlobal()` helper when scope is global (`$branchIds` empty).
- `toGlobal()`: `exchange_rate > 0 ? amount * rate : amount` (null rate = was global, pass-through).
- Branch-scoped paths keep `->sum('amount')` (amounts homogeneous within one branch).

**PaymentTransactionResource - no live branch rate fallback**
- `currency_symbol` and `exchange_rate` only return stored values. Old null records render null (frontend global formatter handles). Do NOT re-add `$this->branch->exchange_rate` fallback.
- `gateway_amount` and `gateway_currency` are now exposed on the resource.

**Public VehicleController - addon currency conversion**
- `show()` applies `CurrencyHelper::convertFromGlobal()` for addons with `branch_id === null` (global charges stored in GHS). Branch-specific addons pass through unchanged.

**SendBookingConfirmationJob - now permission+branch scoped**
- Was role-based (SUPER_ADMIN/ADMIN/MANAGER), no branch_id scope → all managers received all notifications.
- Now uses `resolveStaffIds()` same as sibling jobs: permissions `rentals.view_all`/`rentals.view_own` + branch scope + global-user (`whereDoesntHave('branches')`) path.

**Payment page NGN vs GHS - correct by design, not a bug**
- Order summary shows branch currency (e.g. NGN 1024). Paystack popup shows GHS equivalent (8.40) because Paystack requires GHS settlement. Both legs stored on `payment_transactions` (`amount`/`currency` vs `gateway_amount`/`gateway_currency`).

**dashboard.view permission - all 6 roles have it**
- `dashboard` private Echo channel auth uses `hasPermissionTo('dashboard.view')`. All roles (super_admin, admin, manager, staff, accountant, viewer) have this via `config/swiftflitz.php`. WS payment invalidation works for all staff.

## Test Baseline (feat/dual-currency comprehensive crosscheck)

1069 backend / 279 frontend tests passing.

## FX Currency Display Conventions (added feat/dual-currency FX audit)

### useCurrency() vs generalSettings symbol

`useCurrency()` returns the ISO code (e.g. "GHS"), NOT the display symbol ("₵"). For currency symbol fallbacks in vehicle dropdowns and branchSymbol derivations, always use `generalSettings?.data?.currency_symbol ?? '₵'` as the final fallback, NOT `useCurrency()`.

### PricingService currency resolution

`PricingService` uses the VEHICLE's branch (not the booking/form branch) for currency. `CurrencyHelper::resolveForBranch()` requires ALL 4 conditions: branch exists + currency != null + currency differs from global + exchange_rate != null. If any is missing - falls back to global (GHS). For an NGN-priced rental, the VEHICLE must be in an NGN branch with all 4 fields set.

### SwitchVehicleModal / ExtendRentalModal pattern

These modals use `rental.currency_symbol ?? '₵'` for all current-rental values, and `selectedVehicle?.branch?.currency_symbol ?? rentalSymbol` for new-vehicle estimates. Uses `formatWithSymbol` from `@/shared/libs/currency`, not `useFormatCurrency()`.

### Per-entity currency display

- Vehicle rate columns (CategoryDetail, FilteredVehicleTables): use `vehicle.branch?.currency_symbol` with `formatWithSymbol`; fallback to global formatter for unassigned vehicles
- Additional charges amount column: use `charge.currency_symbol` (from `AdditionalChargeResource`); no global hook needed
- `RentalLocationResource`: branch sub-object now includes `currency_symbol` and `exchange_rate`
- Public rental location endpoints: include `currency_symbol` in pickup/dropoff response maps

## Test Baseline (feat/dual-currency FX audit)

1072 backend / 279 frontend tests passing.

## Branch-Location Filtering (added feat/dual-currency location sprint)

CreateRental.tsx and NewBooking.tsx pass `filter[branch_id]` to `useRentalLocations` when a branch is selected. Location fields are cleared via `useEffect` whenever `watchedBranchId` changes. Backend `AllowedFilter::exact('branch_id')` in `RentalLocationRepository` was already in place - no backend change needed.

LOS (Lagos/NGN) branch now has two seeded locations: "Lagos Main Office - Ikeja" (default, ₦5000 charge) and "Lagos Airport - MMIA" (₦8000 charge).

## TransactionStatus - Full Enum Coverage (added feat/dual-currency location sprint)

Frontend `TransactionStatus` type now includes all 5 values: `pending | paid | failed | under_review | refunded`. All `STATUS_VARIANT` maps (TransactionDetail, TransactionsList, RentalDetail, AirportBookingDetail, ChauffeurBookingDetail) handle all 5. `TRANSACTION_STATUS_LABELS` exported from `transaction.types.ts`.

`under_review` = amber/warning. `refunded` = info/blue.

## Dual Display Guard - exchange_rate !== 1 (added feat/dual-currency location sprint)

All `showConverted`/`showDual` checks now require `exchange_rate !== 1` in addition to `!!(exchange_rate)`. GHS-currency branches store `exchange_rate = 1.0` (by design from earlier fix) which was triggering `₵666 / ₵666` dual display. The guard prevents this. Only branches with exchange_rate > 1 (foreign currency) trigger dual display.

Affected: TransactionDetail, RentalDetail.TransactionHistorySection, AirportBookingDetail, ChauffeurBookingDetail.

## Channel Breakdown - null channel = 'manual' (added feat/dual-currency location sprint)

`PaymentTransactionRepository::channelBreakdown()` groups null-channel transactions as `'manual'` (was `'other'`). `TransactionChannelBreakdown.channel` type updated to `TransactionChannel | 'manual'`.

## Airport Booking Transaction Recording (fixed feat/dual-currency location sprint)

`AirportBookingService::create()` was not creating a `PaymentTransaction` for in-store payments. Fixed by adding `createInitialPaymentTransaction(AirportBooking, AirportBookingData)` private method - called after `createBooking()` when `$isInStorePayment === true`. Records `TransactionType::FullPayment`, `status=Paid`, morph alias `'airport_booking'`. Mirrors the `recordPayment()` pattern.

Public website bookings (no `payment_method`) correctly remain Pending and flow through the payment gateway - no transaction at create time.

## Chauffeur Create - Branch Vehicle Filter + Search (added feat/dual-currency location sprint)

`CreateChauffeurBooking.tsx` now watches `branch_id` and filters `branchVehicles` by `v.branch_id === watchedBranchId`. A `useEffect` clears `vehicle_id` when branch changes. The plain `<Form.Select>` for vehicle was replaced with `@headlessui/react Combobox` - same pattern as `CreateRental.tsx`. Search filters on `make + model + license_plate`. Fleet vehicle display: `year make model (plate)`.

## Notification Job Branch Scoping - All Jobs Fixed (feat/dual-currency crosscheck)

All 6 previously role-based notification jobs now use permission+branch `resolveStaffIds()` pattern:

| Job | Permission(s) | Branch field |
|-----|--------------|--------------|
| `SendPickupReminderJob` | `rentals.view_all`, `rentals.view_own` | `rental->branch_id` + `manager_id` |
| `SendPaymentConfirmationJob` | domain-based (rental/airport/chauffeur) | `transaction->branch_id` |
| `SendUnderReviewNotificationJob` | `transactions.resolve`, `transactions.view_all` | `transaction->branch_id` |
| `SendQuoteConfirmationJob` | `rentals.view_quotes`, `rentals.view_all` | `quoteRequest->branch_id` |
| `SendVehicleExpiryNotificationJob` | `vehicles.view_all`, `vehicles.manage_insurance` | `vehicle->branch_id` |
| `CheckDriverDocumentExpiryJob` | `drivers.view_all` | `driver->branch_id` (per-driver loop) |

`RoleEnum` import removed from all 6. Tests: `tests/Feature/Jobs/NotificationBranchScopeTest.php` (6 cases).

## VAT Gate - vat_enabled Respected in All Pricing Services (feat/dual-currency crosscheck)

`RentalService` already checked `$this->rentalSettings->vat_enabled`. `AirportPricingService` and `ChauffeurPricingService` were NOT checking it - VAT was always applied regardless of the toggle.

Fixed: both services now gate `$vatRate` on `$this->rentalSettings->vat_enabled`. When disabled, `$vatRate = 0.0` and `$vatAmount = 0.0`. Airport-specific per-airport `vat_rate` override still respected when `vat_enabled = true`.

Tests that assert VAT is applied now explicitly `$settings->vat_enabled = true; $settings->save();` before asserting.

## BranchSeeder Lagos exchange_rate

`database/seeders/BranchSeeder.php` Lagos Branch now includes `'exchange_rate' => 0.085`.

## Hubtel Webhook Security Model (confirmed globalstandard audit)

Hubtel does NOT provide HMAC/signature headers on webhook callbacks (unlike Paystack which uses X-Paystack-Signature + HMAC-SHA512). Their security model is merchant-side:
1. Unique `clientReference` per transaction (TXN- + random 12 chars) - already implemented
2. Always call verify() via Transaction Status Check API before marking paid - already implemented
3. Rate limiting on webhook endpoint (30/min) - already implemented
4. Replay protection via `status === Paid` early return - already implemented

Do NOT add HMAC verification to `HubtelAdapter::handleWebhook()` - Hubtel doesn't send it.

## PaymentService Security Guards (added globalstandard Batch 2)

`handleWebhook()` now logs:
- `Log::warning('Payment webhook rejected: invalid signature or payload', [provider, ip, payload_hash])` on invalid webhooks
- `Log::info('Payment webhook processed', [provider, reference, status])` on success

Amount mismatch check (`abs($result->amount - $expectedAmount) > 0.01`) now applies to ALL providers, not just Hubtel. Mismatch -> `under_review` + `SendUnderReviewNotificationJob`.

`initiate()` exchange rate guard: throws `InvalidArgumentException` + `Log::error` when `$exchangeRate <= 0 || $exchangeRate > 100_000`. Upper bound 100,000 is generous enough for all real currencies (NGN ~0.085, USD ~15).

## Test Baseline (globalstandard Batch 2)

1088 backend / 281 frontend tests passing.

## PaymentController IDOR Fix - Permissions-Based (added globalstandard Batches 1,3,5)

`PaymentController::resolveAndAuthorizeTransactable()` uses `$this->authorize('view', $transactable)` for authenticated staff. Unauthenticated callers (customers on public payment pages) pass through - UUID unpredictability is the access control. Payment routes are public (no auth middleware). System is permissions-based, not role-based - never use `hasRole('customer')` for payment ownership checks.

## Token Expiry - Frontend (added globalstandard Batches 1,3,5)

`tokenManager.getToken()` checks `auth_token_expires_at` localStorage key. If past expiry, clears token and returns null. `auth_token_expires_at` is set by `authService.ts` login handler from `response.data.expires_at` (ISO8601, returned by backend). `removeToken()` also clears this key.

`tokenManager.isImpersonating()` enforces 60-min TTL matching backend `expiresAt: now()->addMinutes(60)`. Expired session auto-calls `stopImpersonation()` and returns false. `impersonation_started_at` stored on start, cleared on stop.

## Password Reset - Sanctum Token Revocation (added globalstandard Batches 1,3,5)

`AuthService::resetPassword()` calls `$user->tokens()->delete()` after `$user->save()`. Revokes all existing Sanctum tokens so stolen sessions become invalid after password change. Laravel's `Password::reset()` already handles single-use reset token deletion.

## DOMPurify - Terms/Privacy Content (added globalstandard Batches 1,3,5)

Both `frontend/src/website/pages/terms/sections/ContentSection.tsx` and `.../privacy/sections/ContentSection.tsx` sanitize HTML via `DOMPurify.sanitize()` before passing to `dangerouslySetInnerHTML`. Package: `dompurify` + `@types/dompurify`.

## Zod Runtime Validation - Auth + Payment (added globalstandard Batches 1,3,5)

`frontend/src/shared/libs/schemas/auth.schemas.ts` - `LoginResponseSchema` validates login response.
`frontend/src/shared/libs/schemas/payment.schemas.ts` - `PaymentInitiateResponseSchema` validates initiate response.
Both use `safeParse` with `console.warn` on mismatch - graceful degradation, never throws.

## Test Baseline (globalstandard Batches 1, 3, 5)

1102 backend / 289 frontend tests passing.

## Comprehensive Test & Build Verification (2026-04-27 - pilotimplement audit)

**Verified Production-Ready Status**:
- Backend: 1102/1102 tests passing (100%), 2465 assertions, 156.12s runtime, 0 failures
- Frontend: 289/289 tests passing (100%), 17 test files, 26.91s runtime, 0 failures
- TypeScript: 0 errors, strict mode compliance verified
- Frontend Build: Vite success (57.83s), 1873 modules transformed, PWA + 15 SSG routes, no errors
- Branch: feat/dual-currency - no regressions detected

**Test Coverage by Domain**:
- Payment: Initiation, webhooks, verify, under_review, FX conversion, all providers
- Booking: Airport + chauffeur creation, payment recording, currency snapshot
- Rental: Full lifecycle, damage handling, repair cost transactions, currency handling
- Currency: FX conversion, dual-display, branch scoping, global fallback
- Authorization: Policies, permissions-based recipient resolution, IDOR prevention
- Notifications: All 9 jobs (permission+branch scoped), event-listener pipeline
- Reports: FX-aware aggregation, per-row currency display, branch scoping
- Frontend: Components, hooks, routes, permissions, utilities, payment validation

**Pre-Existing Baseline**: Clean checkout ~29 pre-existing failures; current branch 0 failures detected

**Recommendation**: Codebase is production-ready for deployment. No breaking changes, 100% backward compatible, all security audits passed (globalstandard batches 1-5 complete).

## DatePicker Admin CSS Location (added 2026-05-01)

Admin pages load CSS from `frontend/src/admin/assets/index.css` (via DashboardLayout.tsx) and `frontend/src/admin/assets/css/style.css`. They do NOT import `frontend/src/shared/styles/custom.css`. DatePicker color rules must be in `admin/assets/index.css` to apply on admin pages. The `custom.css` file is only loaded by WebsiteShell and AuthLayout.

## PaymentTransactionRepository FX - Always Apply toGlobal() (added 2026-05-01)

`revenueInPeriod()`, `summaryStats()`, and `revenueReport()` now ALWAYS apply PHP-level `toGlobal()` FX conversion regardless of whether `$branchIds` is empty or not. Previously only the global scope (empty array) applied FX. When a Manager selects "All Branches", the controller resolves to their assigned branch IDs (non-empty), so raw sum() was returning unconverted NGN amounts as if GHS. The `toGlobal()` helper handles exchange_rate=1 correctly (pass-through for GHS branches).

## Hubtel payment_phone Field (added 2026-05-01)

`HubtelAdapter.verify()` previously mapped `data.externalTransactionId` to `paymentPhone`. Fixed to use `data.CustomerPhoneNumber ?? data.PaymentDetails.MobileMoneyNumber`. The `externalTransactionId` is a Hubtel internal reference number, NOT the customer's phone.

## useNotificationListener Guard (added 2026-05-01)

`useNotificationListener()` in `useNotifications.ts` now guards against subscribing before user is loaded: uses `userId ? \`notifications.${userId}\` : '__none__'`. The `useNotifications()` query also has `refetchInterval: 1000 * 30` as polling fallback when Echo/Reverb push is missed.

## CI/CD Staging - Any Branch (added 2026-05-01)

`.github/workflows/deploy-staging.yml` `on:` block no longer filters to `development` branch. Any branch push or merged PR with `[to staging]` in the commit message / PR title / PR body triggers the staging deploy.

## Branch Assignment - Empty Array Allowed (added 2026-05-01)

`UserController::assignBranches()` previously validated `branch_ids` as `required`. Removed `required` - empty array is now valid (removes all branch assignments). Same fix in `AssignManagersRequest`.

## Test Baseline (2026-05-01 multi-fix sprint)

1115 backend / 289 frontend tests passing.

---

## Notification Recipient Groups - Three-Toggle System (added notification-overhaul session)

All notification channels now support THREE recipient group toggles instead of one `notify_admins` toggle:

| Toggle | Setting Class | Meaning |
|--------|--------------|---------|
| `notify_customers` | WhatsApp/SMS/Email | Customer receives notifications |
| `notify_branch_managers` | WhatsApp/SMS/Email/NotificationSystem (inapp_) | Users assigned to the rental's branch |
| `notify_admins` | WhatsApp/SMS/Email/NotificationSystem (inapp_) | Global super_admin/admin without branch assignment |

**IMPORTANT:** `NotificationSystemSettings` has `inapp_notify_branch_managers` and `inapp_notify_admins` only. There is NO `inapp_notify_customers` - in-app notifications are staff-only (customers cannot sign in).

### resolveStaffIds() Split Return Shape

All notification jobs call `resolveStaffIds()` which now returns:
```php
['branch_managers' => int[], 'admins' => int[]]
```

Dedupe rule: if a user appears in both lists (branch assignment + global permission), they go to `branch_managers` only.

Per-channel gating pattern in each job:
```php
$ids = $this->resolveStaffIds($branchId, $permissions, $globalPermission);
$bmIds    = ($settings->notify_branch_managers ?? true) ? $ids['branch_managers'] : [];
$adminIds = ($settings->notify_admins ?? true)          ? $ids['admins'] : [];
$staffIds = array_unique([...$bmIds, ...$adminIds]);
```

### Assigned Manager Always Notified

`SendOverdueAlertJob` and `SendReturnReminderJob`: `$rental->manager_id` is ALWAYS prepended to recipients before toggle gating (directly responsible, unconditional):
```php
$unconditional = $rental->manager_id ? [$rental->manager_id] : [];
$staffIds = array_unique([...$unconditional, ...$bmIds, ...$adminIds]);
```

### EmailSettings - Admin Per-Type Booleans

`EmailSettings` now has full parity with WhatsApp/SMS: 3 recipient toggles + 12 `send_admin_*` booleans. Settings migrations use `$this->migrator->add('email.send_admin_new_booking', true)` pattern with default `true` for backward compatibility.

---

## Invoice Email Feature (added notification-overhaul session)

`RentalInvoiceMail` (queued, `queue='email'`) generates a PDF via DomPDF and attaches it.

- PDF Blade: `resources/views/pdf/rental-invoice.blade.php`
- Email Blade: `resources/views/emails/rental-invoice.blade.php`
- Service: `RentalService::sendInvoiceToCustomer(Rental $rental, ?string $note = null): void`
  - Throws `InvalidArgumentException` when customer has no email
  - Loads `customer, vehicle.branch, paymentTransactions` relations
- Endpoint: `POST /api/v1/rentals/{rental}/send-invoice` (permission: `rentals.manage_active`)
- Frontend: `useSendInvoice()` mutation hook in `useRentals.ts`
- UI: "Send to Customer" button in `InvoiceReceipt.tsx` triggers `useConfirm` modal before sending; button hidden when `!rental.customer?.email`

---

## Email Media Queries Layout (added notification-overhaul session)

`resources/views/emails/layout.blade.php` includes a `<style>` block with `@media only screen and (max-width: 600px)` rules for `.email-container`, `.email-body-cell`, `.stack-column`, `.mobile-full-width`, `.mobile-hide`, `.mobile-font-sm`, `img`, `.btn-cta`. Do NOT remove existing inline styles - they are Outlook fallbacks. Media queries are mobile enhancement only.

---

## Test Baseline (notification-overhaul session)

1147 backend / 306 frontend tests passing.

---

## Impersonation Stop - Permanent Fix (updated, do NOT revert)

Three interconnected pieces that must stay in sync:

**1. `Header.tsx::handleStopImpersonation()`** - correct sequence:
```typescript
tokenManager.stopImpersonation();              // restore admin token FIRST
sessionStorage.setItem('swiftflitz:stop_impersonation', '1');
await persistor.purge();                       // nuke ALL persisted Redux state
window.location.href = ROUTES.DASHBOARD.USERS.ROOT;
```
Do NOT call `dispatch(clearAuth())` here. Do NOT use `persistor.flush()`. Use `purge`.

**2. `useQueryAuth.ts::useCurrentUser()`** - enabled must check token only:
```typescript
enabled: !!tokenManager.getToken()   // NOT authService.isAuthenticated()
```
`authService.isAuthenticated()` checks BOTH token AND Redux `isAuthenticated`. After `clearAuth()` Redux is false → query never re-fires → user stays logged out forever.

**3. `ProtectedRoute.tsx`** - must show skeleton during initial auth check:
```typescript
if (isVerifying && !!tokenManager.getToken()) return <AppBootSkeleton />;
if (!isAuthenticated) return <Navigate to={fallbackRoute} ... />;
```
`isVerifying` = TanStack Query `isLoading` (true only on first fetch, not background refetch). Without this, ProtectedRoute redirects to login during the brief window between page load and the `/api/v1/auth/me` response.

**Why this works:** On reload after impersonation stop: Redux initializes empty (purged), token is restored, `useCurrentUser` fires (token exists), fetches admin user, `setAuth(adminUser)` runs. ProtectedRoute shows skeleton until that completes, then shows the page with correct admin permissions. No 403, no logout.

## Error Pages - CSS Import Required (added sonnetplan session)

`Error403.tsx`, `Error404.tsx`, `Error500.tsx`, `Error503.tsx` import admin CSS directly:
```typescript
import '@adminAssets/index.css';
import '@adminAssets/css/style.css';
```
Without this, styles are lost on browser refresh (CSS only loads inside DashboardLayout otherwise).

## Rental Edit - Date Lock on Confirmed/Active/Overdue (added 2026-05-05)

`UpdateRentalRequest::areDatesLocked()` checks `$this->route('rental')->status` against `[Confirmed, Active, Overdue]`. When locked, `pickup_date`, `pickup_time`, `return_date`, `return_time` rules become `['prohibited']` and the time-window `withValidator` check is skipped entirely.

Frontend `EditRentalModal.tsx`: `datesLocked = LOCKED_STATUSES.includes(rental.status)`. When true - date/time fields render as `Form.Control plaintext readOnly`, payload omits date keys, and an `Alert variant="info"` explains the lock. Pending (`quote_request`) status allows full date editing.

## Rental Edit - Permission Scope (added sonnetplan session)

`rentals.edit` permission is restricted to `super_admin` and `admin` only (NOT manager/staff).
- Backend: `RentalPolicy::update()` checks `hasPermissionTo('rentals.edit')`
- Frontend: "Edit Details" button in `RentalDetail.tsx` wrapped in `PermissionGuard` with `PERMISSIONS.RENTALS.EDIT`
- Modal: `EditRentalModal.tsx` - editable fields: dates, times, source, locations, notes (NOT vehicle/customer/pricing)

## Email/PDF App Name - Dynamic from GeneralSettings (added sonnetplan session)

Email layouts and PDF templates use `GeneralSettings::site_name` (NOT `config('app.name')`):
```blade
@php
    $settings = app(\App\Settings\GeneralSettings::class);
    $appName = $settings->site_name ?: config('app.name');
@endphp
```
Field name: `site_name` (not `app_name`). Same pattern for PDFs using `$companyName`.
`rental-invoice.blade.php` was already correct - passes `$generalSettings` from Mail class.

## Test Baseline (sonnetplan session)

1163 backend / 306 frontend tests passing.

---

## Permission Query in Notification Jobs - Role-Based Lookup (added TLint+chauffeur session)

All `resolveStaffIds()` methods in notification jobs must use BOTH direct permissions AND role-based permissions. `whereHas('permissions')` alone misses users whose permissions come from a role (e.g. super_admin).

Correct pattern:
```php
User::where(function ($q) use ($permissions): void {
    $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $permissions))
      ->orWhereHas('roles', fn ($q) => $q->whereHas('permissions', fn ($q) => $q->whereIn('name', $permissions)));
})
->whereHas('branches', fn ($q) => $q->where('branches.id', $branchId))
->pluck('id')->toArray();
```

All 18 notification jobs updated to use this pattern. Tests still pass because test users have direct permissions via `givePermissionTo()`.

## FleetVehicle - name Accessor (added TLint+chauffeur session)

`FleetVehicle` has `make` and `model` but no `name` DB column. Added `getNameAttribute()` returning `trim(make . ' ' . model)`. Accessing `$fleetVehicle->name` now returns the display name. Used in chauffeur emails/PDFs.

## Chauffeur Booking Document Flow (updated TLint+chauffeur session)

On booking creation:
- `SendChauffeurBookingDocumentJob::dispatch($booking, $variant, 'driver')` - only sends to driver, not customer
- Customer gets booking confirmation email (`ChauffeurBookingConfirmationMail`) - simple notice, no attachment

On payment confirmation:
- `PaymentConfirmationMail::attachments()` generates receipt PDF (DomPDF) when `transactable_type === 'chauffeur_booking'`
- Uses same data structure as `ChauffeurBookingDocumentMail::buildDocumentData()`

## TLint Configuration (added TLint+chauffeur session)

`backend/.tlint.json` created. Config files excluded from TLint:
```json
{ "preset": "laravel", "disabled": [], "excluded": ["config/database.php", "config/permission.php"] }
```

`config/database.php` still uses `Pdo\Mysql as PdoMysql` (imported) for PHP 8.5 compat guard. `config/permission.php` uses plain `DateInterval` (no leading backslash).

## mirror_mode Semantics (updated TLint+chauffeur session)

`admin_only_mode` and `mirror_mode` are separate but related toggles:
- `admin_only_mode=ON` + `mirror_mode=OFF` → customer traffic redirected to `admin_only_phone_number` only (customer gets nothing)
- `admin_only_mode=ON` + `mirror_mode=ON` → customer gets their message AND `admin_only_phone_number` gets a copy
- `mirror_mode` toggle is only meaningful when `admin_only_mode` is ON
- `resolveRecipient()` returns customer phone when mirror=ON (so customer still gets it)
- `resolveMirrorRecipient()` returns `admin_only_phone_number` when admin_only=ON AND mirror=ON

## Test Baseline (TLint+chauffeur session)

1168 backend / 306 frontend tests passing. 0 TLint warnings.

## Payment Card Info & Phone Storage (added 2026-05-05)

`payment_transactions` now has `card_bin` (6), `card_last4` (4), `card_type` (30) nullable columns.

**Paystack card payments:** `PaystackAdapter.verify()` extracts `data.authorization.bin/last4/card_type`. Phone falls back to `data.customer.phone` for card channel when momo number is absent. Both webhook handler (`buildVerifyResultFromPaystackWebhook`) and verify() follow this pattern.

**Hubtel card/momo phone:** Hubtel's Transaction Status Check API does NOT return `CustomerPhoneNumber` in the verify response. `PaymentService.handleWebhook()` merges `webhookResult.paymentPhone` into the verify result when verify succeeds, so the webhook payload phone is always persisted.

**Hubtel card fields:** Hubtel does not expose card bin/last4 - those columns remain null for Hubtel card payments.

**`PaymentTransactionResource`** exposes `card_bin`, `card_last4`, `card_type`, and computed `card_display` (`BIN***LAST4` or null).

**`TransactionDetail.tsx`** shows a "Card" row when `card_display` or `card_bin` is present.

## Booking Receipt PDF Attachment - Moved to Payment Confirmed (2026-05-05)

`BookingConfirmedMail` no longer attaches a PDF - it sends the booking confirmation email only.

`PaymentConfirmationMail.attachments()`:
- `transactable_type === 'rental'` - generates and attaches `Booking-Receipt-{reference}.pdf` via DomPDF
- `transactable_type === 'chauffeur_booking'` - attaches chauffeur receipt PDF (existing behavior)
- Other types - no attachment

PDF generation is wrapped in try/catch with `Log::warning` fallback so a PDF failure never blocks the confirmation email.

## PDF DomPDF - Avoid HTML Entities for Special Characters (added 2026-05-05)

DomPDF may render `&minus;` (U+2212) as `?` depending on font availability. Use plain `-` (hyphen-minus, ASCII 0x2D) for minus signs in all PDF Blade templates. Same applies to other non-ASCII symbols - prefer ASCII equivalents or verify DejaVu Sans glyph support first.

## Test Baseline (payment phone + card + receipt move - 2026-05-05)

1182 backend / 306 frontend tests passing.

## Rental Edit - Pricing Recalculation on Update (added 2026-05-06)

`RentalService::update()` now recalculates pricing when any of `pickup_date`, `return_date`, `pickup_location_id`, `dropoff_location_id` appear in the update payload.

- Loads `vehicle.category`, `vehicle.branch`, `customer` relations
- Reconstructs addons from `applied_charges_breakdown` (same pattern as `switchVehicle`)
- Runs `PricingService::calculate()` with new/existing dates + locations
- Updates all pricing fields: `rental_days`, `daily_rate`, `base_cost`, `extras_cost`, `location_charge`, `subtotal`, `vat_amount`, `total_cost`, discount fields, `applied_charges_breakdown`
- Also updates `pickup_location`/`dropoff_location` name snapshots when IDs change
- Dates only change for pending rentals (locked by `UpdateRentalRequest` for confirmed+)
- Locations can change for pending AND confirmed rentals

`EditRentalModal.tsx` location dropdowns now show prices: `Name (+₵X.XX)` when `pickup_charge`/`dropoff_charge` > 0.

## Test Baseline (rental edit repricing - 2026-05-06)

1187 backend / 306 frontend tests passing.

---

## Dropoff Charge Display - locationBreakdown Extraction (added 2026-05-06)

`PricingService` returns `locationBreakdown: [{type: 'pickup'|'dropoff', location, amount}]` alongside `locationTotal`.

Frontend pricing preview handlers must extract individual charges from `locationBreakdown`, NOT split `locationTotal`:
```typescript
pickupCharge: p.locationBreakdown?.find((i: { type: string }) => i.type === 'pickup')?.amount ?? p.locationTotal,
dropoffCharge: p.locationBreakdown?.find((i: { type: string }) => i.type === 'dropoff')?.amount ?? 0,
```
Affected files: `VehicleDetail.tsx`, `CreateRental.tsx`, `NewBooking.tsx`.

Admin invoice (`InvoiceReceipt.tsx`) reads `applied_charges_breakdown` filtered by `type === 'location'` - renders each row separately, correct as-is. Backend storage was always correct.

`PricingPreviewResult` interface in `publicQuoteService.ts` must include `locationBreakdown?: Array<{type: string; location: string; amount: number}>`.

## Email Dedup - pending→confirmed Transition (SUPERSEDED by Sprint H 2026-05-23)

**Sprint H removed the pending→confirmed skip.** The skip is no longer in `SendRentalStatusChangedJob`.

### Sprint H notification flow (current)

Website booking created (`source=website`, `payment_status=pending`):
1. `SendBookingConfirmationJob` → `BookingConfirmationMail` with subject "Booking Received - Payment Required" + payment link CTA + Amount Due panel
2. Customer pays → `PaymentConfirmationMail` with receipt PDF
3. Auto-confirm fires `RentalStatusChanged(pending→confirmed)` → `RentalStatusChangedMail` sent (no skip)

In-store / admin booking:
1. `SendBookingConfirmationJob` → `BookingConfirmationMail` with subject "Booking Confirmation" (no payment URL, no amount due)

### BookingConfirmationMail signature (Sprint H)
```php
public function __construct(
    public readonly Rental $rental,
    public readonly ?string $paymentUrl = null,
    public readonly ?float $amountDue = null,
)
```
- `paymentUrl` set → subject "Booking Received - Payment Required ({ref})"
- `paymentUrl` null → subject "Booking Confirmation - {ref}"

### SendBookingConfirmationJob payment URL logic
```php
$needsPaymentLink = $rental->source === RentalSource::Website
    && in_array($rental->payment_status, [RentalPaymentStatus::Pending, RentalPaymentStatus::PartiallyPaid], true);
```
URL: `config('app.frontend_url') . '/payment/rental/{id}?name=...&email=...`

WhatsApp/SMS for pending→confirmed are still NOT skipped (intentional — different channel, lower friction).

## Telescope Payment Tagging (added 2026-05-06)

Payment requests tagged in `TelescopeServiceProvider::setup()` via `Telescope::tag()` callback (canonical location per docs, NOT in PaymentService).

Webhook endpoints get 3 tags: `[provider, 'payment', 'webhook']` (e.g. `['hubtel', 'payment', 'webhook']`).
Other `/payments/` endpoints get `['payment']`.
Only `EntryType::REQUEST` entries are tagged (guard required).

## PDF Symbol Safety - pdfSafeSymbol Pattern (added 2026-05-06)

DomPDF with DejaVu Sans lacks glyphs for:
- `&minus;` (U+2212) - renders as `?`
- Non-ASCII currency symbols: `₵` (U+20B5), `₦` (U+20A6) - render as `?`

Pattern for all PDF Blade templates:
```php
$pdfSafeSymbol = preg_match('/^[\x00-\x7F]+$/', $symbol) ? $symbol : ($rental->currency ?? 'GHS');
```
Then use `{{ $pdfSafeSymbol }}` instead of `{{ $symbol }}`. Use plain `-` instead of `&minus;` for minus signs.

`rental-invoice.blade.php` fixed. `booking-receipt.blade.php` was already safe (uses `GHS` hardcoded).

## Gateway Charges + Customer Amount (added 2026-05-06)

New columns on `payment_transactions`: `gateway_charges decimal(15,2) nullable`, `customer_amount decimal(15,2) nullable`.

**Capture logic by provider:**
- Hubtel verify: `data.charges` = gateway fee; `data.amount` = total customer paid (= amountAfterCharges + charges)
- Paystack verify: `data.fees / 100` = gateway fee; `data.amount / 100` = total customer paid
- Paystack webhook: same as verify (`data.fees` + `data.amount`)
- Hubtel webhook: no charges field; phone merged from webhook into verify result; charges come from verify()

`PaymentVerifyResult` DTO has `public readonly ?float $charges = null`.
`PaymentService::handleWebhook()` paid branch stores both columns when not already set.
Hubtel merge path must pass `charges: $verifyResult->charges` when constructing merged result.

`PaymentTransactionResource` exposes both fields as `float|null`.
`TransactionDetail.tsx` shows "Gateway Charges" (when > 0) and "Amount Paid by Customer" rows using `gateway_currency ?? 'GHS'` prefix.

## Test Baseline (multi-fix sprint - 2026-05-06)

1192 backend / 306 frontend tests passing.

---

## Age-Based Security Deposits (added Sprint C 2026-05-21)

`vehicles` and `vehicle_categories` (actual table: `categories`) both have:
- `young_driver_age_threshold` tinyint nullable
- `young_driver_deposit` decimal(15,2) nullable

**Priority rule:** Vehicle setting overrides category setting (null-coalesce chain).

`PricingService::getDepositAmount(Vehicle, bool $skip, ?int $customerAge = null)`:
- When `$threshold && $youngDeposit && $customerAge !== null && $customerAge < $threshold` → return young deposit
- Otherwise → standard deposit (vehicle → category → global setting → 0.0)

`PricingService::calculate()` auto-derives `$customerAge` from `$customer->date_of_birth` via `Carbon::parse()->age` when `$customerAge` is null.
New `?int $customerAge = null` param sits before `$skipDeposit` — all existing callers unchanged (named args).

Pricing preview (`POST /api/v1/public/vehicles/{id}/pricing-preview`) accepts optional `date_of_birth` — returns age-adjusted deposit to show correct amount before booking confirmation.

## Public Booking DOB + 18+ Gate (added Sprint B 2026-05-21)

`POST /api/v1/public/bookings` (`StoreQuoteRequestRequest`):
- `date_of_birth` nullable, validated `before: now()-18yrs`
- Error message: "You must be 18 or older to rent a vehicle."

`QuoteRequestService::create()` persists DOB to Customer (only if customer has no existing DOB — non-destructive).
`QuoteRequestData` DTO has `dateOfBirth: ?string` property.

Frontend (`VehicleDetail.tsx`): DOB ReactDatePicker with `maxDate=subYears(now,18)`, `showYearDropdown`, `dateFormat="dd/MM/yyyy"`. `differenceInYears` check gates `handleConfirm()`.

## Rental Tracking — Public Endpoint (added Sprint B 2026-05-21)

`GET /api/v1/public/rentals/track/{reference}` — no auth, in public route group.
Controller: `RentalTrackingController::track()` — uses `ApiResponse` trait, returns 404 JSON on miss.
Frontend: `/track` (search) + `/track/:reference` (detail). Both lazy-loaded in `websiteRoutes.tsx`.
"Track Rental" link added to footer quick links and Services nav dropdown (after Airport Transfer).

## Public Rental Settings Endpoint (updated Sprint B 2026-05-21)

`GET /api/v1/public/rental-settings` now returns `min_rental_days` in addition to `pickup_window_start`/`end`.
Frontend uses `min_rental_days` to auto-set return date = pickup_date + min_rental_days when both pickup fields are set.

## Test Baseline (Sprint B & C - 2026-05-21)

## Sprint E - Auto-Confirm, Email Order, T&C (added 2026-05-22)

### E1: Auto-Confirm Rental on Payment (MarkTransactableAsPaid)

At the end of the rental payment path (after `amount_paid` + `payment_status` update, before returning),
`MarkTransactableAsPaid::markRentalPaid()` auto-confirms when:
- `$rental->status === RentalStatus::Pending`
- `$rental->customer->profile_status === CustomerProfileStatus::Verified`

Fires `RentalStatusChanged` event with `oldStatus='pending'`, `newStatus='confirmed'`.
Non-verified customers (Incomplete/PendingReview/Rejected) stay Pending.

### E1b: Cascade Confirm on Customer Verification (CustomerController + RentalService)

`RentalService::confirmPaidPendingForCustomer(Customer)` queries:
- `status = Pending`
- `amount_paid >= total_cost` (whereColumn)
- `total_cost > 0` (unpaid or zero-cost rentals excluded)

Called from `CustomerController::verify()` after updating customer to Verified.
Each qualifying rental fires `RentalStatusChanged`. Returns count confirmed.

### E1c: In-Store Rentals Always Confirm

`RentalService::create()` checks `$data->paymentMethod === 'in_store'` BEFORE the website auto-confirm check.
`StoreRentalRequest` validates `payment_method` as `nullable|string|in:in_store,online`.
`RentalData` DTO has `?string $paymentMethod` property.
Regardless of customer profile status, in-store rentals are immediately Confirmed.

### E4: pending->confirmed Email Skip - KEEP THE SKIP (corrected 2026-05-22)

`SendRentalStatusChangedJob::handle()` skips the customer email when `oldStatus='pending'` AND `newStatus='confirmed'`. WhatsApp/SMS for this transition are NOT skipped.

**Correct notification order:**
1. Booking submitted (Pending) - `BookingConfirmationMail` with T&C PDF + payment link
2. Payment confirmed - `PaymentConfirmationMail` with receipt PDF + pickup-docs disclaimer
3. Auto-confirm (Pending->Confirmed via E1/E1b) - **NO email** (customer already notified via step 2)
4. Other transitions (Confirmed->Active, etc.) - `RentalStatusChangedMail` as normal

Do NOT remove this skip. `EmailDuplicatePreventionTest` enforces it with `assertNotQueued`.

### E2: Pickup-Docs Disclaimer

`resources/views/emails/payment-confirmation.blade.php`: amber warning panel after payment table
containing "driver's license" and "required ID documents at pickup" text.

`SendPaymentConfirmationJob` in-app notification body now includes the pickup-docs reminder text.

### E3: PAID IN FULL Badge - Conditional Logic

`RentalInvoiceMail::content()` passes `'isPaid' => $rental->amount_paid >= $rental->total_cost && $rental->total_cost > 0`.
Badge only appears when fully paid AND total > 0 (excludes zero-cost complimentary rentals).

### E5: T&C Email + PDF on Booking Submit

**Job:** `SendTandCCopyJob::handle()` - resolves TermsSettings::content + GeneralSettings::site_name, sends TermsAndConditionsCopyMail to customer. Returns early if no customer email.
**Dispatcher:** `SendQuoteSubmittedNotification::handle()` already dispatches `SendTandCCopyJob` - no separate listener needed.
**Mail:** `TermsAndConditionsCopyMail` (queued, queue=email) - attaches T&C PDF via DomPDF when `strlen($termsContent) > 0`; returns `[]` otherwise.
**Blade views:** `pdf/terms-and-conditions.blade.php` accepts `$content`, `$appName`, `$generatedAt`; `emails/terms-and-conditions-copy.blade.php` extends layout.

**BookingConfirmationMail::attachments()** - resolves `TermsSettings::content`; skips PDF when empty; injects content + appName + generatedAt into DomPDF view. Wrapped in try/catch + `Log::warning`.

**E1b extracted:** `RentalService::confirmPaidPendingForCustomer(Customer): int` - queries `status=Pending + payment_status=Paid`, confirms each, fires `RentalStatusChanged`. `CustomerController::verify()` delegates to `app(RentalServiceInterface::class)->confirmPaidPendingForCustomer($customer)`.

**E1 atomic lock:** `MarkTransactableAsPaid` uses `Rental::where('id',...)->where('status', Pending)->update(...)` - returns affected rows; only fires `RentalStatusChanged` if `$updated > 0`. Prevents double-confirm from concurrent webhooks.

## Test Baseline (Sprint E Redo - 2026-05-22)

1266 backend / 313 frontend tests passing (+6 vs Sprint E baseline 1260).

---

## Sprint F - Video Uploads, Lightbox, S3 Migration (added 2026-05-22)

### MediaLibraryServiceProvider

Registered in `bootstrap/providers.php`. On `boot()`:
- Guards with `Schema::hasTable('settings')` before reading DB
- Outer try/catch + `Log::warning` prevents fresh-install crash
- When `GeneralSettings::storage_disk === 's3'`: overrides `config('filesystems.default')` and `config('media-library.disk_name')` from `S3Settings`

### Rental Video Uploads

`Rental` model uses `HasMedia` + `InteractsWithMedia`. Two collections: `pickup_video` and `return_video` (mime: mp4/quicktime/webm; no singleFile; no conversions defined directly - thumb via MediaConversion when FFmpeg available).

TUS upload: entity_type `'rental_video'` → `DeferredTusHandler` (deferred token, TTL 2h).
Endpoints: `POST /api/v1/rentals/{rental}/upload-pickup-videos` + `/upload-return-videos` (permission: `rentals.manage_active`).
`RentalResource` exposes `pickup_videos` and `return_videos` (null when empty, not []).

### VideoStreamController

`GET /api/v1/rentals/{rental}/videos/{media}/stream` (permission: `rentals.manage_active`).
- Validates media belongs to rental (pickup_video or return_video collection)
- Returns 410 Gone with `{"message": "Video has been removed"}` when `video_deleted=true`
- Range request: reads `Range: bytes=start-end` header, streams via `readStream`, returns 206
- Response headers: `Accept-Ranges: bytes`, `Content-Range`, `Cache-Control: private, max-age=3600`

### ProcessRentalVideoJob

`public string $queue = 'media'` - long transcoding never blocks `default` queue (emails/notifications).
Takes `int $mediaId` (NOT model - avoids SerializesModels crash).
Uses `pbmedia/laravel-ffmpeg`: H.264, CRF 28, `-movflags +faststart` (enables instant browser buffering).
Entire transcoding block wrapped in try/catch + `Log::warning` (FFmpeg missing → original still served).

### DeleteExpiredRentalVideosJob

Tombstone pattern: does NOT call `clearMediaCollection()`. Instead:
- Deletes video file from disk: `Storage::disk($media->disk)->delete($media->getPathRelativeToRoot())`
- Sets `$media->setCustomProperty('video_deleted', true)` + `$media->save()`
- Thumb conversion (~10-30KB JPG) preserved for visual history
- Uses `RentalStatus::Completed` enum (not 'completed' string) - see CLAUDE.md gotcha
- `updated_at` when `status=Completed` is the 30-day expiry pivot

Scheduled: `routes/console.php` → `Schedule::job(new DeleteExpiredRentalVideosJob)->dailyAt('02:00')->name('rental-videos-cleanup')->onOneServer()`

### MediaLightbox (Frontend)

`frontend/src/admin/components/MediaLightbox.tsx` - wraps `yet-another-react-lightbox` v3 + Video plugin.
Props: `{ open, slides, index?, onClose }`. Slide type: `{ type: 'image'|'video', src, poster?, mimeType? }`.
`InspectionComparisonCard`: photos → image slides; rental.pickup_videos + return_videos → video slides.
Skips `video_deleted=true` items from lightbox; shows greyed thumbnail with "Removed" badge instead.
`RentalDetail`: video gallery with thumbnail; deleted videos show "Removed" overlay toast on click.

### S3 Settings + StorageMigrationJob

`S3Settings.php` (7 fields): `aws_access_key_id`, `aws_secret_access_key`, `aws_default_region`, `aws_bucket`, `aws_url`, `aws_endpoint`, `use_path_style_endpoint`.
Both `aws_access_key_id` and `aws_secret_access_key` masked as `••••••••••••••••` (16 bullets) on GET.

`StorageMigrationJob`: `Media::query()->chunkById(100)` - ALL Media rows (not just videos).
`readStream`/`writeStream` only (never `get()`/`put()` - blows up on large videos).
Updates `media.disk` per row on success. Writes `GeneralSettings::storage_disk = $target` ONLY when `$failures === 0 && $total > 0`. Notifies admins via `Notification::route('mail', $adminEmail)->notify(...)`.

**Critical Auth Pattern - SettingsPolicy::before():**
Never use `$user->hasPermissionTo('settings.edit')` in Form Request `authorize()` for Settings controllers - it bypasses `SettingsPolicy::before()` which grants super_admin access. Use:
- Form Request `authorize()`: return `true`
- Controller: `$this->authorize('updateGeneral', GeneralSettings::class)` → goes through Gate → SettingsPolicy::before() → allows super_admin

**Frontend patterns:**
- `MASKED` + `isMasked()` exported from `useSettings.ts`
- `useS3Settings()` + `useUpdateS3Settings()` (strips masked values before submit)
- `useMigrateStorage()` invalidates `['settings', 'general']` key on success
- `useTestS3Connection()` returns `{ success: bool, error?: string }`

## Test Baseline (Sprint F - 2026-05-22)

1306 backend / 332 frontend tests passing.

---

## Sprint G - Misc Fixes (2026-05-23)

### G0: CreateVehicle Category Race Condition

`CreateVehicle.tsx` useEffect that calls `reset()` to pre-fill edit form had `[vehicle?.id, reset]` deps. When vehicle data arrived before categories loaded, `reset()` ran with no options in the select, leaving it blank.

Fix: add `categories.length` to the dependency array. The comment suppresses `react-hooks/exhaustive-deps` - `categories.length` must be listed manually as it's a derived value.

### G1: Booking-Receipt PDF Shows Blank / Wrong Currency

Two bugs combined:
1. `PaymentConfirmationMail::rentalReceiptAttachment()` was passing raw `$rawSym` (₵/₦) to the PDF data array without the `pdfSafeSymbol` conversion. Non-ASCII symbols render as `?` in DomPDF/DejaVu Sans.
2. `resources/views/pdf/booking-receipt.blade.php` hardcoded `GHS` in all 12 amount cells despite receiving `$currency_symbol` in data.

Fix: Mail class now applies `pdfSafeSymbol` pattern (`preg_match('/^[\x00-\x7F]+$/', $sym) ? $sym : ($rental->currency ?? 'GHS')`). Template now uses `{{ $currency_symbol }}` everywhere.

### G2: Hubtel Idempotency Guard Location

`PaymentService::handleWebhook()` already holds the idempotency guard for ALL providers:
```php
if ($transaction->status === PaymentTransactionStatus::Paid) {
    return true;
}
```
The guard cannot live in `HubtelAdapter::handleWebhook()` because the adapter has no transaction access. Added a Hubtel-specific regression test in `PaymentTest.php`.

## Test Baseline (Sprint G - 2026-05-23)

~1311 backend / 335 frontend tests passing.

---

## New Booking - Simplified Customer Flow + Age Bracket Deposit (2026-05-27)

### Nullable Customer Profile Fields

`customers` table: `address`, `license_number`, `license_expiry_date`, `id_number` are now nullable. `id_type` (enum) required drop+re-add with `nullable()` - `->change()` doesn't support enum modification.

`StoreCustomerRequest` profile fields are all `nullable`. Only `name`, `email`, `phone` are required.
`CustomerData` DTO all profile fields are `?string = null`. `CustomerTest` validates errors for `['name', 'email', 'phone']` only (not profile fields).

### New Booking - Two Customer Detail Modes

`NewBooking.tsx` has a `customerDetailsMode: 'fill' | 'send_link'` toggle (shown only for new customers, not from quote).

- **fill mode**: requires license + ID uploads, creates full customer profile
- **send_link mode**: creates customer with only `name/email/phone`, auto-calls `requestReuploadMutation` after rental creation to email a document upload link; skips doc validation

### Age Bracket Radio for Security Deposit

When `selectedVehicle?.resolved_young_driver_age_threshold != null && !watchedSkipDeposit`:
- Radio: `under` (young driver rate) / `above` (standard rate) / `` (not specified)
- Sends `young_driver: true/false/undefined` in pricing preview
- Stores `young_driver_override: boolean | null` on rental

`Rental.young_driver_override` (bool nullable): `true` = under threshold, `false` = above, `null` = resolved by real DOB.

### Deposit Indicator Badge

Pricing sidebar shows:
- `warning` "Young driver rate (estimated)" when bracket = under
- `success` "Standard rate confirmed" when bracket = above
- `secondary` "Deposit estimated - age not set" when bracket = ''

### Deposit Reconciliation on DOB Fill

`PublicCustomerController::reconcileDepositAfterDob()` - called when customer fills real DOB via document upload link. Finds pending/confirmed rentals with non-null `young_driver_override`, compares actual age vs threshold, updates `security_deposit_amount` on mismatch, appends to `admin_notes`, clears `young_driver_override` to null.

### PricingService::getDepositAmount() - forceYoungDriver Param

New `?bool $forceYoungDriver = null` param (after `$skip`). When non-null, overrides DOB-derived age check. `null` falls back to existing `$customerAge` logic. Threshold chain: vehicle → category → global (same as before).

### VehicleResource - Resolved Threshold Fields

`resolved_young_driver_age_threshold` and `resolved_young_driver_deposit` computed server-side using vehicle → category → global fallback chain (null when not configured anywhere).

### Test Baseline (2026-05-27)

1324 backend / 348 frontend tests passing. 0 failures.
