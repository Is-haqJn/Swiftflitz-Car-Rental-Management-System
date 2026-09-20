# Sprint F - Video Uploads, Lightbox, S3 Migration

MediaLibrary video collections on Rental. Background processing. Auto-delete job.

## Items

### F1 - Video MediaLibrary collections on Rental

**Files:**
- `backend/app/Models/Rental.php` - add `pickup_video` and `return_video` collections in `registerMediaCollections()`; set `acceptsMimeTypes(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'])`; use `disk('local')` (or configurable disk from F5)
- New migration: not needed (MediaLibrary uses `media` table)

**Upload endpoints:**
- `POST /api/v1/rentals/{rental}/upload-pickup-video` - permission: `rentals.manage_active`
- `POST /api/v1/rentals/{rental}/upload-return-video` - permission: `rentals.manage_active`

**File size limit:** Set in `config/media-library.php` or form request validation. Recommend 500MB max per video.

---

### F2 - Background video processing job

**New job:** `ProcessRentalVideoJob`

**Dispatched by:** Upload endpoints after `addMediaFromRequest()` completes.

**Processing:** At minimum, verify the file is a valid video. Optionally generate a thumbnail image using `ffmpeg` (if available). Store thumbnail as a MediaLibrary conversion.

**Queue:** `default` queue. Job should be fault-tolerant - if processing fails, the original video is still accessible.

---

### F3 - Auto-delete videos after 30 days

**New scheduled job:** `DeleteExpiredRentalVideosJob`

**Schedule:** Daily, off-peak (e.g. 02:00).

**Logic:**
```php
$cutoff = now()->subDays(30);
Rental::where('status', RentalStatus::Completed)
    ->where('completed_at', '<=', $cutoff)
    ->each(function (Rental $rental): void {
        $rental->clearMediaCollection('pickup_video');
        $rental->clearMediaCollection('return_video');
    });
```

**Register in:** `routes/console.php` - `Schedule::job(DeleteExpiredRentalVideosJob::class)->dailyAt('02:00')`

---

### F4 - Lightbox for images and videos

**Scope:** Admin inspection views (pickup/return inspection photo grids, rental inspection images).

**Library:** Use an existing lightbox library compatible with React. Options: `yet-another-react-lightbox` (already used?) or similar. Check existing dependencies first.

**Behavior:**
- Images: click to open full-screen lightbox with prev/next navigation
- Videos: click to open lightbox with `<video>` player, controls, and fullscreen support
- Thumbnails shown in grid; lightbox opens on click

**Files affected:**
- `frontend/src/admin/pages/rentals/RentalDetail.tsx` - inspection image/video grid
- Any other admin pages showing inspection media

---

### F5 - S3 migration toggle on Backup & Maintenance

**File:** `frontend/src/admin/pages/settings/MaintenancePage.tsx` (or equivalent Backup & Maintenance page)

**New card:** "Storage Migration"

- Toggle switch: Local Disk ↔ S3
- Confirmation modal: "This will migrate all media files. This may take several minutes."
- On confirm → calls `POST /api/v1/system/storage/migrate` with `{ target: 's3' | 'local' }`

**New backend endpoint + job:**
- `StorageMigrationJob` - iterates all `Media` records, copies file from current disk to target disk using `Storage::disk($from)->get()` + `Storage::disk($to)->put()`
- Updates `disk` column on each `Media` record after successful copy
- Long-running → dispatched to queue, progress trackable via job status

**New setting:** `storage_disk` in `GeneralSettings` (or dedicated `SystemSettings`). Values: `'local'` or `'s3'`. MediaLibrary collections read this setting for new uploads after migration.

**S3 credentials:** Stored in `.env` (`AWS_ACCESS_KEY_ID` etc). Not configurable via UI (security boundary).
