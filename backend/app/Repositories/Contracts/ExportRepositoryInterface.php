<?php

namespace App\Repositories\Contracts;

use App\Models\ExportRecord;
use App\Models\User;
use App\Repositories\Base\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface ExportRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Get the most recent export records belonging to a user.
     *
     * @return Collection<int, ExportRecord>
     */
    public function getForUser(string $userId, int $limit = 50): Collection;

    /**
     * Find a specific export record belonging to a user, or return null.
     */
    public function findForUser(string $userId, string $exportId): ?ExportRecord;

    /**
     * Delete the given export record and its associated file from storage.
     */
    public function deleteRecord(ExportRecord $export): bool;
}
