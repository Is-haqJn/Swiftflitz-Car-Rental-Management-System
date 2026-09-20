<?php

namespace App\Services\Contracts;

use App\DTOs\UserData;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\Permission\Models\Role;

interface UserServiceInterface
{
    /**
     * Get paginated user list with filters.
     */
    public function getFilteredUsers(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get a single user by ID.
     */
    public function getUser(string $id): User;

    /**
     * Create a new user.
     */
    public function createUser(UserData $data): User;

    /**
     * Update an existing user.
     */
    public function updateUser(string $id, UserData $data): User;

    /**
     * Delete a user.
     */
    public function deleteUser(string $id): bool;

    /**
     * Toggle user active status.
     */
    public function toggleActive(string $id): User;

    /**
     * Assign roles to a user.
     *
     * @param  array<string>  $roles
     */
    public function assignRoles(string $id, array $roles): User;

    /**
     * Assign direct permissions to a user.
     *
     * @param  array<string>  $permissions
     */
    public function assignPermissions(string $id, array $permissions): User;

    /**
     * Generate an impersonation token for a user (super admin only).
     *
     * @return array{user: User, token: string}
     */
    public function impersonate(string $id): array;

    /**
     * Revoke all tokens for a user (force logout).
     */
    public function revokeAllTokens(string $id): bool;

    /**
     * Get all available roles with their permissions.
     *
     * @return array<array{name: string, label: string, description: string, permissions_count: int}>
     */
    public function getAvailableRoles(): array;

    /**
     * Get all available permissions grouped by category.
     *
     * @return array<string, array<string, string>>
     */
    public function getAvailablePermissions(): array;

    /**
     * Create a custom role with optional permissions.
     *
     * @param  array<string>  $permissions
     */
    public function createRole(string $name, array $permissions): Role;

    /**
     * Update a role's name and/or permissions.
     *
     * @param  array<string>  $permissions
     */
    public function updateRole(string $role, ?string $newName, ?string $description, ?array $permissions): Role;

    /**
     * Delete a custom role (system roles cannot be deleted).
     */
    public function deleteRole(string $role): bool;
}
