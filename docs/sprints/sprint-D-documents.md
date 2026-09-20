# Sprint D - Document Management

Passport upload, optional document toggle, per-rental document request.

## Items

### D1 - Passport MediaLibrary collection on Customer

**Files:**
- `backend/app/Models/Customer.php` - add `passport` to `registerMediaCollections()`
- `backend/app/Http/Controllers/V1/CustomerController.php` - accept `passport_image` file in store/update
- `backend/app/Http/Controllers/V1/Public/CustomerProfileController.php` - accept `passport_image` in `submit()`
- `backend/app/Http/Requests/PublicCompleteProfileRequest.php` - add `passport_image` as optional file rule
- `backend/app/Http/Resources/CustomerResource.php` - expose `passport_url`

---

### D2 - Passport shown on Rental + Booking admin detail pages

**Files:**
- `frontend/src/admin/pages/rentals/RentalDetail.tsx` - show passport in customer info section; upload button if missing
- `frontend/src/admin/pages/airport-transfer/AirportBookingDetail.tsx` - same
- `frontend/src/admin/pages/chauffeur/ChauffeurBookingDetail.tsx` - same
- Admin customer detail page (`CustomerDetail.tsx`) - existing, add passport section

**Upload interaction:** Clicking "Upload Passport" opens file picker → POSTs to `PATCH /api/v1/customers/{id}` with `passport_image` file.

---

### D3 - Global document-optional settings toggle

**New settings field:** Add `documents_required` boolean to `RentalSettings` (or `GeneralSettings`). Default: `true`.

**Files:**
- `backend/database/settings/` - new settings migration
- `frontend/src/admin/pages/settings/RentalSettings.tsx` - add toggle: "Require documents on booking form"
- `frontend/src/website/pages/listings/vehicledetails/VehicleDetail.tsx` - read `documents_required` from settings API; when false, show/hide document upload fields; when customer submits without docs → auto-dispatch `RequestDocumentUploadJob`

**Auto-email trigger:** When `documents_required = false` and customer submits booking without uploading docs → `RequestDocumentUploadJob::dispatch($customer)` queued immediately. This sends the document request email (see D4).

---

### D4 - Per-rental "Request Document Upload" button

**Existing:** `POST /api/v1/customers/{customer}/request-reupload` already exists (`CustomerController::requestReupload()`). This endpoint:
- Sets `profile_status = Incomplete`
- Sets `reupload_token` + expiry
- Sends email to customer

**What's needed:** Add a "Request Document Upload" button to `RentalDetail.tsx` (and booking detail pages). Button calls the existing endpoint. Disabled if `profile_status === 'pending_review'` or `'verified'` (already submitted).

**Email update:** `CustomerProfileController::submit()` already sends `AdminProfileSubmittedMail`. Update the request email template (`resources/views/emails/request-reupload.blade.php` or equivalent) to list: Driver's License, ID Document, and Passport as required items.

---

### D5 - Reupload page accepts passport

**Files:**
- `frontend/src/website/pages/reupload-documents/index.tsx` - add passport upload field (optional)
- `backend/app/Http/Requests/PublicCompleteProfileRequest.php` - passport_image already optional (from D1)
- `backend/app/Http/Controllers/V1/Public/CustomerProfileController.php` - save to `passport` collection (from D1)

**Customer status rule (already correct):** Upload sets `PendingReview`. Admin must explicitly call `POST /api/v1/customers/{id}/verify` to set `Verified`. No code change needed - just confirming existing behavior is preserved.
