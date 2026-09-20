<?php

namespace Database\Seeders;

use App\Enums\RoleEnum;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\warning;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            warning('TestUserSeeder creates accounts with hardcoded passwords and is skipped in production by default.');
            if (! confirm('TestUserSeeder - Run in production?', default: false)) {
                $this->command->warn('TestUserSeeder skipped.');

                return;
            }
        }

        $superAdmin = User::create([
            'name' => 'Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@ordaq.com',
            'password' => Hash::make('password'),
        ]);

        // ? assign role to user
        $superAdmin->assignRole(RoleEnum::SUPER_ADMIN);

        $this->command->info('Super admin created: email: superadmin@ordaq.com password: password');

        $admin = User::create([
            'name' => 'Admin User',
            'username' => 'admin',
            'email' => 'admin@ordaq.com',
            'password' => Hash::make('password'),
        ]);

        $admin->assignRole(RoleEnum::ADMIN);

        $this->command->info('Admin user created: email: admin@ordaq.com password: password');

        $user = User::create([
            'name' => 'Test User',
            'username' => 'user',
            'email' => 'user@ordaq.com',
            'password' => Hash::make('password'),
        ]);

        $user->assignRole(RoleEnum::VIEWER);

        $this->command->info('Test user created: email: user@ordaq.com password: password');

        // ?assign role manager
        $manager = User::create([
            'name' => 'Manager',
            'username' => 'manager',
            'email' => 'manager@ordaq.com',
            'password' => Hash::make('password'),
        ]);

        $manager->assignRole(RoleEnum::MANAGER);

        $this->command->info('Manager created: email: manager@ordaq.com password: password');

        $staff = User::create([
            'name' => 'Staff User',
            'username' => 'staff',
            'email' => 'staff@ordaq.com',
            'password' => Hash::make('password'),
        ]);

        $staff->assignRole(RoleEnum::STAFF);

        $this->command->info('Staff created: email: staff@ordaq.com password: password');
    }
}
