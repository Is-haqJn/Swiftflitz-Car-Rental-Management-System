<?php

namespace App\Providers;

use App\Settings\GeneralSettings;
use App\Settings\S3Settings;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Throwable;

class MediaLibraryServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        try {
            $general = app(GeneralSettings::class);

            if ($general->storage_disk !== 's3') {
                return;
            }

            $s3 = app(S3Settings::class);

            config(['media-library.disk_name' => 's3']);

            if (! empty($s3->aws_access_key_id)) {
                config(['filesystems.disks.s3.key' => $s3->aws_access_key_id]);
            }

            if (! empty($s3->aws_secret_access_key)) {
                config(['filesystems.disks.s3.secret' => $s3->aws_secret_access_key]);
            }

            if (! empty($s3->aws_default_region)) {
                config(['filesystems.disks.s3.region' => $s3->aws_default_region]);
            }

            if (! empty($s3->aws_bucket)) {
                config(['filesystems.disks.s3.bucket' => $s3->aws_bucket]);
            }

            if (! empty($s3->aws_url)) {
                config(['filesystems.disks.s3.url' => $s3->aws_url]);
            }

            if (! empty($s3->aws_endpoint)) {
                config(['filesystems.disks.s3.endpoint' => $s3->aws_endpoint]);
            }

            config(['filesystems.disks.s3.use_path_style_endpoint' => $s3->use_path_style_endpoint]);
        } catch (Throwable $e) {
            Log::warning('MediaLibraryServiceProvider: failed to override disk config', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
