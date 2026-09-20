<?php

namespace Database\Seeders;

use App\Enums\RoleEnum;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        // ! Get all roles from the Role enum
        $roles = RoleEnum::list();

        // ! Get descriptions for each role from the Role enum
        $roles_descriptions = array_combine(
            $roles,
            // ? Use array_map to get descriptions for each role
            array_map(static fn ($role) => RoleEnum::from($role)->description(), $roles)
        );

        // ! Create roles in the database
        foreach ($roles_descriptions as $role => $description) {
            Role::firstOrCreate(
                ['name' => $role],
                ['description' => $description, 'is_default' => true]
            );
        }
    }
}
