<?php

namespace App\Services;

use App\DTOs\UserData;
use App\Enums\RoleEnum;
use App\Http\Resources\PermissionsResource;
use App\Models\User;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserService implements UserServiceInterface
{
    /** @var array<string> System roles defined by enum that cannot be deleted */
    private const SYSTEM_ROLES = ['super_admin', 'admin', 'manager', 'staff', 'viewer'];

    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected RoleRepositoryInterface $roleRepository,
    ) {}

    /**
     * Get paginated user list with filters, excluding super admins for non-super-admin callers.
     * Non-admin callers are further scoped to users who share at least one branch with them.
     */
    public function getFilteredUsers(int $perPage = 15): LengthAwarePaginator
    {
        $user = auth()->user();
        $includeSuperAdmins = $user?->hasRole(RoleEnum::SUPER_ADMIN->value) ?? false;
        $isGlobal = $user?->hasAnyRole([RoleEnum::SUPER_ADMIN->value, RoleEnum::ADMIN->value]) ?? false;
        $branchIds = $isGlobal ? [] : ($user?->branches()->pluck('id')->toArray() ?? []);

        return $this->userRepository->paginateFilteredWithRoleScope($perPage, $includeSuperAdmins, $branchIds);
    }

    /**
     * Get a single user by ID with roles and permissions.
     */
    public function getUser(string $id): User
    {
        return $this->userRepository->findOrFail($id, ['roles', 'permissions']);
    }

    /**
     * Create a new user with hashed password, auto-derived username, and role/permission sync.
     */
    public function createUser(UserData $data): User
    {
        $userData = $data->toArray();

        // ? Auto-derive username from email when not provided
        if (empty($userData['username'])) {
            $base = strtolower(preg_replace('/[^a-z0-9_]/i', '_', explode('@', $data->email)[0]));
            $username = $base;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $base . $counter;
                $counter++;
            }
            $userData['username'] = $username;
        }

        // ? Default password to 'password' when not provided
        $userData['password'] = isset($userData['password'])
            ? Hash::make($userData['password'])
            : Hash::make('password');

        $user = $this->userRepository->create($userData);

        // ? Sync roles if provided
        if ($data->roles !== null) {
            $user->syncRoles($data->roles);
        }

        // ? Sync permissions and track revoked role permissions
        if ($data->permissions !== null) {
            $this->syncPermissionsWithRevoked($user, $data->roles ?? [], $data->permissions);
        }

        return $user->load(['roles', 'permissions']);
    }

    /**
     * Update an existing user with optional role/permission sync.
     */
    public function updateUser(string $id, UserData $data): User
    {
        $userData = $data->toArray();
        if (isset($userData['password'])) {
            $userData['password'] = Hash::make($userData['password']);
        }

        $user = $this->userRepository->update($id, $userData);

        // ? Sync roles if provided
        if ($data->roles !== null) {
            $user->syncRoles($data->roles);
        }

        // ? Sync permissions and track revoked role permissions
        if ($data->permissions !== null) {
            $this->syncPermissionsWithRevoked($user, $data->roles ?? [], $data->permissions);
        }

        return $user->load(['roles', 'permissions']);
    }

    /**
     * Delete a user (cannot delete yourself).
     */
    public function deleteUser(string $id): bool
    {
        $user = $this->userRepository->findOrFail($id);

        abort_if($user->id === auth()->id(), 422, 'You cannot delete your own account.');

        return $this->userRepository->delete($id);
    }

    /**
     * Toggle the active status of a user.
     */
    public function toggleActive(string $id): User
    {
        $user = $this->userRepository->findOrFail($id);

        abort_if($user->id === auth()->id(), 422, 'You cannot deactivate your own account.');

        $user->is_active = ! $user->is_active;
        $user->save();

        return $user->load(['roles', 'permissions']);
    }

    /**
     * Sync roles for a user (replaces all existing roles).
     *
     * @param  array<string>  $roles
     */
    public function assignRoles(string $id, array $roles): User
    {
        $user = $this->userRepository->findOrFail($id);

        $user->syncRoles($roles);

        activity()
            ->causedBy(auth()->user())
            ->performedOn($user)
            ->event('roles_synced')
            ->log("Roles updated for user {$user->name}: " . implode(', ', $roles));

        return $user->load(['roles', 'permissions']);
    }

    /**
     * Sync direct permissions to a user.
     *
     * @param  array<string>  $permissions
     */
    public function assignPermissions(string $id, array $permissions): User
    {
        $user = $this->userRepository->findOrFail($id);

        $user->syncPermissions($permissions);

        activity()
            ->causedBy(auth()->user())
            ->performedOn($user)
            ->event('permissions_synced')
            ->log("Permissions updated for user {$user->name}.");

        return $user->load(['roles', 'permissions']);
    }

    /**
     * Generate a 60-minute impersonation token for a target user.
     *
     * @return array{user: User, token: string}
     */
    public function impersonate(string $id): array
    {
        $targetUser = $this->userRepository->findOrFail($id);

        abort_if($targetUser->id === auth()->id(), 422, 'You cannot impersonate yourself.');
        abort_if($targetUser->hasRole(RoleEnum::SUPER_ADMIN->value), 403, 'Super admin accounts cannot be impersonated.');

        // ? Revoke any existing impersonation tokens before creating a new one
        $targetUser->tokens()->where('name', 'impersonation_token')->delete();

        $token = $targetUser->createToken(
            'impersonation_token',
            expiresAt: now()->addMinutes(60)
        )->plainTextToken;

        activity()
            ->causedBy(auth()->user())
            ->performedOn($targetUser)
            ->event('login_as')
            ->log(auth()->user()->name . " logged in as {$targetUser->name}.");

        return ['user' => $targetUser->load(['roles', 'permissions']), 'token' => $token];
    }

    /**
     * Revoke all active tokens for a user (force logout).
     */
    public function revokeAllTokens(string $id): bool
    {
        $user = $this->userRepository->findOrFail($id);

        $user->tokens()->delete();

        activity()
            ->causedBy(auth()->user())
            ->performedOn($user)
            ->event('sessions_revoked')
            ->log("All sessions revoked for user {$user->name}.");

        return true;
    }

    /**
     * Get all available roles (system + custom) from the database.
     * Super admin role is only visible to super admin callers.
     *
     * @return array<array{name: string, label: string, description: string, permissions_count: int, is_system: bool}>
     */
    public function getAvailableRoles(): array
    {
        $isSuperAdmin = auth()->user()?->hasRole(RoleEnum::SUPER_ADMIN->value) ?? false;

        // ? Load all roles from DB, filter super_admin for non-super-admin callers
        return $this->roleRepository->getAllWithPermissionsCount()
            ->filter(fn (Role $role) => $isSuperAdmin || $role->name !== RoleEnum::SUPER_ADMIN->value)
            ->map(function (Role $role) {
                $isSystem = in_array($role->name, self::SYSTEM_ROLES, true);
                $enumRole = $isSystem ? RoleEnum::tryFrom($role->name) : null;

                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => $enumRole ? $enumRole->label() : ucwords(str_replace('_', ' ', $role->name)),
                    'description' => $enumRole ? $enumRole->description() : "Custom role: {$role->name}",
                    'permissions_count' => $role->permissions_count,
                    'is_system' => $isSystem,
                    'permissions' => PermissionsResource::collection($role->getAllPermissions()),
                ];
                // return new RoleResource($role);
            })
            ->sortBy('is_system')
            ->values()
            ->all();
    }

    /**
     * Get all available permissions grouped by category from config.
     *
     * @return array<string, array<string, string>>
     */
    public function getAvailablePermissions(): array
    {
        // ? Use super_admin permissions as the source of truth for all available permissions
        return config('swiftflitz.permissions.super_admin', []);
    }

    /**
     * Create a new custom role with optional permissions.
     *
     * @param  array<string>  $permissions
     */
    public function createRole(string $name, array $permissions): Role
    {
        abort_if(
            $this->roleRepository->existsByName($name),
            422,
            "A role named '{$name}' already exists."
        );

        /** @var Role $role */
        $role = $this->roleRepository->create(['name' => $name, 'guard_name' => 'web']);

        if (! empty($permissions)) {
            $role->syncPermissions($permissions);
        }

        return $role->load('permissions');
    }

    /**
     * Update an existing role's name and/or permissions.
     *
     * @param  array<string>  $permissions
     */
    public function updateRole(string $role, ?string $newName, ?string $description, ?array $permissions): Role
    {
        $role = $this->roleRepository->findByName($role);

        abort_if($role === null, 404, "Role '{$role->name}' not found.");

        if ($newName && $newName !== $role->name) {
            abort_if(
                in_array($role->name, self::SYSTEM_ROLES, true),
                403,
                "System role '{$role->name}' cannot be renamed."
            );
            abort_if(
                $this->roleRepository->existsByName($newName),
                422,
                "A role named '{$newName}' already exists."
            );
            $role->name = $newName;
            $role->save();
        }

        if ($description !== null) {
            $role->description = $description;
            $role->save();
        }

        $role->syncPermissions($permissions);

        return $role->load('permissions');
    }

    /**
     * Delete a custom role (system roles are protected).
     */
    public function deleteRole(string $role): bool
    {
        $role = $this->roleRepository->findByName($role);

        abort_if(
            in_array($role->name, self::SYSTEM_ROLES, true),
            403,
            "System role '{$role->name}' cannot be deleted."
        );

        abort_if($role === null, 404, "Role '{$role->name}' not found.");

        $role->delete();

        return true;
    }

    /**
     * Sync branch assignments for a user.
     *
     * @param  array<string>  $branchIds
     */
    public function syncBranches(User $user, array $branchIds): User
    {
        $user->branches()->sync($branchIds);

        activity()
            ->causedBy(auth()->user())
            ->performedOn($user)
            ->event('branches_synced')
            ->log("Branch assignments updated for user {$user->name}.");

        return $user->load(['roles', 'permissions', 'branches']);
    }

    /* Sync a user's direct permissions and compute revoked role permissions.
    *
    * Permissions explicitly provided by the caller are treated as the desired
    * effective set. Any permission that belongs to a selected role but is NOT
    * present in $desiredPermissions is stored in revoked_permissions so that
    * the User model can suppress it even though the role still grants it.
    *
    * @param  array<string>  $roles
    * @param  array<string>  $desiredPermissions
    */
    private function syncPermissionsWithRevoked(User $user, array $roles, array $desiredPermissions): void
    {
        // ? Collect all permissions granted by the selected roles
        $rolePermissions = collect($roles)
            ->flatMap(fn (string $roleName) => Role::where('name', $roleName)->first()?->permissions?->pluck('name') ?? collect())
            ->unique()
            ->values()
            ->all();

        // ? Permissions revoked = in role but NOT in the desired set
        $revoked = array_values(array_diff($rolePermissions, $desiredPermissions));

        // ? Direct permissions = in desired set but NOT already granted by a role
        $extraDirect = array_values(array_diff($desiredPermissions, $rolePermissions));

        $user->syncPermissions($extraDirect);
        $user->update(['revoked_permissions' => empty($revoked) ? null : $revoked]);
    }
}
