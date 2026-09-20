# Conversation State - 2026-05-22

## Current Task
Sprint E Redo complete. All 8 implementation steps done, tests green, Duster clean.

## Sprint E Redo Status: COMPLETE
Branch: `fix/staging`

### What changed from original Sprint E

**E4 REVERTED (critical):** `SendRentalStatusChangedJob` now skips customer email for `pending->confirmed` transition.
Customer already got `PaymentConfirmationMail` - no duplicate needed.
`EmailDuplicatePreventionTest` enforces this with `assertNotQueued`.

**BookingConfirmationMail fixed:** `attachments()` resolves `TermsSettings::content`, returns `[]` when empty, otherwise injects content into DomPDF view.

**pdf/terms-and-conditions.blade.php fixed:** Now accepts `$content` variable, uses `{!! $content !!}` with fallback. Static boilerplate removed.

**E5 implemented fully:**
- `SendTandCCopyJob::handle()` - no longer a no-op; mails `TermsAndConditionsCopyMail` to customer
- `TermsAndConditionsCopyMail` - fully implemented with DomPDF attachment (skips when content empty)
- `emails/terms-and-conditions-copy.blade.php` - created

**E1b extracted to service layer:**
- `RentalService::confirmPaidPendingForCustomer(Customer): int` added
- `RentalServiceInterface::confirmPaidPendingForCustomer()` signature added
- `CustomerController::verify()` delegates to service (3 enum imports removed)

**E1 race condition fixed:**
- `MarkTransactableAsPaid` uses atomic `WHERE id=X AND status=Pending UPDATE` pattern
- Only fires `RentalStatusChanged` if `$updated > 0`

### TDD-Commit
Red tests committed at `da5c3a2`:
- `EmailDuplicatePreventionTest`: assertNotQueued for pending->confirmed
- `TermsAndConditionsEmailTest`: SendTandCCopyJob actually sends mail, BookingConfirmationMail skips when empty
- `AutoConfirmRentalTest`: partial payment confirms, deposit/damage don't, cascade isolation

## Test Baseline
Backend: 1266/1266 passing. 0 Duster warnings.
Frontend: 313 (unchanged).

## Correct Notification Order for Customer (Online Booking)
1. Booking submitted (Pending) → `BookingConfirmationMail` with T&C PDF (if content set) + payment link
2. Payment confirmed → `PaymentConfirmationMail` with receipt PDF + pickup-docs disclaimer
3. Auto-confirm (Pending→Confirmed via E1/E1b) → **NO EMAIL** (skip in SendRentalStatusChangedJob)
4. Other transitions (Confirmed→Active, etc.) → `RentalStatusChangedMail`
