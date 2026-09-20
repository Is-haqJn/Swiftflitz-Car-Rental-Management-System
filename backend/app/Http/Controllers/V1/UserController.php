<?php

namespace App\Http\Controllers\V1;

use App\DTOs\UserData;
use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignPermissionsRequest;
use App\Http\Requests\AssignRolesRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\UsersResource;
use App\Models\Role;
use App\Models\User;
use App\Services\Contracts\UserServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Laravel\Sanctum\PersonalAccessToken;
use Spatie\Activitylog\Models\Activity;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected UserServiceInterface $userService,
    ) {}

    /**
     * GET /api/users
     * List all users with pagination and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $users = $this->userService->getFilteredUsers($request->integer('per_page', 15));

        return $this->successResponse(UsersResource::collection($users));
    }

    /**
     * POST /api/users
     * Create a new user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = $this->userService->createUser(UserData::fromRequest($request->validated()));

        // ? Assign initial role if provided
        if ($request->has('role')) {
            $user->syncRoles([$request->validated('role')]);
        }

        return $this->createdResponse(new UsersResource($user), 'User created successfully.');
    }

    /**
     * GET /api/users/{user}
     * Get a single user with roles and permissions.
     */
    public function show(User $user): JsonResponse
    {
        $user->load(['roles', 'permissions', 'branches']);

        return $this->successResponse(new UsersResource($user));
    }

    /**
     * PUT /api/users/{user}
     * Update an existing user.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $updated = $this->userService->updateUser($user->id, UserData::fromRequest($request->validated()));

        return $this->successResponse(new UsersResource($updated), 'User updated successfully.');
    }

    /**
     * DELETE /api/users/{user}
     * Delete a user.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->userService->deleteUser($user->id);

        return $this->noContentResponse();
    }

    /**
     * PATCH /api/users/{user}/toggle-active
     * Toggle user active/inactive status.
     */
    public function toggleActive(User $user): JsonResponse
    {
        $updated = $this->userService->toggleActive($user->id);

        $status = $updated->is_active ? 'activated' : 'deactivated';

        return $this->successResponse(new UserResource($updated), "User {$status} successfully.");
    }

    /**
     * PUT /api/users/{user}/roles
     * Sync roles for a user.
     */
    public function assignRoles(AssignRolesRequest $request, User $user): JsonResponse
    {
        $updated = $this->userService->assignRoles($user->id, $request->validated('roles'));

        return $this->successResponse(new UserResource($updated), 'Roles updated successfully.');
    }

    /**
     * PUT /api/users/{user}/permissions
     * Sync direct permissions for a user.
     */
    public function assignPermissions(AssignPermissionsRequest $request, User $user): JsonResponse
    {
        $updated = $this->userService->assignPermissions($user->id, $request->validated('permissions'));

        return $this->successResponse(new UserResource($updated), 'Permissions updated successfully.');
    }

    /**
     * POST /api/users/{user}/impersonate
     * Generate impersonation token (super admin only).
     */
    public function impersonate(User $user): JsonResponse
    {
        $this->authorize('impersonate', $user);

        $result = $this->userService->impersonate($user->id);

        return $this->authResponse(
            ['user' => new UserResource($result['user'])],
            $result['token'],
            'Impersonation token generated. Valid for 60 minutes.'
        );
    }

    /**
     * DELETE /api/users/{user}/sessions
     * Revoke all tokens for a user (force logout).
     */
    public function revokeSessions(User $user): JsonResponse
    {
        $this->userService->revokeAllTokens($user->id);

        return $this->successResponse(null, 'All sessions revoked successfully.');
    }

    /**
     * GET /api/users/roles/available
     * Get all available roles with descriptions.
     */
    public function availableRoles(): JsonResponse
    {
        return $this->successResponse($this->userService->getAvailableRoles());
    }

    /**
     * GET /api/users/permissions/available
     * Get all available permissions grouped by category.
     */
    public function availablePermissions(): JsonResponse
    {
        return $this->successResponse($this->userService->getAvailablePermissions());
    }

    /**
     * POST /api/users/{user}/branches
     * Sync branch assignments for a user.
     */
    public function assignBranches(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'branch_ids' => ['array'],
            'branch_ids.*' => ['string', 'exists:branches,id'],
        ]);

        $updated = $this->userService->syncBranches($user, $request->input('branch_ids'));

        return $this->successResponse(new UserResource($updated), 'Branch assignments updated successfully.');
    }

    /**
     * GET /api/activity-logs
     * Get activity logs with optional user filter. Super admin activity is excluded.
     */
    public function activityLogs(Request $request): JsonResponse
    {
        $superAdminIds = $this->superAdminIds();

        $query = Activity::query()
            ->with(['causer', 'subject'])
            ->where(function ($q) use ($superAdminIds): void {
                $q->whereNotIn('causer_id', $superAdminIds)
                    ->orWhereNull('causer_id');
            })
            ->latest();

        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->input('user_id'));
        }

        if ($request->filled('event')) {
            $query->where('event', $request->input('event'));
        }

        if ($request->filled('subject_type')) {
            $query->where('subject_type', 'like', '%' . $request->input('subject_type') . '%');
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $perPage = max(1, min(200, $request->integer('per_page', 15)));
        $logs = $query->paginate($perPage);

        return $this->successResponse(ActivityLogResource::collection($logs));
    }

    /**
     * GET /api/v1/admin/sessions
     * List all active sessions (personal access tokens) across all non-super-admin users.
     */
    public function allSessions(Request $request): JsonResponse
    {
        $superAdminIds = $this->superAdminIds();

        $tokens = PersonalAccessToken::query()
            ->with('tokenable:id,name,email')
            ->whereHasMorph('tokenable', [User::class], function ($q) use ($superAdminIds): void {
                $q->whereNotIn('id', $superAdminIds);
            })
            ->where('name', '!=', 'impersonation_token')
            ->orderByDesc('last_used_at')
            ->paginate($request->integer('per_page', 50));

        return response()->json([
            'status' => 'success',
            'message' => 'Request successful',
            'data' => $tokens->items(),
            'meta' => [
                'current_page' => $tokens->currentPage(),
                'last_page' => $tokens->lastPage(),
                'per_page' => $tokens->perPage(),
                'total' => $tokens->total(),
                'from' => $tokens->firstItem(),
                'to' => $tokens->lastItem(),
            ],
        ]);
    }

    /**
     * DELETE /api/v1/admin/sessions/{tokenId}
     * Revoke a specific session token by ID (admin action).
     */
    public function revokeAdminSession(string $tokenId): JsonResponse
    {
        $token = PersonalAccessToken::findOrFail($tokenId);
        $token->delete();

        return $this->successResponse(null, 'Session revoked successfully.');
    }

    /**
     * Returns all super admin user IDs, or an empty collection if the role does not yet exist.
     */
    private function superAdminIds(): Collection
    {
        $role = Role::where('name', RoleEnum::SUPER_ADMIN->value)->first();

        if (! $role) {
            return collect();
        }

        return User::role($role)->pluck('id');
    }
}
