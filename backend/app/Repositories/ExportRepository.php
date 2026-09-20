<?php

namespace App\Repositories;

use App\Models\ExportRecord;
use App\Repositories\Base\BaseRepository;
use App\Repositories\Contracts\ExportRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;

class ExportRepository extends BaseRepository implements ExportRepositoryInterface
{
    /**
     * Get the most recent export records belonging to a user.
     *
     * @return Collection<int, ExportRecord>
     */
    public function getForUser(string $userId, int $limit = 30): Collection
    {
        return $this->model
            ->where('user_id', $userId)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Find a specific export record belonging to a user, or return null.
     */
    public function findForUser(string $userId, string $exportId): ?ExportRecord
    {
        return $this->model
            ->where('user_id', $userId)
            ->where('id', $exportId)
            ->first();
    }

    /**
     * Delete the given export record and its associated file from storage.
     */
    public function deleteRecord(ExportRecord $export): bool
    {
        if ($export->file_path && Storage::exists($export->file_path)) {
            Storage::delete($export->file_path);
        }

        return (bool) $export->delete();
    }

    /**
     * Specify the model class name.
     */
    protected function model(): string
    {
        return ExportRecord::class;
    }
}
