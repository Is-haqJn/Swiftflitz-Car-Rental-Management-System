<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('media') || ! Schema::hasTable('site_contents')) {
            return;
        }

        $siteContentId = DB::table('site_contents')->value('id');
        if (! $siteContentId) {
            $siteContentId = DB::table('site_contents')->insertGetId([
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $modelType = 'App\\Models\\SiteContent';

        $staticImages = [
            'hero' => [
                'file' => storage_path('app/public/site-content/homepage/hero/hero-bg.jpg'),
                'name' => 'hero-bg',
            ],
            'whychooseus-bg' => [
                'file' => storage_path('app/public/site-content/homepage/whychooseus/whychooseus-bg.jpg'),
                'name' => 'whychooseus-bg',
            ],
            'chauffeur' => [
                'file' => storage_path('app/public/site-content/homepage/chauffeur/chauffeur.jpg'),
                'name' => 'chauffeur',
            ],
            'pickup-process-bg' => [
                'file' => storage_path('app/public/site-content/homepage/pickupprocess/bg/step-bg.jpg'),
                'name' => 'step-bg',
            ],
            'pickup-process-bottom' => [
                'file' => storage_path('app/public/site-content/homepage/pickupprocess/bottom/adv-car.png'),
                'name' => 'adv-car',
            ],
            'about-banner' => [
                'file' => storage_path('app/public/site-content/about/banner/about-banner.jpg'),
                'name' => 'about-banner',
            ],
            'about-general-bg' => [
                'file' => storage_path('app/public/site-content/about/general/bg/abus-pic.jpg'),
                'name' => 'abus-pic',
            ],
            'about-general-overlay' => [
                'file' => storage_path('app/public/site-content/about/general/overlay/car-pic1.png'),
                'name' => 'car-pic1',
            ],
            'about-values-bg' => [
                'file' => storage_path('app/public/site-content/about/values/bg/about-values-bg.jpg'),
                'name' => 'about-values-bg',
            ],
            'services-banner' => [
                'file' => storage_path('app/public/site-content/services/banner/services-banner.jpg'),
                'name' => 'services-banner',
            ],
            'services-why-choose-us-bg' => [
                'file' => storage_path('app/public/site-content/services/whychooseus/services-why-choose-us-bg.jpg'),
                'name' => 'services-why-choose-us-bg',
            ],
            'faq-banner' => [
                'file' => storage_path('app/public/site-content/faq/banner/faqs-banner.jpg'),
                'name' => 'faqs-banner',
            ],
            'faq-section-bg' => [
                'file' => storage_path('app/public/site-content/faq/section-bg/faq-section-bg.jpg'),
                'name' => 'faq-section-bg',
            ],
            'contact-banner' => [
                'file' => storage_path('app/public/site-content/contact/banner/contact-banner.jpg'),
                'name' => 'contact-banner',
            ],
            'contact-section-bg' => [
                'file' => storage_path('app/public/site-content/contact/section-bg/contact-section-bg.jpg'),
                'name' => 'contact-section-bg',
            ],
            'listings-banner' => [
                'file' => storage_path('app/public/site-content/listings/banner/listings-banner.jpg'),
                'name' => 'listings-banner',
            ],
            'airport-transfer-banner' => [
                'file' => storage_path('app/public/site-content/airport-transfer/banner/airport-transfer-banner.jpg'),
                'name' => 'airport-transfer-banner',
            ],
            'chauffeur-banner' => [
                'file' => storage_path('app/public/site-content/chauffeur/banner/chauffeur-banner.jpg'),
                'name' => 'chauffeur-banner',
            ],
        ];

        foreach ($staticImages as $collection => $info) {
            if (! file_exists($info['file'])) {
                continue;
            }

            $alreadyExists = DB::table('media')
                ->where('model_type', $modelType)
                ->where('model_id', $siteContentId)
                ->where('collection_name', $collection)
                ->exists();

            if (! $alreadyExists) {
                $this->insertMediaRecord($siteContentId, $modelType, $collection, $info['file'], $info['name']);
            }
        }

        /* Promo popup - single file named promo-popup-image.* */
        $promoDir = storage_path('app/public/site-content/popups/promo');
        $promoMatches = glob("{$promoDir}/promo-popup-image.*") ?: [];
        if (! empty($promoMatches)) {
            $alreadyExists = DB::table('media')
                ->where('model_type', $modelType)
                ->where('model_id', $siteContentId)
                ->where('collection_name', 'promo-popup-image')
                ->exists();

            if (! $alreadyExists) {
                $this->insertMediaRecord($siteContentId, $modelType, 'promo-popup-image', $promoMatches[0], 'promo-popup-image');
            }
        }

        /* Directory-based collections */
        $dirCollections = [
            'testimonials' => storage_path('app/public/site-content/homepage/testimonials'),
            'icons' => storage_path('app/public/site-content/homepage/icons'),
            'about-team-photos' => storage_path('app/public/site-content/about/team'),
            'services-facility-cards' => storage_path('app/public/site-content/services/cards'),
        ];

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg'];

        foreach ($dirCollections as $collection => $dir) {
            if (! is_dir($dir)) {
                continue;
            }

            $order = (int) DB::table('media')
                ->where('model_type', $modelType)
                ->where('model_id', $siteContentId)
                ->where('collection_name', $collection)
                ->count();

            $files = array_values(array_filter(
                scandir($dir) ?: [],
                function (string $f) use ($dir, $allowedExtensions): bool {
                    if (in_array($f, ['.', '..'])) {
                        return false;
                    }
                    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));

                    return in_array($ext, $allowedExtensions) && is_file($dir . DIRECTORY_SEPARATOR . $f);
                }
            ));

            foreach ($files as $filename) {
                $filePath = $dir . DIRECTORY_SEPARATOR . $filename;

                $alreadyExists = DB::table('media')
                    ->where('model_type', $modelType)
                    ->where('model_id', $siteContentId)
                    ->where('collection_name', $collection)
                    ->where('file_name', $filename)
                    ->exists();

                if (! $alreadyExists) {
                    $order++;
                    $this->insertMediaRecord(
                        $siteContentId,
                        $modelType,
                        $collection,
                        $filePath,
                        pathinfo($filename, PATHINFO_FILENAME),
                        $order
                    );
                }
            }
        }
    }

    public function down(): void
    {
        /* Media records seeded by this migration are not reversed to avoid data loss. */
    }

    private function insertMediaRecord(
        int $modelId,
        string $modelType,
        string $collection,
        string $filePath,
        string $name,
        int $order = 1,
    ): void {
        $fileName = basename($filePath);
        $mimeType = mime_content_type($filePath) ?: 'image/jpeg';

        DB::table('media')->insert([
            'model_type' => $modelType,
            'model_id' => $modelId,
            'uuid' => (string) Str::uuid(),
            'collection_name' => $collection,
            'name' => $name,
            'file_name' => $fileName,
            'mime_type' => $mimeType,
            'disk' => 'public',
            'conversions_disk' => 'public',
            'size' => filesize($filePath),
            'order_column' => $order,
            'manipulations' => '[]',
            'custom_properties' => '[]',
            'generated_conversions' => '[]',
            'responsive_images' => '[]',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
