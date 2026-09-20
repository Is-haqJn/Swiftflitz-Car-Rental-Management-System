<?php

namespace App\Repositories\Contracts;

use App\Models\Airport;
use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AirportRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAll(): Collection;

    public function getActive(): Collection;

    public function getAirport(string $id): Airport;

    public function createAirport(array $data): Airport;

    public function updateAirport(string $id, array $data): Airport;

    public function deleteAirport(string $id): bool;
}
