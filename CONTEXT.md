# Swiftflitz Domain Context

> Living document. Updated inline during grill sessions.
> Do not couple to implementation - only terms meaningful to domain experts.

---

## Bounded Contexts

### 1. Rental
Self-drive car hire. Customer takes custody of vehicle.

### 2. Airport Transfer
Passenger transport to/from an airport. Always driver-operated. Priced via package + area charge.

### 3. Chauffeur Rental
Driver-operated trips (not airport-specific). Priced per trip/duration.

---

## Core Terms

### Vehicle
A rentable asset managed by the company. Has a `category`, belongs to a `branch`, carries a `daily_rate` and `security_deposit`. Used exclusively in **Rental** bookings.

### Fleet Vehicle
A vehicle assigned to chauffeur/airport services. NOT available for self-drive rental. Has a `default_driver`. Status lifecycle: Available → OnTrip → Maintenance → Inactive → Retired.

Two ownership models:
- **Company Vehicle** (`is_personal_vehicle = false`) - owned and maintained by Swiftflitz
- **Owner-Operated Vehicle** (`is_personal_vehicle = true`) - driver owns the car, Swiftflitz dispatches trips to it

A Fleet Vehicle can be marked as **Featured** (`is_featured = true`), meaning it appears on the homepage alongside featured self-drive Vehicles. Featured Fleet Vehicles carry the "Chauffeur" badge to distinguish them from self-drive listings.

> Preferred term: **Owner-Operated Vehicle** (not "personal vehicle"). Signals both ownership and operational model.
> Current scope: ownership flag is informational only. No pricing difference, insurance split, or revenue-share logic implemented yet.
> Distinction: Vehicle = self-drive rental fleet. FleetVehicle = chauffeured service fleet. They are separate registries.

### Customer
A registered individual who can book self-drive **Rentals**. Has a document verification lifecycle:
`Incomplete → PendingReview → Verified | Rejected`

A Customer with an expired `license_expiry_date` has `profile_error_code = PROFILE_LICENSE_EXPIRED` and cannot proceed with online payments until renewed.

### Airport Customer
A lightweight passenger record created at the time of an **Airport Transfer** booking. Fields: `full_name`, `email`, `phone` only. NOT the same model as `Customer`. No verification lifecycle.

### Chauffeur Customer
A lightweight passenger record for a **Chauffeur Rental** booking. Fields: `full_name`, `email`, `phone`, `expected_destination`. NOT the same model as `Customer`. No verification lifecycle.

> Design decision: Airport/Chauffeur Customers are intentionally separate from Customer. Chauffeured services carry no self-drive risk, so KYC/license verification is not required. No cross-linking planned.

### Branch
A regional office of Swiftflitz (single company, not multi-tenant). Has its own location, currency, staff, vehicles, and fleet vehicles. Can have its own `exchange_rate` for non-GHS branches (e.g. NGN).

Visibility rules:
- `super_admin` / `admin` - cross-branch, see everything
- `manager` / `staff` - scoped to their assigned branch only

Customers can rent across branches (shared customer pool via `branch_customer` pivot). No white-label / true multi-tenancy planned.

### Rental
A self-drive booking. Lifecycle:
`Pending → Confirmed → Active → Overdue → Returned → Completed → Cancelled`

Sources: `website`, `phone`, `walk_in`, `referral`, `quote_request`.

### Quote Request
A customer-initiated pricing inquiry that can convert to a **Rental**. Has its own status lifecycle. Source = `quote_request` on the resulting Rental.

### Direct Website Booking Flow
1. Customer selects vehicle + dates → Rental created immediately (`status=pending`, `payment_status=pending`)
2. Customer redirected to payment page → pays online
3. Payment webhook marks rental `payment_status=paid` → rental advances to `confirmed` (or auto-confirm if enabled)

A `pending` rental from the website always has `payment_status=pending` at creation. It becomes `paid` only after successful payment callback.

### Airport Booking
A transfer booking for a passenger to/from an airport. Lifecycle:
`Pending → PaymentReceived → Confirmed → DriverAssigned → InProgress → Completed → Cancelled | NoShow`

Has a `direction` (arrival/departure) and references an `airport`, a `package`, and an `area_location`.

Terminal states:
- **Cancelled** - either party cancels before trip starts; cancellation fee may apply
- **NoShow** - driver arrived, passenger never appeared; full charge applied, no refund

### Chauffeur Booking
A driver-operated trip booking. Lifecycle:
`Pending → Confirmed → DriverAssigned → InProgress → Completed → Cancelled | NoShow`

> Design decision: `PaymentReceived` is a mandatory staff-review gate. Online payment alone never auto-confirms an Airport Booking - staff must review capacity/logistics and manually advance to `Confirmed`. Chauffeur skips this state because chauffeur capacity is assumed available on booking; no pre-confirmation review needed.

### Package (Airport)
A priced unit for airport transfers. Assigned to specific airports. Includes a `rate` and a `vat_rate`. Area charges may apply on top.

