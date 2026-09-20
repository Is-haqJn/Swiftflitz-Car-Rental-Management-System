# Sprint D-II - Deposit Payment Link, Featured Fleet, Document Fields & Responsiveness

## Items

### D-II-1 - Security Deposit Note (red warning)

Show a red notice below "Rental Total" informing the customer their security deposit will be collected at pickup.

**Surfaces:**
- `frontend/src/website/pages/listings/vehicledetails/BookingConfirmation.tsx` - after "Rental Total" line in price breakdown
- `frontend/src/admin/pages/rentals/RentalDetail.tsx` - inside the Security Deposit card (above action buttons)

**Display condition:** `security_deposit_amount > 0` AND `skip_security_deposit !== true` AND `deposit_waived !== true`

**Copy:** `Security deposit of [symbol][amount] will be collected at pickup.`

---

### D-II-2 - Security Deposit Payment Link

Staff can send an email payment link for the security deposit, allowing the customer to pay online before pickup.

**Backend:**

New method in `RentalService`: `sendSecurityDepositPaymentLink(Rental $rental): void`
- Validates: deposit amount > 0, not waived, not skipped, status = pending, customer has email
- Builds payment URL with `purpose=deposit` query param
- Queues `BookingPaymentLinkMail` (reuse existing mail class, pass `bookingType = 'Security Deposit'`)

New endpoint: `POST /api/v1/rentals/{rental}/send-security-deposit-payment-link`
- Permission: `rentals.manage_active`
- Delegates to `RentalService::sendSecurityDepositPaymentLink()`

`PaymentService::resolvePayableAmount(type, id, purpose)`:
- Add `purpose=deposit` branch: return `security_deposit_amount` only

`MarkTransactableAsPaid` listener:
- Add `purpose === 'deposit'` branch:
  - Set `security_deposit_status = 'held'`
  - Update `deposit_paid = transaction->amount`
  - Tag transaction type as `SecurityDeposit`
  - Do NOT update `amount_paid` or `payment_status`

`PaymentPage.tsx` (website):
- When `purpose=deposit`: show "Security Deposit" as payment item label (same pattern as `purpose=damage` showing "Damage / Repair Cost")

**Frontend hook:** `useSendDepositPaymentLink()` in `useRentals.ts`

**Button visibility in `RentalDetail.tsx`** (Security Deposit card, alongside existing buttons):
```
canSendDepositPaymentLink =
  rental.security_deposit_amount > 0
  && !rental.skip_security_deposit
  && !rental.deposit_waived
  && rental.security_deposit_status === 'pending'
  && !!rental.customer?.email
  && ['confirmed', 'active'].includes(rental.status)
```

---

### D-II-3 - Featured Fleet Vehicles on Homepage

Fleet vehicles marked `is_featured` appear in the homepage featured vehicles carousel alongside self-drive vehicles, distinguished by a gold "Chauffeur" badge.

**Backend:**

New migration: `add_is_featured_to_fleet_vehicles_table`
- `is_featured` boolean, default false

`FleetVehicle` model: add `is_featured` to `$fillable`

`FleetVehicleController::availableForChauffeur()`:
- Accept optional `?featured=true` query param
- When present: scope to `->where('is_featured', true)`

`FleetVehicleResource`: expose `is_featured`

**Frontend:**

`ListingSection.tsx` (homepage):
- In addition to existing `/public/vehicles?featured=true`, also fetch `/public/chauffeur-vehicles?featured=true`
- Merge both result sets before rendering
- Chauffeur vehicles rendered with gold "Chauffeur" badge (already exists in `CarGridSection.tsx` on listings page - reuse same badge pattern)
- Chauffeur detail link: `/chauffeur-services/{id}` (not `/listings/{id}`)
- Price unit label: `/ trip` (not `/ day`)

**Admin fleet vehicle edit form** (`EditFleetVehicle.tsx`):
- Add `is_featured` toggle (Form.Check switch) in vehicle settings section

---

### D-II-4 - Quote Email & BookingConfirmation Responsiveness

**Scope:** 3 quote Blade email templates + `BookingConfirmation.tsx` (public website)

**Email templates** (`backend/resources/views/emails/`):

Files: `quote-confirmation.blade.php`, `quote-ready.blade.php`, `new-quote-request.blade.php`

Issues to fix:
- Table cells with hardcoded `width: 40%` on label column - replace with `class="mobile-full-width"` and remove fixed width
- Pricing rows with `white-space: nowrap` amounts that overflow on small screens - add `class="mobile-full-width"` to amount cells so they stack
- Apply existing media query classes from `layout.blade.php` to table cells (`mobile-full-width`, `stack-column`, `mobile-font-sm`)
- Verify `layout.blade.php` `@media` block covers `.stack-column { display: block !important; width: 100% !important; }`

**BookingConfirmation.tsx** (`frontend/src/website/pages/listings/vehicledetails/`):

Issues to fix:
- Replace fixed pixel padding (`padding: '48px 36px'`, `padding: '60px 0'` etc.) with responsive Bootstrap spacing classes or smaller values on mobile
- Vehicle image thumbnail fixed `width: 88, height: 58` - add `maxWidth: '100%'` and `height: 'auto'` or use `object-fit: cover` with percentage width
- Icon circle `width: 80, height: 80` - acceptable fixed size, leave
- Sticky sidebar (`position: 'sticky', top: 24`) - add `@media (max-width: 768px)` wrapper or inline style conditional to disable stickiness on mobile (sticky card obscures content on small screens)
- Bootstrap grid (`col-lg-7` / `col-lg-5`) is correct - do not change column structure

---

### D-II-5 - Document Reupload Page - Extended Fields + Required Documents

Extend the token-based reupload page to also collect/update profile text fields and require both documents.

**Page:** `/reupload-documents/:token` (`frontend/src/website/pages/reupload-documents/index.tsx`)

**Backend:**

`PublicCustomerController::show(string $token)`:
- Currently returns only `name`
- Add to response: `address`, `license_number`, `license_expiry_date`, `id_type`, `id_number`

`PublicCustomerController::upload(Request $request, string $token)`:
- Currently validates only files (both nullable)
- Add validation for new fields:
  ```php
  'address'              => ['required', 'string', 'max:500'],
  'license_number'       => ['required', 'string', 'max:100'],
  'license_expiry_date'  => ['required', 'date', 'after:today'],
  'id_type'              => ['required', new Enum(CustomerIdType::class)],
  'id_number'            => ['required', 'string', 'max:100'],
  'license_file'         => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
  'id_document_file'     => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
  ```
- Save new fields to Customer model alongside existing media upload logic
- Extract validation into a new `PublicReuploadRequest` form request class

**Frontend (`reupload-documents/index.tsx`):**

Add form fields above the file upload sections, pre-filled from the `show()` API response:
- Home Address (textarea, required)
- Driver's License Number (text input, required)
- License Expiry Date (date input, required, min = tomorrow)
- ID Document Type (select, required) - options: Ghana Card, Passport, Voter ID, Driver's License, NHIS, Other
- ID Number (text input, required)

Change both upload section labels from `(optional)` to `(required)`.

Submit button sends all fields + files together as `FormData`.

**UX note:** Fields are pre-filled; customer can see their existing data and correct any outdated values before submitting.
