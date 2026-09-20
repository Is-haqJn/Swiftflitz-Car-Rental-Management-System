# Sprint C-II - Global Young Driver Deposit Policy

**Dependency:** Sprint C must be complete first (young driver fields must exist on Vehicle and Category).

## Context

Sprint C added age-based deposit overrides at the vehicle and category level. Sprint C-II extends the resolution chain to include a global fallback in `PricingSettings`, so a company-wide young driver policy can be set without configuring every vehicle individually.

## Resolution Chain (after C-II)

Both fields resolve independently via null-coalesce:

```
young_driver_age_threshold:  vehicle → category → PricingSettings.global_young_driver_age_threshold
young_driver_deposit:        vehicle → category → PricingSettings.global_young_driver_deposit
```

`null` at any level means "not set - inherit from next level." No explicit opt-out mechanism - set to `null` to defer to the next level.

Both must resolve to non-null for the young driver check to fire. If either resolves to `null`, the standard deposit chain is used instead.

## Items

### C-II-1 - Settings migration + PricingSettings class

Add two nullable fields to the `pricing` settings group.

**Files:**
- New settings migration: `add_global_young_driver_deposit_to_pricing_settings`
  - `$this->migrator->add('pricing.global_young_driver_age_threshold', null)`
  - `$this->migrator->add('pricing.global_young_driver_deposit', null)`
- `backend/app/Settings/PricingSettings.php` - add two nullable properties:
  ```php
  /** Global young driver age threshold. Applied when vehicle and category have no override. */
  public ?int $global_young_driver_age_threshold;

  /** Global young driver deposit amount. Applied when vehicle and category have no override. */
  public ?float $global_young_driver_deposit;
  ```

---

### C-II-2 - PricingService logic update

Extend `getDepositAmount()` to include global fallback for both fields.

**File:** `backend/app/Services/PricingService.php`

**Logic change:**
```php
$threshold = $vehicle->young_driver_age_threshold
    ?? $vehicle->category?->young_driver_age_threshold
    ?? $this->pricingSettings->global_young_driver_age_threshold;

$youngDeposit = $vehicle->young_driver_deposit
    ?? $vehicle->category?->young_driver_deposit
    ?? $this->pricingSettings->global_young_driver_deposit;
```

Existing guard unchanged:
```php
if ($threshold !== null && $youngDeposit !== null && $customerAge !== null && $customerAge < $threshold) {
    return round((float) $youngDeposit, 2);
}
```

---

### C-II-3 - Backend API validation

Allow the two new fields through the pricing settings update endpoint.

**File:** `backend/app/Http/Requests/Settings/UpdatePricingSettingsRequest.php` (or equivalent)

Add validation rules:
```php
'global_young_driver_age_threshold' => ['nullable', 'integer', 'min:16', 'max:99'],
'global_young_driver_deposit'       => ['nullable', 'numeric', 'min:0'],
```

---

### C-II-4 - Frontend: SecurityDepositCard

Add two fields to the existing `SecurityDepositCard` in `PricingSettings.tsx`. Always visible (not gated behind `chargeDeposit` toggle).

**File:** `frontend/src/admin/pages/settings/PricingSettings.tsx`

Add to `PricingSettingsData` type and to the `SecurityDepositCard` submit payload:
- `global_young_driver_age_threshold` (nullable number)
- `global_young_driver_deposit` (nullable number)

**UI placement:** Below "Global Fixed Deposit Amount", above "Deposit Enforcement Mode". Display as a paired row:

```
Young Driver Age Threshold    Young Driver Deposit (fallback)
[input: age, e.g. 25]         [input: amount, e.g. 500.00]
Helper: "Applies to all vehicles with no vehicle- or category-level young driver setting."
```

Both fields use `valueAsNumber: false` with null coercion on submit (empty string → null).

---

### C-II-5 - Tests

**File:** new test or extend existing `PricingServiceTest`

Three cases to cover:
1. Global fires when vehicle + category both null - customer under threshold gets global young deposit
2. Vehicle-level overrides global - vehicle threshold + vehicle deposit takes precedence
3. Independent resolution - threshold from global + deposit from vehicle combine correctly
4. Global threshold set but global deposit null - falls through to standard deposit (no young driver surcharge)
