# Sprint J - Payment Pending UX Fix

Replaces the "Awaiting Confirmation" countdown-to-failure screen with a positive "Booking Received" state for payments that are genuinely processing (not failed).

## Background

When a Hubtel payment completes, the customer is redirected back with `?status=success&reference=TXN-xxx`. The frontend calls `verify()`, which returns `pending` because the Hubtel webhook has not arrived yet (IP whitelisting required). This triggers `pending_confirmation` - a 6-minute countdown that ends in a "Payment Failed" screen even though:

1. Hubtel explicitly signalled success on redirect (`status=success`)
2. `CheckPendingHubtelPaymentsJob` runs every 5 min and will resolve the transaction
3. `PaymentStatusUpdated` Echo broadcast upgrades the page automatically when resolved
4. The customer will receive a confirmation email once the job fires

Showing "Payment Failed" after a timeout is incorrect and damages trust.

## Decisions (locked)

- **Trigger:** Both cases - `verify()` returns `pending` OR throws - get the new "Booking Received" state. Any time `pending_confirmation` would have fired, the new state fires instead.
- **True failure** (`verify()` returns `failed` explicitly, or DB poll returns `failed`): still navigates to `/payment/cancelled` or shows failed state - unchanged.
- **Background polling:** Stays active indefinitely. Only stops when DB status becomes `paid` (upgrades to success) or `failed` (shows failed). No timeout-to-failed.
- **Echo listener:** Stays wired. If `PaymentStatusUpdated` fires while customer is on the page, page upgrades to full "Payment Confirmed!" state automatically.
- **Countdown timer:** Removed entirely. No `timeRemaining` state, no countdown `useEffect`.

## Items

### J1 - Remove timeout-to-failure from polling loop

**File:** `frontend/src/website/pages/payment/PaymentPage.tsx`

**Current (lines ~338-378):**
- `maxAttempts = 24` (24 x 15s = 6 min)
- On `attempts >= maxAttempts`: sets `pageState('failed')` with "Payment confirmation timed out" message

**Change:**
- Remove `attempts` counter and `maxAttempts` constant
- Remove the `attempts >= maxAttempts` branch entirely from both `.then()` and `.catch()`
- `pending` / `under_review` from DB: do nothing, keep polling
- Network error in `.catch()`: do nothing, keep polling
- Interval runs indefinitely until `paid` or `failed` from DB

```tsx
/* DB-only status poll - resolves silently when webhook or job confirms payment */
useEffect(() => {
    if (pageState !== 'pending_confirmation' || !reference) {
        return;
    }

    const intervalId = setInterval(() => {
        paymentService
            .getStatus(reference)
            .then(res => {
                const status = res.data?.status;
                if (status === 'paid') {
                    clearInterval(intervalId);
                    setPageState('success');
                } else if (status === 'failed') {
                    clearInterval(intervalId);
                    setPageState('failed');
                    setErrorMessage(
                        'Payment could not be confirmed. Please contact support.'
                    );
                }
                /* pending / under_review: keep polling, never timeout to failed */
            })
            .catch(() => { /* network error: keep polling silently */ });
    }, 15000);

    return () => clearInterval(intervalId);
}, [pageState, reference]);
```

---

### J2 - Remove countdown state and timer useEffect

**File:** `frontend/src/website/pages/payment/PaymentPage.tsx`

**Remove:**
- `const [timeRemaining, setTimeRemaining] = useState<number>(359);`
- The entire "Countdown timer for pending_confirmation state" `useEffect` block (~lines 381-399)

No replacement needed.

---

### J3 - Replace `pending_confirmation` render with "Booking Received" UI

**File:** `frontend/src/website/pages/payment/PaymentPage.tsx`

**Replace** the entire `/* ---- Pending Confirmation ---- */` block (currently the circular countdown ring card) with a positive "Booking Received!" card.

**Color scheme:** Blue/indigo (not green - green is reserved for confirmed; not amber - amber implies warning)

**Content:**
- Icon: `fas fa-paper-plane`, background: `linear-gradient(135deg, #6366f1, #4f46e5)` (indigo)
- Title: `"Booking Received!"`
- Sub text: `"Your payment has been submitted and is being processed. You'll receive a confirmation email with your receipt once your payment is verified."`
- Payment reference badge (TXN-xxx) - same `RefBadge` component, indigo colors
- Blue info panel: `"A confirmation email will be sent to {form.email} once your payment is verified."` (only when `form.email` is set)
- Primary button: `"Track Your Rental"` - green gradient, links to `/track/{bookingRef}` when `bookingRef` is set, else `/track`
- Secondary button: `"Return to Home"` - grey, links to `/`
- Small note below buttons: `"Still processing? The system checks automatically. Contact support with your reference number if you don't receive a confirmation within 30 minutes."`

```tsx
/* ---- Booking Received (payment submitted, awaiting webhook/job confirmation) ---- */
if (pageState === 'pending_confirmation') {
    return (
        <PageShell gradient="linear-gradient(135deg, #eef2ff 0%, #f0f4ff 100%)">
            {title}
            <StatusCard
                icon="fas fa-paper-plane"
                iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
                title="Booking Received!"
            >
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                    Your payment has been submitted and is being processed. You&apos;ll
                    receive a confirmation email with your receipt once your payment is
                    verified.
                </p>

                {reference && (
                    <RefBadge
                        reference={reference}
                        color="#3730a3"
                        bg="#eef2ff"
                        border="#c7d2fe"
                    />
                )}

                {form.email && (
                    <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: 10,
                        padding: '14px 16px',
                        textAlign: 'left',
                        marginBottom: 20,
                    }}>
                        <p style={{ fontSize: 13, color: '#1e40af', fontWeight: 600, marginBottom: 4 }}>
                            <i className="fas fa-envelope me-2" />
                            Confirmation will be sent to <strong>{form.email}</strong>
                        </p>
                        <p style={{ fontSize: 12, color: '#1d4ed8', marginBottom: 0, lineHeight: 1.6 }}>
                            Check your inbox (and spam folder) after a few minutes.
                        </p>
                    </div>
                )}

                <Link
                    to={bookingRef ? `/track/${bookingRef}` : '/track'}
                    style={{
                        display: 'block',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: '#fff',
                        borderRadius: 10,
                        padding: '13px 0',
                        fontWeight: 600,
                        fontSize: 14,
                        textDecoration: 'none',
                        marginBottom: 10,
                    }}
                >
                    <i className="fas fa-search-location me-2" />
                    Track Your Rental
                </Link>

                <Link
                    to="/"
                    style={{
                        display: 'block',
                        background: '#f1f5f9',
                        color: '#374151',
                        borderRadius: 10,
                        padding: '13px 0',
                        fontWeight: 600,
                        fontSize: 14,
                        textDecoration: 'none',
                        marginBottom: 16,
                    }}
                >
                    Return to Home
                </Link>

                <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                    The system checks automatically. Contact support with your reference
                    number if you don&apos;t receive a confirmation within 30 minutes.
                </p>
            </StatusCard>
        </PageShell>
    );
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/website/pages/payment/PaymentPage.tsx` | J1 + J2 + J3 - polling fix, remove countdown, replace pending_confirmation render |

## Tests

No backend tests needed. Frontend: `npx tsc -p tsconfig.app.json --noEmit` is the primary gate. Manual test: initiate a Hubtel payment, return to callback URL with `?status=success&reference=TXN-xxx` and a fresh reference that hasn't been confirmed in DB - should see "Booking Received!" instead of the countdown.

## No deps

Standalone. Can implement at any time.
