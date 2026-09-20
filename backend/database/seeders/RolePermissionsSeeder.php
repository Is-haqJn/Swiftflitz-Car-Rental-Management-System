<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ! Clear permission cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ! Load permissions structure from config
        $permissionsByRole = config('swiftflitz.permissions');

        // ! Flatten the permissions structure and assign to roles
        foreach ($permissionsByRole as $roleName => $groups) {
            // ! Collect all permission names for this role across all groups
            $permissionNames = collect($groups)
                ->flatMap(fn ($permissions) => array_keys($permissions))
                ->unique()
                ->toArray();

            if (! empty($permissionNames)) {
                // ! Create or retrieve the role and sync permissions
                $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
                $role->syncPermissions($permissionNames);
            }
        }

        $this->command->info('Roles and permissions have been seeded and synced successfully.');
    }
}
