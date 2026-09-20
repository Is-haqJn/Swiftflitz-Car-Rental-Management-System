# Sprint I - Lightbox for Vehicle & Inspection Images

Single shared lightbox library across public website and admin panel.

## Library

**`yet-another-react-lightbox`** (`yarl`) - pure React, TypeScript, zero external deps, works alongside jQuery/Bootstrap/OWL Carousel without conflict. Also supports video slides (reused by Sprint F video uploads).

```bash
npm install yet-another-react-lightbox
```

Import CSS once in each shell that needs it:
- `frontend/src/admin/assets/index.css` (or import in the component) for admin
- `frontend/src/website/pages/listings/vehicledetails/VehicleDetail.tsx` for public

---

## Items

### I1 - Public `VehicleDetail` - click main image opens lightbox

**File:** `frontend/src/website/pages/listings/vehicledetails/VehicleDetail.tsx`

**Behaviour:**
- Clicking the main image (the large 400px `div.twm-car-gallery-main`) opens the lightbox starting at the currently selected image index
- Thumbnail row stays exactly as-is (still changes the main image on click, no change there)
- Lightbox shows all `vehicle.images` as slides in order
- Add a cursor pointer to the main image container to signal it's clickable

**Implementation pattern:**
```tsx
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState(0);

const slides = vehicle.images.map(img => ({ src: img.url, alt: vehicle.name }));

// Main image - add onClick:
<div
    className="twm-car-gallery-main"
    style={{ ..., cursor: vehicle.images.length > 0 ? 'zoom-in' : 'default' }}
    onClick={() => {
        if (vehicle.images.length > 0) {
            setLightboxIndex(selectedImage);
            setLightboxOpen(true);
        }
    }}
>

// Lightbox component at bottom of return:
<Lightbox
    open={lightboxOpen}
    close={() => setLightboxOpen(false)}
    slides={slides}
    index={lightboxIndex}
/>
```

---

### I2 - Admin `InspectionComparisonCard` - click thumbnail opens lightbox

**File:** `frontend/src/admin/pages/rentals/RentalInspections/InspectionComparisonCard.tsx`

**Current:** Each photo is `<a href={url} target="_blank">` (opens new tab). Replace with lightbox.

**Behaviour:**
- Click any inspection photo thumbnail → opens lightbox at that index
- All photos for that inspection are in the lightbox (prev/next navigation)
- Remove the `<a>` wrapper; replace with `<button>` or `<div onClick>`

**Implementation pattern:**
```tsx
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState(0);

const slides = inspection.photos.map((url, idx) => ({ src: url, alt: `Photo ${idx + 1}` }));

// Replace <a href> with:
<div
    key={idx}
    role="button"
    tabIndex={0}
    style={{ cursor: 'zoom-in', ... existing img wrapper styles ... }}
    onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
    onKeyDown={e => e.key === 'Enter' && setLightboxOpen(true)}
>
    <img src={url} ... />
</div>

<Lightbox
    open={lightboxOpen}
    close={() => setLightboxOpen(false)}
    slides={slides}
    index={lightboxIndex}
/>
```

---

### I3 - Admin `VehicleDetail` - click main image opens lightbox

**File:** `frontend/src/admin/pages/vehicles/VehicleDetail.tsx`

**Behaviour:** Same as I1. Main image click → lightbox. Thumbnail row stays unchanged.

**State already exists:** `selectedImage` and `allImages` are already in this component. Wire up the same pattern as I1 using `allImages` as slides.

```tsx
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const [lightboxOpen, setLightboxOpen] = useState(false);
const slides = allImages.map(img => ({ src: img.url ?? img.thumb, alt: vehicle.name }));

// On main image container, add onClick to open at selectedImage index
// Lightbox at bottom of return
```

---

### I4 - Admin customer document images - lightbox on click

**Files:**
- `frontend/src/admin/pages/customers/CustomerDocumentManager.tsx` - license + ID document thumbnails
- `frontend/src/admin/pages/customers/CustomerProfilePreviewModal.tsx` - document preview in modal
- Rental/Booking detail pages where customer passport/license is shown (Sprint D)

**Current:** Documents likely shown as small thumbnails or `<a target="_blank">` links.

**Behaviour:** Click any document thumbnail (license image, ID document image, passport image) → opens lightbox. All documents for that customer are slides: `[license, id_document, passport]` (skip nulls).

**Slide shape:**
```tsx
const docSlides = [
    customer.license_url    && { src: customer.license_url,    alt: 'Driver License' },
    customer.id_document_url && { src: customer.id_document_url, alt: 'ID Document' },
    customer.passport_url   && { src: customer.passport_url,   alt: 'Passport' },
].filter(Boolean);
```

---

## Sprint F connection

When Sprint F (video uploads) is implemented, the same `Lightbox` component handles video slides via the `video` plugin from `yet-another-react-lightbox/plugins/video`:

```tsx
import Video from 'yet-another-react-lightbox/plugins/video';

// Video slide shape:
{ type: 'video', sources: [{ src: videoUrl, type: 'video/mp4' }] }

<Lightbox plugins={[Video]} ... />
```

Add `plugins={[Video]}` to the `InspectionComparisonCard` lightbox when Sprint F lands so pickup/return videos open in the same lightbox as photos.

---

## Shared component (optional)

If the same lightbox pattern appears in 3+ places, extract to `frontend/src/shared/components/ui/MediaLightbox.tsx`:

```tsx
interface MediaLightboxProps {
    slides: { src: string; alt?: string }[];
    open: boolean;
    index: number;
    onClose: () => void;
}
```

Use it in all three locations. Avoids repeating the import + CSS in every file.

---

## Tests

Lightbox is a pure UI interaction - no backend tests needed. TypeScript build check (`npx tsc -p tsconfig.app.json --noEmit`) is the primary quality gate after implementation.
