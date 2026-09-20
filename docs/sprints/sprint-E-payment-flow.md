# Sprint E - Payment Flow, Notification Order, T&C

Core business logic changes. Careful testing required.

## Items

### E1 - Auto-confirm rental on payment

**Customer eligibility gate:** Only `Verified` customers (`profile_status = CustomerProfileStatus::Verified`) get auto-confirmed on payment. Non-verified customers (Incomplete, PendingReview, Rejected) stay `pending` until the cascade in E1b fires.

**File:** `backend/app/Listeners/MarkTransactableAsPaid.php`

**Rule:** When `transactable_type === 'rental'` and payment is marked paid:
```
if rental.status === Pending AND rental.customer.profile_status === Verified
    → set status = Confirmed, dispatch RentalStatusChanged
if rental.status === Pending AND rental.customer.profile_status !== Verified
    → keep status = Pending (payment recorded, rental waits for verification cascade)
if rental.status === QuoteRequest
    → do NOT auto-confirm (admin review required regardless of profile status)
All other statuses → no change
```

**Cash/in-store path:** Admin creates rental with `payment_method = 'in_store'`. Handle in `RentalService::create()` directly (not via listener). In-store = admin present = trust established → always confirm regardless of profile status.

---

### E1b - Cascade confirm on customer verification

When admin verifies a customer (`profile_status` → `Verified`), find all pending paid rentals for that customer and auto-confirm them.

**File:** `backend/app/Http/Controllers/V1/CustomerController.php` → `verify()` method

After `$customer->update(['profile_status' => CustomerProfileStatus::Verified, ...])`, add:

```php
$pendingPaidRentals = $customer->rentals()
    ->where('status', RentalStatus::Pending)
    ->whereNotIn('payment_status', [RentalPaymentStatus::Pending])
    ->get();

foreach ($pendingPaidRentals as $rental) {
    $rental->update(['status' => RentalStatus::Confirmed]);
    RentalStatusChanged::dispatch($rental, RentalStatus::Pending->value, RentalStatus::Confirmed->value);
}
```

**Notification:** `SendRentalStatusChangedJob` fires for each confirmed rental. The `pending → confirmed` customer email skip (line 66 of that job) should NOT apply here - customer should receive a "your booking is now confirmed" email since this is a meaningful manual verification event. Update the skip guard to also check `$this->triggeredByVerification` flag, or add a separate `CustomerVerifiedBookingConfirmedMail`.

**Simpler approach (recommended):** Remove the `pending → confirmed` email skip entirely from `SendRentalStatusChangedJob` and instead only skip it in `SendBookingConfirmationJob` (Sprint H already handles the booking-created email correctly). The skip was added to avoid duplicate emails when admin manually confirmed - but with the new flow, `pending → confirmed` always means something meaningful to the customer.

---

**Tests:**
- `it('auto-confirms verified customer rental on payment')`
- `it('keeps pending for unverified customer rental on payment')`
- `it('cascades confirm on all pending paid rentals when customer is verified')`
- `it('does not auto-confirm quote request on payment')`
- `it('always confirms in-store rental regardless of profile status')`

---

### E2 - Payment confirmation notification includes pickup-docs disclaimer

**File:** `backend/resources/views/emails/payment-confirmation.blade.php`

Add a notice section below the payment details:

```
Important: Your payment has been received. However, payment alone does not
entitle you to collect the vehicle. You must present your valid driver's
license and required documents at pickup. Our team will contact you to
confirm your pickup appointment.
```

Also add this notice to `SendPaymentConfirmationJob` in-app notification body.

---

### E3 - "Paid in Full" badge conditional

**File:** `backend/resources/views/emails/rental-invoice.blade.php`

```blade
@if($rental->amount_paid >= $rental->total_cost)
    {{-- PAID IN FULL badge --}}
    <div style="...green styles...">PAID IN FULL</div>
@endif
```

Badge is hidden entirely when outstanding balance exists. No "partially paid" label.

---

### E4 - Notification order fix

**Current issue:** Customer receives status-changed email when rental goes `pending → confirmed`, duplicating the booking confirmation email.

**Fix (already documented in CLAUDE.md):** In `SendRentalStatusChangedJob::handle()`, skip customer email when `oldStatus === 'pending'` and `newStatus === 'confirmed'` (was already fixed). Verify this covers the new auto-confirm path from E1.

**Correct order for customer:**
1. Booking submitted → "Rental Booking Pending - Awaiting Payment" email with payment link
2. Payment received → "Payment Confirmed" email with receipt PDF attached + pickup-docs disclaimer (E2)
3. No duplicate "booking confirmed" email on the `pending → confirmed` transition

---

### E5 - T&C: copy emailed on booking submit + attached to pending email

**T&C copy on acceptance:**
- When customer submits booking (public form), fire `SendTandCCopyJob` → emails T&C content to customer
- T&C content from `GeneralSettings::terms_and_conditions` (or wherever it's stored)
- New `Mail` class: `TermsAndConditionsCopyMail`

**T&C PDF attached to pending-for-payment email:**
- `backend/app/Mail/RentalPendingPaymentMail.php` (or the booking-created mail) - generate T&C as PDF via DomPDF, attach
- New Blade template: `resources/views/pdf/terms-and-conditions.blade.php`

**Note:** Use `$pdfSafeSymbol` pattern for any currency symbols in the PDF (per CLAUDE.md PDF safety rule).
