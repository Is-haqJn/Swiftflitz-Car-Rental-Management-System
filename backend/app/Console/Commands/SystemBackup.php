<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use ZipArchive;

class SystemBackup extends Command
{
    protected $signature = 'system:backup
        {--disk=local : The storage disk to save the backup}
        {--include-database : Include the SQL database dump}
        {--include-env : Include the .env config file}
        {--include-logs : Include the application log files}
        {--include-storage : Include the storage/app/public uploads}';

    protected $description = 'Create a full system backup (choose what to include) as a ZIP archive';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $includeDatabase = (bool) $this->option('include-database');
        $includeEnv = (bool) $this->option('include-env');
        $includeLogs = (bool) $this->option('include-logs');
        $includeStorage = (bool) $this->option('include-storage');

        /*
         * When no --include-* flag is passed (e.g. the weekly scheduled run),
         * default to including everything so the cron is useful out of the box.
         */
        if (! $includeDatabase && ! $includeEnv && ! $includeLogs && ! $includeStorage) {
            $includeDatabase = true;
            $includeEnv = true;
            $includeLogs = true;
            $includeStorage = true;
        }

        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");

        if ($includeDatabase && ! in_array($driver, ['mysql', 'mariadb'], true)) {
            $this->warn("Database backup only supports MySQL/MariaDB. Current driver: {$driver}. Skipping DB dump.");
            $includeDatabase = false;
        }

        $disk = $this->option('disk');
        $timestamp = now()->format('Y-m-d-His');
        $tmpDir = sys_get_temp_dir() . '/system-backup-' . $timestamp;
        $zipPath = $tmpDir . '/system-backup.zip';
        $storagePath = "backups/system-backup-{$timestamp}.zip";

        @mkdir($tmpDir, 0755, true);

        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            $this->error('Unable to create ZIP archive.');
            $this->cleanupTemp($tmpDir);

            return self::FAILURE;
        }

        /* Dump the database */
        if ($includeDatabase) {
            $sqlPath = $tmpDir . '/database.sql';
            $errPath = $sqlPath . '.err';
            $host = config("database.connections.{$connection}.host");
            $port = config("database.connections.{$connection}.port", 3306);
            $database = config("database.connections.{$connection}.database");
            $username = config("database.connections.{$connection}.username");
            $password = config("database.connections.{$connection}.password");
            $passwordFlag = $password ? '-p' . escapeshellarg($password) : '';

            $binary = $this->resolveDumpBinary();
            $flags = implode(' ', [
                '--single-transaction',
                '--skip-lock-tables',
                '--routines',
                '--triggers',
                '--events',
                '--default-character-set=utf8mb4',
                '--no-tablespaces',
            ]);

            /*
             * Route stdout to the SQL file and stderr to a separate error file so
             * deprecation warnings never end up as the first line of the dump
             * and corrupt restores.
             */
            $command = sprintf(
                '%s %s -h %s -P %s -u %s %s %s > %s 2> %s',
                $binary,
                $flags,
                escapeshellarg($host),
                escapeshellarg((string) $port),
                escapeshellarg($username),
                $passwordFlag,
                escapeshellarg($database),
                escapeshellarg($sqlPath),
                escapeshellarg($errPath),
            );

            exec($command, $output, $exitCode);

            $stderr = is_file($errPath) ? trim((string) file_get_contents($errPath)) : '';
            @unlink($errPath);

            if ($exitCode !== 0) {
                $this->error("{$binary} failed: " . ($stderr !== '' ? $stderr : 'unknown error'));
                $zip->close();
                $this->cleanupTemp($tmpDir);

                return self::FAILURE;
            }

            if ($stderr !== '') {
                $this->warn("{$binary} warnings (not included in dump): {$stderr}");
            }

            $zip->addFile($sqlPath, 'database.sql');
        }

        /* Add .env config file */
        if ($includeEnv) {
            $envPath = base_path('.env');
            if (file_exists($envPath)) {
                $zip->addFile($envPath, '.env');
            }
        }

        /* Add application log files */
        if ($includeLogs) {
            $logsPath = storage_path('logs');
            if (is_dir($logsPath)) {
                $this->addDirectoryToZip($zip, $logsPath, 'logs');
            }
        }

        /* Add storage/app/public uploads */
        if ($includeStorage) {
            $storagePubPath = storage_path('app/public');
            if (is_dir($storagePubPath)) {
                $this->addDirectoryToZip($zip, $storagePubPath, 'storage');
            }
        }

        $zip->close();

        /* Store on configured disk */
        Storage::disk($disk)->makeDirectory('backups');
        Storage::disk($disk)->put($storagePath, file_get_contents($zipPath));

        $this->cleanupTemp($tmpDir);

        $size = Storage::disk($disk)->size($storagePath);
        $this->info("System backup saved: {$storagePath} (" . round($size / 1024, 1) . ' KB)');

        return self::SUCCESS;
    }

    /**
     * Resolve the dump binary, preferring mariadb-dump when available to avoid
     * the "Deprecated program name" warning modern MariaDB emits for mysqldump.
     */
    private function resolveDumpBinary(): string
    {
        exec('command -v mariadb-dump 2>/dev/null', $output, $exitCode);
        if ($exitCode === 0 && ! empty($output[0])) {
            return 'mariadb-dump';
        }

        return 'mysqldump';
    }

    /**
     * Recursively add all files in a directory to the ZIP archive.
     */
    private function addDirectoryToZip(ZipArchive $zip, string $dirPath, string $zipPrefix): void
    {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dirPath, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $file) {
            if (! $file->isFile()) {
                continue;
            }

            $filePath = $file->getRealPath();
            $relativePath = $zipPrefix . '/' . ltrim(str_replace($dirPath, '', $filePath), '/\\');
            $zip->addFile($filePath, $relativePath);
        }
    }

    /**
     * Remove the temporary working directory and its contents.
     */
    private function cleanupTemp(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        $files = glob($dir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
        @rmdir($dir);
    }
}
