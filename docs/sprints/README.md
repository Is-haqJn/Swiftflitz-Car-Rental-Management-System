# Sprint Plan - Swiftflitz Improvement Backlog

Decisions locked via grill-with-docs sessions. Each sprint is independently deployable.

## Sprints

| Sprint | Focus | Files |
|--------|-------|-------|
| [A](sprint-A-ui-labels.md) | UI fixes, label renames, bug fixes | 9 items |
| [B](sprint-B-booking-form-ux.md) | Booking form UX + rental tracking | 5 items |
| [C](sprint-C-age-deposits.md) | Age-based security deposits | 3 items |
| [C-II](sprint-C-II-global-young-driver-deposit.md) | Global young driver deposit policy in PricingSettings | 5 items |
| [D](sprint-D-documents.md) | Document management (passport, optional uploads, request flow) | 5 items |
| [D-II](sprint-D-II.md) | Deposit payment link, featured fleet on homepage, document reupload fields, email responsiveness | 5 items |
| [E](sprint-E-payment-flow.md) | Payment-before-confirm, notification order, T&C | 5 items |
| [F](sprint-F-video-uploads.md) | Video uploads, lightbox, S3 migration toggle | 5 items |
| [G](sprint-G-misc-fixes.md) | Receipt PDF fix, Hubtel idempotency | 2 items |
| [H](sprint-H-notification-flow.md) | Rental email notification flow fix + video optimization | 5 items |
| [I](sprint-I-lightbox.md) | Lightbox for vehicle images (public + admin) and inspection photos | 3 items |
| [J](sprint-J-payment-pending-ux.md) | Payment pending UX - replace countdown-to-failed with "Booking Received" | 3 items |

## Key Decisions (locked)

- **Rename scope:** UI labels only. No API routes, model names, or permission keys changed.
- **Age deposits:** Two fields (threshold + young_driver_deposit). Vehicle overrides Category. DOB collected on public form, persisted to Customer.
- **Global young driver deposit:** Both fields (threshold + deposit) added to `PricingSettings` as nullable. Resolution chain: vehicle → category → global. Fields resolve independently. Null = inherit. No per-vehicle opt-out.
- **Auto-confirm on payment:** Applies to standard rentals only. `quote_request` status always requires admin review first.
- **Cash/in-store:** Skips payment gate. Admin-created rentals with in-store payment confirm directly.
- **Hubtel double-webhook:** User removes second URL from Hubtel dashboard. Idempotency guard added in code.
- **Video storage:** Local disk initially. S3 migration toggle on Backup & Maintenance page.
- **Document uploads:** Global settings toggle controls public form. Per-rental "Request Document Upload" button fires email to existing `/reupload-documents` page.
- **Customer status:** Already correct - upload sets `PendingReview`, admin must explicitly verify. No code change needed.
- **Rental tracking:** Status page at `/track` with manual reference input + email deep-link.
- **T&C:** Copy emailed on booking submit. PDF attached to pending-for-payment email.
- **Deposit payment link:** `purpose=deposit` flow. Marks deposit `held` via `SecurityDeposit` transaction. Does not touch `amount_paid`.
- **Featured fleet:** `is_featured` on FleetVehicle. Unified homepage carousel with gold "Chauffeur" badge. Separate detail URL.
- **Reupload page:** Gains address, license number/expiry, ID type/number fields (pre-filled). Both documents required.

## Dependency Order

```
Sprint A (no deps)
Sprint B (no deps)
Sprint C -> depends on Sprint B (DOB field must exist on public form)
Sprint C-II -> depends on Sprint C (young driver fields must exist on Vehicle + Category)
Sprint D -> no deps
Sprint D-II -> no deps (extends Sprint D reupload page; D need not be complete)
Sprint E -> no deps (auto-confirm is independent)
Sprint F -> no deps
Sprint G -> no deps
Sprint H -> depends on Sprint E (auto-confirm event must fire for H4 to work correctly)
Sprint I -> no deps (pure frontend, install yarl once)
Sprint J -> no deps (pure frontend, PaymentPage.tsx only)
```