### Driver
A registered driver who can be assigned to Fleet Vehicles. Has document expiry tracking (license, ID). Status: active, inactive, suspended.

### Payment Transaction
An immutable financial record (soft-delete only). Types: Payment, Refund, CancellationFee, OverdueCharge, SecurityDeposit, DepositRefund, DepositWaived, ManualPayment, InitialPayment, PartPayment, FullPayment, Discount, DamageCharge, RepairCost, ResolveDebt, CancellationRefund.

Polymorphic `transactable` - can belong to a Rental, AirportBooking, or ChauffeurBooking.

Status: `Pending | Paid | Failed | UnderReview | Refunded`

### Payment Providers
Two live providers: **Hubtel** (primary, GHS-settled) and **Paystack** (card, GHS-settled).
Branch currencies (e.g. NGN) are converted to GHS via `exchange_rate` before submitting to Hubtel.

### Young Driver Deposit
An elevated security deposit applied when a customer's age is below the **Young Driver Age Threshold**. Resolution chain (each level overrides the next): Vehicle → Category → Global (`PricingSettings`). Both the threshold and deposit amount resolve independently via null-coalesce - threshold can come from one level and deposit from another. If either resolves to `null`, the standard security deposit applies instead. `null` at any level means "not set - inherit from next level."

### Security Deposit
A hold amount collected at rental start. Three outcomes at settlement:
- **Refunded** - full deposit returned, no outstanding balance
- **Applied to Balance** - deposit covers outstanding rental balance partially; remainder is refunded to customer (e.g. GHS 300 deposit, GHS 200 owed → GHS 200 applied, GHS 100 refunded)
- **Forfeited** - deposit kept by company (damage or policy breach)

Collection methods:
- **Cash at pickup** - staff records via Collect Deposit in admin panel
- **Online via Deposit Payment Link** - staff sends email link; customer pays before pickup; marks deposit `held` via `SecurityDeposit` transaction, does NOT affect `amount_paid`

### Damage Charge
Financial consequence when a returned vehicle has damage. Lifecycle: `RepairCost` (estimate, pending) → settled via online payment or cash → tagged `DamageCharge` (paid).

### Overdue Fee
Charged when a rental runs past `return_date`. Calculated by `OverdueSettings` (rate per overdue period).

### Coupon / Discount Rule
Two parallel discount mechanisms that intentionally stack:
- **Discount Rule** - automatic, no customer action required (e.g. loyalty tier, booking volume). Applied first.
- **Coupon** - redeemable code with usage limits, expiry, scope (global/vehicle/category). Applied on top of rule discount.

`total_discount_amount = rule_discount_amount + coupon_discount_amount`. No exclusivity rule - a booking can have both simultaneously.

### Roles
`super_admin`, `admin`, `manager`, `staff`, `accountant`, `viewer`.
Access is permissions-based (Spatie). Roles bundle permissions but individual permissions override.

### Rental Manager (`manager_id`)
The staff member who created or is responsible for a specific rental. NOT required to hold the `manager` role - any staff member qualifies. Always receives rental notifications unconditionally (bypasses branch/admin toggle gating). Distinct from the branch `manager` role.

### Notification Channels
Three outbound channels: **Email**, **WhatsApp** (Meta Cloud API v25.0, template-only), **SMS** (Twilio / Arkessel / Nalo).
Plus **In-App** (Reverb WebSocket, staff-only - customers cannot sign in to admin).

### Revenue Snapshot
DB-cached aggregation of payment transaction totals, recalculated every 30 minutes by `RecalculateRevenueSnapshotsJob`. Used by dashboard trend charts to avoid live N+1 aggregate queries.

---

## Pricing Model

### Rental Pricing
`base_cost = rental_days × daily_rate`
`extras_cost` = additional charges (addons)
`location_charge` = pickup + dropoff location fees
`subtotal = base_cost + extras_cost + location_charge`
`vat_amount = subtotal × vat_rate` (when `vat_enabled`)
`total_cost = subtotal + vat_amount - total_discount_amount`

**Day adjustments:**
- `extension_days` - extra days after original return date; same `daily_rate`; repriced at return
- `early_pickup_days` - days before original pickup date; two options staff choose at pickup:
  - **Keep return date** (`charge_extra`) - original return date unchanged, extra days billed at same `daily_rate` + per-day addons + VAT
  - **Shift return date** (`shift_return_date`) - return date moved earlier by same number of days; no extra charge, same total days
  - Decision is made by staff at pickup time in the admin panel. Customer has no self-service choice.

### Airport Pricing
`package_rate + area_charge + vat_amount - coupon_discount`

---

## Open Questions (from grill session)
- ~~Q1: Resolved - separate by design, no unification planned~~
- ~~Q2: Resolved - PaymentReceived is staff-review gate, never auto-advances~~
- ~~Q3: Resolved - is_personal_vehicle = Owner-Operated Vehicle; informational only, no pricing/revenue split yet~~
- ~~Q4: Resolved - remaining 10% is bug fixes only; system is feature-complete~~
