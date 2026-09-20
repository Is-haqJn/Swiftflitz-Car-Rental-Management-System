<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DatabaseBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup {--disk=local : The storage disk to save the backup}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a SQL dump backup of the application database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");
        $disk = $this->option('disk');

        return match ($driver) {
            'mysql', 'mariadb' => $this->backupMysql($connection, $disk, $driver),
            'sqlite' => $this->backupSqlite($connection, $disk),
            default => $this->unsupportedDriver($driver),
        };
    }

    private function backupMysql(string $connection, string $disk, string $driver = 'mysql'): int
    {
        $host = config("database.connections.{$connection}.host");
        $port = config("database.connections.{$connection}.port", 3306);
        $database = config("database.connections.{$connection}.database");
        $username = config("database.connections.{$connection}.username");
        $password = config("database.connections.{$connection}.password");

        $filename = 'backups/db-backup-' . now()->format('Y-m-d-His') . '.sql';
        $tmpPath = sys_get_temp_dir() . '/' . basename($filename);
        $errPath = $tmpPath . '.err';

        $passwordFlag = $password ? '-p' . escapeshellarg($password) : '';
        $binary = $this->resolveDumpBinary($driver);

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
         * deprecation warnings ("mysqldump: Deprecated program name...") never
         * end up as the first line of the dump and corrupt restores.
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
            escapeshellarg($tmpPath),
            escapeshellarg($errPath),
        );

        exec($command, $output, $exitCode);

        $stderr = is_file($errPath) ? trim((string) file_get_contents($errPath)) : '';
        @unlink($errPath);

        if ($exitCode !== 0) {
            $this->error("{$binary} failed: " . ($stderr !== '' ? $stderr : 'unknown error'));
            @unlink($tmpPath);

            return self::FAILURE;
        }

        if ($stderr !== '') {
            $this->warn("{$binary} warnings (not included in dump): {$stderr}");
        }

        Storage::disk($disk)->makeDirectory('backups');
        Storage::disk($disk)->put($filename, file_get_contents($tmpPath));
        @unlink($tmpPath);

        $this->printSuccess($disk, $filename);

        return self::SUCCESS;
    }

    private function backupSqlite(string $connection, string $disk): int
    {
        $dbPath = config("database.connections.{$connection}.database");

        if (! file_exists($dbPath)) {
            $this->error("SQLite database file not found: {$dbPath}");

            return self::FAILURE;
        }

        $filename = 'backups/db-backup-' . now()->format('Y-m-d-His') . '.sqlite';

        Storage::disk($disk)->makeDirectory('backups');
        Storage::disk($disk)->put($filename, file_get_contents($dbPath));

        $this->printSuccess($disk, $filename);

        return self::SUCCESS;
    }

    private function resolveDumpBinary(string $driver): string
    {
        /*
         * Prefer `mariadb-dump` whenever it exists on PATH, for both `mariadb`
         * and `mysql` drivers. Modern MariaDB servers emit a "Deprecated program
         * name" warning to stderr when `mysqldump` is invoked; using the native
         * binary avoids the warning at its source.
         */
        exec('command -v mariadb-dump 2>/dev/null', $output, $exitCode);
        if ($exitCode === 0 && ! empty($output[0])) {
            return 'mariadb-dump';
        }

        return 'mysqldump';
    }

    private function unsupportedDriver(string $driver): int
    {
        $this->error("Database backup does not support driver: {$driver}");

        return self::FAILURE;
    }

    private function printSuccess(string $disk, string $filename): void
    {
        $size = Storage::disk($disk)->size($filename);
        $this->info("Backup saved: {$filename} (" . round($size / 1024, 1) . ' KB)');
    }
}
