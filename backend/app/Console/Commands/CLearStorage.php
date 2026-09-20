<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CLearStorage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clear:storage';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear Storage';

    /**
     * Execute the console command.
     */
    public function handle()
    {

        // Clear storage/app/public directory except .gitignore and site-content (preserved media)
        $storagePath = storage_path('app/public');
        if (is_dir($storagePath)) {
            $this->deleteDirectory($storagePath, ['site-content']);
        }

        // Clear storage/app/private directory except .gitignore
        $privatePath = storage_path('app/private');
        if (is_dir($privatePath)) {
            $this->deleteDirectory($privatePath);
        }

        // Clear storagte/tus-temp directory except .gitignore
        $tusTempPath = storage_path('app/tus-temp');
        if (is_dir($tusTempPath)) {
            $this->deleteDirectory($tusTempPath);
        }

        $this->info('Storage cleared successfully.');
    }

    private function deleteDirectory(string $dir, array $exclude = []): void
    {
        $protected = array_merge(['.', '..', '.gitignore'], $exclude);
        $files = array_diff(scandir($dir), $protected);
        foreach ($files as $file) {
            $filePath = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($filePath)) {
                $this->deleteDirectory($filePath);
                rmdir($filePath);
            } else {
                unlink($filePath);
            }
        }
    }
}
