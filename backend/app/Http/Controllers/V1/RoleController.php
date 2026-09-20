<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Services\Contracts\UserServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected UserServiceInterface $userService,
    ) {}

    /**
     * GET /api/roles
     * Get all roles (system from enum + custom) with labels, descriptions, and permission counts.
     */
    public function index(): JsonResponse
    {
        $roles = $this->userService->getAvailableRoles();

        return $this->successResponse($roles);
    }

    /**
     * POST /api/roles
     * Create a new custom role with optional permissions (from config).
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $this->authorize('create', Role::class);

        $role = $this->userService->createRole(
            $request->validated('name'),
            $request->validated('permissions', [])
        );

        return $this->createdResponse($role, 'Role created successfully.');
    }

    /**
     * PUT /api/roles/{role}
     * Update a role's permissions. System roles defined by enum cannot be renamed.
     */
    public function update(UpdateRoleRequest $request, string $role): JsonResponse
    {
        $roleModel = Role::findByName($role);
        $this->authorize('update', $roleModel);

        $updated = $this->userService->updateRole(
            $role,
            $request->validated('name'),
            $request->validated('description'),
            $request->validated('permissions', [])
        );

        return $this->successResponse($updated, 'Role updated successfully.');
    }

    /**
     * DELETE /api/roles/{role}
     * Delete a custom role. System roles from enum cannot be deleted.
     */
    public function destroy(string $role): JsonResponse
    {
        $roleModel = Role::findByName($role);
        $this->authorize('delete', $roleModel);

        $this->userService->deleteRole($role);

        return $this->noContentResponse();
    }

    /**
     * GET /api/roles/permissions
     * Get all available permissions grouped by category (from config).
     */
    public function permissions(): JsonResponse
    {
        $permissions = $this->userService->getAvailablePermissions();

        return $this->successResponse($permissions);
    }

    /**
     * GET /api/roles/{role}/users
     * Get all users that belong to a specific role.
     */
    public function users(Request $request, string $roleName): JsonResponse
    {
        $role = Role::findByName($roleName);

        $users = $role->users()->with('roles')->paginate($request->integer('per_page', 15));

        return $this->successResponse(UserResource::collection($users));
    }
}
