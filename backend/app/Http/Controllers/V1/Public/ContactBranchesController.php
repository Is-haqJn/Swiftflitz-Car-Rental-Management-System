<?php

namespace App\Http\Controllers\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Settings\ContactSettings;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ContactBranchesController extends Controller
{
    use ApiResponse;

    public function index(ContactSettings $settings): JsonResponse
    {
        if (! $settings->contact_branch_locations_enabled) {
            return $this->successResponse([]);
        }

        $ids = $settings->contact_branch_ids ?? [];

        if (empty($ids)) {
            return $this->successResponse([]);
        }

        $branches = Branch::whereIn('id', $ids)
            ->where('is_active', true)
            ->get(['id', 'name', 'address', 'phone', 'email'])
            ->keyBy('id');

        $ordered = collect($ids)
            ->filter(fn ($id) => $branches->has($id))
            ->map(fn ($id) => $branches->get($id))
            ->values();

        return $this->successResponse($ordered);
    }
}
