<?php

namespace App\Enums;

enum RoleEnum: string
{
    case SUPER_ADMIN = 'super_admin';
    case ADMIN = 'admin';
    case MANAGER = 'manager';
    case STAFF = 'staff';
    case VIEWER = 'viewer';

    /**
     * Get a list of all roles.
     */
    public static function list(): array
    {
        return array_map(static fn ($role) => $role->value, self::cases());
    }

    /**
     * Get role descriptions
     */
    public function description(): string
    {
        return match ($this) {
            self::SUPER_ADMIN, self::ADMIN => 'Full system access with ability to manage all aspects including users and settings.',
            self::MANAGER => 'Operational lead with access to most features, excluding sensitive system settings.',
            self::STAFF => 'Front desk staff focused on day-to-day rental operations and customer interaction.',
            self::VIEWER => 'Read-only access to view data without ability to make changes.',
        };
    }

    /**
     * Get a human-readable name for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Admin',
            self::ADMIN => 'Admin',
            self::MANAGER => 'Manager',
            self::STAFF => 'Staff',
            self::VIEWER => 'Viewer',
        };
    }
}
