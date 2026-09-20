<?php

namespace App\DTOs;

readonly class VehicleData
{
    public function __construct(
        public ?string $categoryId,
        public ?string $branchId,
        public string $name,
        public string $make,
        public string $model,
        public string $roadworthyExpiryDate,
        public string $insuranceExpiryDate,
        public int $year,
        public string $licensePlate,
        public ?string $vin,
        public string $color,
        public int $seats,
        public string $fuelType,
        public ?string $engineSize,
        public ?int $odometer,
        public string $transmission,
        public ?array $features,
        public float $dailyRate,
        public ?float $securityDeposit = null,
        public ?int $youngDriverAgeThreshold = null,
        public ?float $youngDriverDeposit = null,
        public ?bool $hasInsurance = null,
        public ?bool $hasRoadworthy = null,
        public ?bool $priceVisible = null,
        public ?string $status = null,
        public ?string $conditionNotes = null,
        public ?bool $isFeatured = null,
        public ?string $description = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            categoryId: $data['category_id'] ?? null,
            branchId: $data['branch_id'] ?? null,
            name: $data['name'],
            make: $data['make'],
            model: $data['model'],
            year: $data['year'],
            roadworthyExpiryDate: $data['roadworthy_expiry_date'],
            insuranceExpiryDate: $data['insurance_expiry_date'],
            licensePlate: $data['license_plate'],
            vin: $data['vin'] ?? null,
            color: $data['color'],
            seats: $data['seats'],
            fuelType: $data['fuel_type'],
            engineSize: $data['engine_size'] ?? null,
            odometer: $data['odometer'] ?? null,
            transmission: $data['transmission'],
            features: $data['features'] ?? null,
            dailyRate: $data['daily_rate'],
            securityDeposit: isset($data['security_deposit']) ? (float) $data['security_deposit'] : null,
            youngDriverAgeThreshold: isset($data['young_driver_age_threshold']) ? (int) $data['young_driver_age_threshold'] : null,
            youngDriverDeposit: isset($data['young_driver_deposit']) ? (float) $data['young_driver_deposit'] : null,
            hasInsurance: isset($data['has_insurance']) ? (bool) $data['has_insurance'] : null,
            hasRoadworthy: isset($data['has_roadworthy']) ? (bool) $data['has_roadworthy'] : null,
            priceVisible: $data['price_visible'] ?? null,
            status: $data['status'] ?? null,
            conditionNotes: $data['condition_notes'] ?? null,
            isFeatured: $data['is_featured'] ?? null,
            description: $data['description'] ?? null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'category_id' => $this->categoryId,
            'branch_id' => $this->branchId,
            'name' => $this->name,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'roadworthy_expiry_date' => $this->roadworthyExpiryDate,
            'insurance_expiry_date' => $this->insuranceExpiryDate,
            'license_plate' => $this->licensePlate,
            'vin' => $this->vin,
            'color' => $this->color,
            'seats' => $this->seats,
            'fuel_type' => $this->fuelType,
            'engine_size' => $this->engineSize,
            'odometer' => $this->odometer,
            'has_insurance' => $this->hasInsurance,
            'has_roadworthy' => $this->hasRoadworthy,
            'transmission' => $this->transmission,
            'features' => $this->features,
            'daily_rate' => $this->dailyRate,
            'security_deposit' => $this->securityDeposit,
            'young_driver_age_threshold' => $this->youngDriverAgeThreshold,
            'young_driver_deposit' => $this->youngDriverDeposit,
            'price_visible' => $this->priceVisible,
            'status' => $this->status,
            'condition_notes' => $this->conditionNotes,
            'is_featured' => $this->isFeatured,
            'description' => $this->description,
        ];

        return array_filter($data, fn ($value) => $value !== null);
    }

    public function toArrayForUpdate(): array
    {
        return array_filter($this->toArray(), function ($value) {
            return $value !== null;
        });
    }
}
