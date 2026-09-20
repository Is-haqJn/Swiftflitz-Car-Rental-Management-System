# Sprint A - UI Fixes & Label Changes

No database migrations. No API changes. Frontend + one backend string fix.

## Items

### A1 - Rename "Vehicles" → "Self-Drive Fleet" and "Fleet Vehicles" → "Chauffeured Fleet"

**Scope:** UI labels only. No API routes, model names, permission keys, or DB columns changed.

**Files to update:**
- `frontend/src/admin/constants/sideBarItems.tsx` - sidebar labels
- Page titles and breadcrumbs in `frontend/src/admin/pages/vehicles/` and `frontend/src/admin/pages/fleet-vehicles/`
- Any heading/empty-state text referencing "Vehicles" or "Fleet Vehicles" in those page trees

---

### A2 - Hero text background shape not covering text

**File:** `frontend/src/website/pages/home/sections/HeroSection.tsx`

**Fix:** The black shape behind "Your Car / Your Choice" text doesn't span the full text width on some breakpoints. Investigate CSS - likely a `max-width`, `clip-path`, or `width: fit-content` constraint on the background element. Fix to cover full text at all viewport widths.

---

### A3 - "Rent a Car" section before "Airport Transfer" on homepage

**File:** `frontend/src/website/pages/home/index.tsx`

**Fix:** Reorder the section render order so Rent a Car content appears above Airport Transfer content.

---

### A4 - "Rent a Car" CTA button partially working on different screens

**File:** `frontend/src/website/pages/home/sections/HeroSection.tsx` (or wherever the CTA button renders)

**Fix:** Investigate touch/click event handling on the primary CTA button. Check for overlapping elements blocking click on mobile. Check responsive classes.

---

### A5 - WhatsApp floating button

**New component:** `frontend/src/website/components/WhatsAppFloatingButton.tsx`

**Behavior:**
- Fixed to bottom-right corner at all times
- When the scroll-to-top arrow also appears at bottom-right, the WhatsApp button shifts left (e.g. `right: 4.5rem` when scroll arrow is visible, `right: 1rem` when not)
- Links to `https://wa.me/{phone}` where phone comes from contact settings (existing API)
- Mount in `frontend/src/shells/WebsiteShell.tsx` or the website layout

---

### A6 - Category filter bug (BannerSection not synced from URL)

**File:** `frontend/src/website/pages/listings/sections/BannerSection.tsx`

**Root cause:** `category`, `branchId`, `service` states initialize to `''` regardless of URL params. When user arrives at `/listings?category=SUV`, dropdown shows "All Categories" while grid shows filtered results.

**Fix:** Initialize all filter states from `useSearchParams` on mount:
```typescript
const [searchParams] = useSearchParams();
const [category, setCategory] = useState(searchParams.get('category') ?? '');
const [branchId, setBranchId] = useState(searchParams.get('branch_id') ?? '');
const [service, setService] = useState(searchParams.get('service') ?? '');
const [date, setDate] = useState(searchParams.get('date') ?? '');
```

---

### A7 - Branch select input on mobile (admin top bar)

**Fix:** Reduce the branch selector width on mobile or add `overflow: auto` / truncate text so the full dropdown is accessible on small screens.

---

### A8 - `under_review` notification action URL wrong (404)

**File:** `backend/app/Jobs/SendUnderReviewNotificationJob.php` line 56

**Fix:**
```php
// Before
'action_url' => '/management/transactions',

// After
'action_url' => '/management/finance/transactions/' . $this->transaction->id,
```

---

### A9 - `under_review` transaction has no resolve UI

**File:** `frontend/src/admin/pages/finance/transactions/TransactionDetail.tsx`

**Fix:** When `transaction.status === 'under_review'` and user has `transactions.resolve` permission, show approve/reject buttons. Calls existing `POST /api/v1/transactions/{id}/resolve` endpoint with `{ action: 'approve' | 'reject', notes?: string }`.
