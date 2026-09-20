<?php

namespace App\Repositories;

use App\Models\ChauffeurCustomer;
use App\Repositories\Base\QueryableRepository;
use App\Repositories\Contracts\ChauffeurCustomerRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\QueryBuilder;

class ChauffeurCustomerRepository extends QueryableRepository implements ChauffeurCustomerRepositoryInterface
{
    public function query(): QueryBuilder
    {
        return QueryBuilder::for(ChauffeurCustomer::withCount('bookings'))
            ->allowedFilters($this->getAllowedFilters())
            ->allowedSorts($this->getAllowedSorts())
            ->allowedFields($this->getAllowedFields())
            ->allowedIncludes($this->getAllowedIncludes())
            ->with($this->getDefaultIncludes())
            ->defaultSort('-created_at');
    }

    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->paginateFiltered($perPage);
    }

    public function findCustomer(string $id): ChauffeurCustomer
    {
        return ChauffeurCustomer::with('bookings')->findOrFail($id);
    }

    public function findByEmail(string $email): ?ChauffeurCustomer
    {
        return ChauffeurCustomer::where('email', $email)->first();
    }

    public function createCustomer(array $data): ChauffeurCustomer
    {
        return ChauffeurCustomer::create($data);
    }

    public function updateCustomer(string $id, array $data): ChauffeurCustomer
    {
        $customer = ChauffeurCustomer::findOrFail($id);
        $customer->update($data);

        return $customer->fresh();
    }

    public function deleteCustomer(string $id): bool
    {
        return (bool) ChauffeurCustomer::findOrFail($id)->delete();
    }

    public function getAllowedFilters(): array
    {
        return ['full_name', 'email', 'phone'];
    }

    public function getAllowedSorts(): array
    {
        return ['created_at', 'full_name'];
    }

    protected function model(): string
    {
        return ChauffeurCustomer::class;
    }
}
