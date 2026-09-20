<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class ResetProject extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reset:project';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset the project: clears caches, migrates (fresh if DB exists, new if not), seeds, and re-links storage.';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->call('cache:clear');
        $this->call('config:clear');
        $this->call('route:clear');
        $this->call('view:clear');

        // ? Run migrate:fresh on an existing database, or migrate on a brand-new one
        if (Schema::hasTable('migrations')) {
            $this->info('Existing database detected - running migrate:fresh.');
            $this->call('migrate:fresh');
        } else {
            $this->info('No database detected - running migrate.');
            $this->call('migrate');
        }

        $this->call('db:seed');

        $this->call('clear:storage');

        // run storage:link if the public/storage symlink doesn't exist
        if (! file_exists(public_path('storage')) && ! file_exists(public_path('media'))) {
            $this->call('storage:link');
        }

        $this->info('Project has been reset successfully.');
    }
}
