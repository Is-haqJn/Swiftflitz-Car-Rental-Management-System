# Sprint C - Age-Based Security Deposits

**Dependency:** Sprint B must be complete first (DOB field must exist on public booking form and Customer record).

## Data Model

Two new nullable fields added to both `vehicles` and `vehicle_categories` tables:

| Column | Type | Description |
|--------|------|-------------|
| `young_driver_age_threshold` | `tinyInteger nullable` | Age boundary (e.g. 25) |
| `young_driver_deposit` | `decimal(15,2) nullable` | Deposit when age < threshold |

Existing `security_deposit` = standard deposit (age >= threshold).

**Priority rule:** Vehicle setting overrides Category setting. If Vehicle has no age threshold set, fall back to Category threshold.

## Items

### C1 - Migration + Model updates

**Files:**
- New migration: `add_young_driver_deposit_to_vehicles_table`
- New migration: `add_young_driver_deposit_to_vehicle_categories_table`
- `backend/app/Models/Vehicle.php` - add to `$fillable` and `casts()`
- `backend/app/Models/VehicleCategory.php` - add to `$fillable` and `casts()`
- `backend/app/Http/Resources/VehicleResource.php` - expose new fields
- `backend/app/Http/Resources/VehicleCategoryResource.php` - expose new fields

---

### C2 - Admin UI fields

**Files:**
- `frontend/src/admin/pages/vehicles/CreateVehicle.tsx` / `EditVehicle.tsx` - add two fields: age threshold + young driver deposit, displayed side by side with label "Below age [X]: [amount]"
- `frontend/src/admin/pages/vehicles/categories/CreateCategory.tsx` / `EditCategory.tsx` - same two fields

**Display pattern:**
```
Young driver threshold: [input: age]
Young driver deposit:   [input: amount]
```
Both optional. Only active when both are set.

---

### C3 - PricingService logic

**File:** `backend/app/Services/PricingService.php`

**Logic:**
```php
$threshold = $vehicle->young_driver_age_threshold
    ?? $vehicle->category?->young_driver_age_threshold;

$youngDeposit = $vehicle->young_driver_deposit
    ?? $vehicle->category?->young_driver_deposit;

if ($threshold && $youngDeposit && $customerAge !== null && $customerAge < $threshold) {
    $securityDeposit = $youngDeposit;
} else {
    $securityDeposit = $vehicle->security_deposit
        ?? $vehicle->category?->security_deposit
        ?? 0;
}
```

**Customer age source:** `$rental->customer->date_of_birth` → `Carbon::parse()->age`. Null DOB = no age adjustment, use standard deposit.

**Admin rental creation:** Customer DOB read from the selected Customer record. Applied automatically in pricing calculation.

**Public booking form:** DOB collected in Sprint B. Passed to pricing preview endpoint so the correct deposit amount is shown before confirmation.
