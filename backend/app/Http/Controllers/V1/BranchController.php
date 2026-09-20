<?php

namespace App\Http\Controllers\V1;

use App\DTOs\BranchData;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignManagersRequest;
use App\Http\Requests\StoreBranchRequest;
use App\Http\Requests\UpdateBranchRequest;
use App\Http\Requests\VacateBranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\Branch;
use App\Services\Contracts\BranchServiceInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class BranchController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BranchServiceInterface $branchService,
    ) {}

    /**
     * GET /api/v1/branches
     * Paginated list of all branches.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Branch::class);

        $branches = $this->branchService->getAll();

        return $this->successResponse(BranchResource::collection($branches));
    }

    /**
     * GET /api/v1/branches/active
     * Flat list of active branches (for dropdowns).
     */
    public function active(): JsonResponse
    {
        $this->authorize('viewAny', Branch::class);

        $branches = $this->branchService->getActive();

        return $this->successResponse(BranchResource::collection($branches));
    }

    /**
     * POST /api/v1/branches
     */
    public function store(StoreBranchRequest $request): JsonResponse
    {
        $this->authorize('create', Branch::class);

        $branch = $this->branchService->create(BranchData::fromRequest($request->validated()));

        return $this->createdResponse(new BranchResource($branch), 'Branch created successfully.');
    }

    /**
     * GET /api/v1/branches/{branch}
     */
    public function show(Branch $branch): JsonResponse
    {
        $this->authorize('view', $branch);

        $branch->load('managers');

        return $this->successResponse(new BranchResource($branch));
    }

    /**
     * PUT /api/v1/branches/{branch}
     */
    public function update(UpdateBranchRequest $request, Branch $branch): JsonResponse
    {
        $this->authorize('update', $branch);

        $updated = $this->branchService->update($branch->id, $request->validated());

        return $this->successResponse(new BranchResource($updated), 'Branch updated successfully.');
    }

    /**
     * DELETE /api/v1/branches/{branch}
     */
    public function destroy(Branch $branch): JsonResponse
    {
        $this->authorize('delete', $branch);

        $this->branchService->delete($branch->id);

        return $this->noContentResponse();
    }

    /**
     * PATCH /api/v1/branches/{branch}/toggle-active
     */
    public function toggleActive(Branch $branch): JsonResponse
    {
        $this->authorize('update', $branch);

        $updated = $this->branchService->toggleActive($branch->id);

        $status = $updated->is_active ? 'activated' : 'deactivated';

        return $this->successResponse(new BranchResource($updated), "Branch {$status} successfully.");
    }

    /**
     * POST /api/v1/branches/{branch}/vacate
     * Unassign or transfer all vehicles from a branch, then it can be safely deleted.
     */
    public function vacate(VacateBranchRequest $request, Branch $branch): JsonResponse
    {
        $this->authorize('delete', $branch);

        $this->branchService->vacate($branch, $request->validated());

        return $this->successResponse(null, 'Branch vacated successfully.');
    }

    /**
     * POST /api/v1/branches/{branch}/managers
     */
    public function assignManagers(AssignManagersRequest $request, Branch $branch): JsonResponse
    {
        $this->authorize('manageMembers', $branch);

        $updated = $this->branchService->syncManagers($branch, $request->validated('user_ids'));

        return $this->successResponse(new BranchResource($updated), 'Managers assigned successfully.');
    }
}
