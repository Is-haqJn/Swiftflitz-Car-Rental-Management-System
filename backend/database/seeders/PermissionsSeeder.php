<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ! Clear all cached permissions in the spatie package
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ! get all permissions from the config file
        $permissionsByRole = config('swiftflitz.permissions');
        $permissionGroups = config('swiftflitz.permission_groups');

        $uniquePermissions = [];

        // ! Iterate through roles, then groups, then permissions to build a unique list with context
        foreach ($permissionsByRole as $role => $groups) {
            foreach ($groups as $groupKey => $permissions) {
                // Resolve the readable group name from the config map, or fallback to key
                $groupName = $permissionGroups[$groupKey] ?? ucfirst($groupKey);

                foreach ($permissions as $permName => $description) {
                    // Use permission name as key to prevent duplicates
                    if (! isset($uniquePermissions[$permName])) {
                        $uniquePermissions[$permName] = [
                            'name' => $permName,
                            'description' => $description,
                            'group_name' => $groupName,
                        ];
                    }
                }
            }
        }

        // ! create permissions in the database
        foreach ($uniquePermissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                [
                    'description' => $permission['description'],
                    'group' => $permission['group_name'],
                ]
            );
        }
        // ! Clear the permission cache after seeding

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

    }
}
