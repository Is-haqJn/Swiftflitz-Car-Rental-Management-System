# Sprint B - Booking Form UX + Rental Tracking

Public website changes. No new backend endpoints except tracking.

## Items

### B1 - Time picker requires date first

**File:** `frontend/src/website/pages/listings/vehicledetails/VehicleDetail.tsx`

**Fix:** Disable pickup time field until pickup date is selected. Disable return time field until return date is selected. Use `disabled` prop on `TimePickerField` (or equivalent public form component). Show tooltip: "Select a date first."

---

### B2 - Return date/time auto-set after pickup selected

**File:** `frontend/src/website/pages/listings/vehicledetails/VehicleDetail.tsx`

**Behavior:**
- When pickup date + pickup time are both set → auto-set return date = pickup date + `minRentalDays` (from `RentalSettings`)
- Auto-set return time = same as pickup time
- Return time is capped at admin's configured max time from `RentalSettings`
- Customer can override both fields after auto-set

**Backend:** Read `min_rental_days` and `max_return_time` from rental settings. These are already available via the settings API.

---

### B3 - DOB field on public booking form

**File:** `frontend/src/website/pages/listings/vehicledetails/VehicleDetail.tsx`

**Behavior:**
- Add date-of-birth field to the booking form
- For returning customers (email recognized): if DOB already stored on the Customer record, skip showing the field (backend already has it)
- DOB submitted with booking payload → stored on the Customer record
- Backend: `VehicleDetail` booking endpoint (or `QuoteRequestService`) must accept and persist `date_of_birth`

**18+ gate:** On submit, calculate age from DOB. If age < 18, block submission with error: "You must be 18 or older to rent a vehicle."

---

### B4 - 18+ gate (public rental page)

Already covered in B3. The age check runs client-side on form submit. Backend also validates in the booking creation request.

---

### B5 - Rental tracking page

**New files:**
- `frontend/src/website/pages/tracking/index.tsx` - search form (manual reference input)
- `frontend/src/website/pages/tracking/TrackingDetail.tsx` - status display

**Route:** `/track` (search form) + `/track/:reference` (detail, pre-filled from email link)

**New backend endpoint:** `GET /api/v1/public/rentals/track/{reference}` - returns:
```json
{
  "reference": "RNT-XXXX",
  "status": "confirmed",
  "vehicle": { "name": "...", "image": "..." },
  "pickup_date": "...",
  "return_date": "...",
  "pickup_location": "...",
  "dropoff_location": "..."
}
```
Public endpoint (no auth). Returns 404 if reference not found.

**Email deep-link:** Booking confirmation email includes `/track/{reference}` link. Customer can also enter reference manually on `/track`.

**Register route:** Add to `frontend/src/website/routes/websiteRoutes.tsx` and `backend/routes/v1/api.php` public group.
