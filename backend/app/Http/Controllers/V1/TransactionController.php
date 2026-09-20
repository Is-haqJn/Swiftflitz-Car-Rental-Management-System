<?php

namespace App\Http\Controllers\V1;

use App\Enums\PaymentTransactionStatus;
use App\Events\PaymentStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentTransactionResource;
use App\Models\PaymentTransaction;
use App\Repositories\Contracts\PaymentTransactionRepositoryInterface;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PaymentTransactionRepositoryInterface $repository,
    ) {}

    /**
     * GET /api/v1/transactions
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', PaymentTransaction::class);

        $perPage = (int) request()->input('per_page', 20);
        $paginated = $this->repository->paginateFiltered($perPage);
        $stats = $this->repository->summaryStats();

        $items = PaymentTransactionResource::collection($paginated->items());

        return response()->json([
            'data' => $items,
            'stats' => $stats,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem() ?? 0,
                'to' => $paginated->lastItem() ?? 0,
            ],
            'links' => [
                'first' => $paginated->url(1),
                'last' => $paginated->url($paginated->lastPage()),
                'prev' => $paginated->previousPageUrl(),
                'next' => $paginated->nextPageUrl(),
            ],
        ]);
    }

    /**
     * GET /api/v1/transactions/trends
     * Returns a per-day collected/refunded trend series plus channel breakdown
     * for the transactions page charts. Branch-scoped for non-admin users.
     */
    public function trends(Request $request): JsonResponse
    {
        $this->authorize('viewAny', PaymentTransaction::class);

        $request->validate([
            'period' => ['sometimes', 'string', 'in:7d,30d,90d'],
            'branch_id' => ['sometimes', 'nullable', 'string'],
        ]);

        $period = $request->input('period', '30d');
        $days = (int) str_replace('d', '', $period);

        $to = Carbon::now()->endOfDay();
        $from = Carbon::now()->subDays($days - 1)->startOfDay();

        /** @var \App\Models\User|null $user */
        $user = $request->user();
        $branchIds = [];

        if ($request->filled('branch_id')) {
            $branchIds = [$request->input('branch_id')];
        } elseif ($user && ! $user->hasAnyRole(['super_admin', 'admin'])) {
            $branchIds = $user->branches()->pluck('id')->toArray();
            if (empty($branchIds)) {
                return $this->successResponse([
                    'period' => $period,
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                    'trend' => [],
                    'channels' => [],
                ]);
            }
        }

        return $this->successResponse([
            'period' => $period,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'trend' => $this->repository->trendSeries($from, $to, $branchIds),
            'channels' => $this->repository->channelBreakdown($from, $to, $branchIds),
        ]);
    }

    /**
     * GET /api/v1/transactions/{transaction}
     */
    public function show(PaymentTransaction $transaction): JsonResponse
    {
        $this->authorize('view', $transaction);

        $transaction = $this->repository->findTransaction($transaction->id);

        return $this->successResponse(new PaymentTransactionResource($transaction));
    }

    /**
     * POST /api/v1/transactions/{transaction}/resolve
     * Manually approve or reject an under-review payment transaction.
     */
    public function resolve(PaymentTransaction $transaction, Request $request): JsonResponse
    {
        if (! $request->user()->can('transactions.resolve')) {
            abort(403, 'You do not have permission to resolve transactions.');
        }

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        if ($transaction->status !== PaymentTransactionStatus::UnderReview) {
            return response()->json([
                'message' => 'Only under-review transactions can be resolved.',
            ], 422);
        }

        $metadata = array_merge($transaction->metadata ?? [], [
            'resolved_by' => $request->user()->id,
            'resolved_at' => now()->toISOString(),
            'resolution' => $validated['action'],
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($validated['action'] === 'approve') {
            $transaction->update([
                'status' => PaymentTransactionStatus::Paid,
                'paid_at' => now(),
                'metadata' => $metadata,
            ]);

            event(new PaymentStatusUpdated($transaction->fresh()));

            return $this->successResponse(null, 'Transaction approved and marked as paid.');
        }

        $transaction->update([
            'status' => PaymentTransactionStatus::Failed,
            'metadata' => $metadata,
        ]);

        event(new PaymentStatusUpdated($transaction->fresh()));

        return $this->successResponse(null, 'Transaction rejected and marked as failed.');
    }
}
