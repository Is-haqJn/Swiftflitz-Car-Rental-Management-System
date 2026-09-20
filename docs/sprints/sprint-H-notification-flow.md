# Sprint H - Rental Notification Flow Fix

Fixes the broken email notification order when a rental is created. No new DB migrations.

## Root Cause

`SendBookingConfirmationJob` sends `BookingConfirmationMail` ("Booking Confirmation") for ALL rentals
regardless of status. For website bookings (status=pending, payment_status=pending), the customer
receives an email that says "Booking Confirmed" and contains NO payment link. The customer has no
way to pay without admin manually sending a payment link.

### Current broken flow (website booking):
```
Create → "Booking Confirmation" email (misleading) — no payment link
       → Admin manually sends payment link (if remembered)
       → Customer pays → PaymentConfirmationMail
       → Admin manually confirms
```

### Target flow:
```
Create (pending)  → "Booking Received - Payment Required" email WITH payment link + booking details
Customer pays     → Auto-confirm (Sprint E1) + "Payment Confirmed" email with receipt PDF
No duplicate      → pending→confirmed email skip already in place (SendRentalStatusChangedJob)
```

## Changes

### H1 - `BookingConfirmationMail` - accept optional payment URL

**File:** `backend/app/Mail/BookingConfirmationMail.php`

Add optional constructor params:
```php
public function __construct(
    public readonly Rental $rental,
    public readonly ?string $paymentUrl = null,
    public readonly ?float $amountDue = null,
) {}
```

Subject becomes status-aware:
```php
$subject = $this->paymentUrl
    ? "Booking Received - Payment Required ({$this->rental->reference})"
    : "Booking Confirmation - {$this->rental->reference}";
```

Pass `paymentUrl` and `amountDue` to the view via `Content::with`.

---

### H2 - `booking-confirmation.blade.php` - payment section

**File:** `backend/resources/views/emails/booking-confirmation.blade.php`

Change heading section to be payment-aware:
```blade
@if($paymentUrl)
    <h1 ...>Booking Received</h1>
    <p ...>Hi {{ $rental->customer->name }}, your booking has been received. Complete payment to confirm your booking.</p>
@else
    <h1 ...>Booking Confirmed</h1>
    <p ...>Hi {{ $rental->customer->name }}, your booking is confirmed.</p>
@endif
```

After the booking details table, add conditional payment CTA:
```blade
@if($paymentUrl && $amountDue)
    {{-- Amount Due --}}
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; ...">
        <p ...>Amount Due</p>
        <p ...>{{ $currencySymbol }}{{ number_format($amountDue, 2) }}</p>
    </div>

    {{-- Pay Now button --}}
    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $paymentUrl }}" style="...blue CTA button...">Complete Payment</a>
    </div>

    {{-- Pickup docs disclaimer --}}
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; ...">
        <p>Important: Payment alone does not entitle you to collect the vehicle.
        You must present your valid driver's license and required documents at pickup.</p>
    </div>
@else
    {{-- Existing Important Notice (bring licence etc) --}}
    ...existing amber notice...
@endif
```

---

### H3 - `SendBookingConfirmationJob` - generate payment URL for website bookings

**File:** `backend/app/Jobs/SendBookingConfirmationJob.php`

In `handle()`, before sending the customer email, check if payment link should be included:

```php
use App\Enums\RentalPaymentStatus;

$paymentUrl = null;
$amountDue  = null;

$needsPaymentLink = $rental->source === 'website'
    && in_array($rental->payment_status, [RentalPaymentStatus::Pending, RentalPaymentStatus::PartiallyPaid], true);

if ($needsPaymentLink) {
    $customer    = $rental->customer;
    $queryParams = http_build_query(array_filter([
        'name'        => $customer?->name,
        'email'       => $customer?->email,
        'phone'       => $customer?->phone,
        'booking_ref' => $rental->reference,
    ]));
    $paymentUrl = rtrim(config('app.frontend_url'), '/') . '/payment/rental/' . $rental->id . '?' . $queryParams;
    $amountDue  = (float) ($rental->total_cost - $rental->amount_paid);
}

if ($rental->customer->email && ($systemSettings->email_new_booking ?? true)) {
    Mail::to($rental->customer->email)->queue(
        new BookingConfirmationMail($rental, $paymentUrl, $amountDue)
    );
}
```

---

### H4 - `SendRentalStatusChangedJob` - remove pending→confirmed skip

**File:** `backend/app/Jobs/SendRentalStatusChangedJob.php` line 66

**Change:** Remove the `$isConfirmTransition` email skip entirely.

**Why:** The skip was added to avoid a duplicate "confirmed" email when admin manually confirmed a booking that had already received `BookingConfirmationMail`. With Sprint H3 in place, website bookings now receive "Booking Received - Payment Required" (not "Booking Confirmed") so there is no duplicate. The `pending → confirmed` transition is now always meaningful and the customer should be notified:
- Auto-confirm on payment (Verified customer): customer paid → they should know it's confirmed
- Cascade confirm on verification (E1b): admin verified them → they should know their booking is now confirmed

The only email that should NOT fire on this transition is if it happens as part of booking creation itself (handled by the existing `RentalCreated` guard in the event chain, not in this job).

---

### H5 - Video optimization note (Sprint F addendum)

**File:** `docs/sprints/sprint-F-video-uploads.md` - update F2

`ProcessRentalVideoJob` must include video optimization/compression:
- Use `ffmpeg` (if available on server) to transcode to H.264 MP4, target bitrate 2Mbps, max resolution 1080p
- If `ffmpeg` not available: skip transcoding, store original
- Store optimized version as a new MediaLibrary conversion named `optimized`
- Original kept as master; `optimized` version served for playback
- Job should be fault-tolerant: optimization failure must NOT delete the original upload

## Tests

- `it('sends payment link email for pending website booking')`
- `it('sends booking confirmed email for in-store admin rental')`
- `it('does not send duplicate email on pending to confirmed transition')`
- `it('auto-confirms rental on payment and fires status changed event')`
