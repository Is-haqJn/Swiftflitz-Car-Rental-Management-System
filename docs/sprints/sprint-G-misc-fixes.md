# Sprint G - Misc Fixes

Small independent fixes.

## Items

### G0 - EditVehicle category not pre-selected (race condition)

**File:** `frontend/src/admin/pages/vehicles/CreateVehicle.tsx` line 171

**Root cause:** `reset(formData)` fires when vehicle loads, but categories are still fetching. No `<option>` elements exist in DOM yet → browser can't match the value → select shows blank. Categories then render but RHF doesn't re-apply.

**Fix:**
```typescript
/* Pre-fill form when editing */
useEffect(() => {
    if (vehicle && categories.length > 0) {
        const formData = vehicleToFormDefaults(vehicle);
        reset(formData);
    }
}, [vehicle?.id, categories.length, reset]); // eslint-disable-line react-hooks/exhaustive-deps
```

`categories` is already in scope (line 104). No other changes needed.

### G1 - Receipt PDF showing empty when downloaded

**Investigation needed.** DomPDF renders blank PDF - likely cause: data not passed to Blade view, or a null dereference silently skipping content.

**Steps:**
1. Trace `PaymentConfirmationMail::attachments()` for the rental path
2. Check that `$rental` is loaded with required relations: `customer`, `vehicle.branch`, `paymentTransactions`
3. Check Blade template `resources/views/pdf/booking-receipt.blade.php` for null-guarded variables that silently render nothing
4. Run `php artisan test --compact --filter=ReceiptTest` (or write one) to confirm PDF bytes > 0

**Known gotcha:** DomPDF with non-ASCII currency symbols renders `?`. Use `$pdfSafeSymbol` pattern (documented in CLAUDE.md).

---

### G2 - Hubtel double-webhook (no code change required)

**Resolution:** User will remove the second callback URL from Hubtel dashboard.

**Recommended code hardening (low risk):** Add idempotency guard at the top of `HubtelAdapter::handleWebhook()`:

```php
if ($transaction->status === PaymentTransactionStatus::Paid) {
    return ['success' => true, 'status' => 'paid'];
}
```

This makes the endpoint safe to call multiple times even if the second URL is re-added in future.
