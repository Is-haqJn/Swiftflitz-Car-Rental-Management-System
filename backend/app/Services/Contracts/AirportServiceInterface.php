<?php

namespace App\Services\Contracts;

use App\DTOs\AirportData;
use App\Models\Airport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AirportServiceInterface
{
    public function getAll(): LengthAwarePaginator;

    public function getActive(): Collection;

    public function getAirport(string $id): Airport;

    public function create(AirportData $data): Airport;

    public function update(string $id, array $data): Airport;

    public function delete(string $id): bool;

    public function toggleActive(string $id): Airport;
}
