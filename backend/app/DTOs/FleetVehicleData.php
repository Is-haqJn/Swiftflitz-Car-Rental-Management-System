<?php

namespace App\DTOs;

readonly class FleetVehicleData
{
    public function __construct(
        public string $branch_id,
        public string $make,
        public string $model,
        public int $year,
        public string $color,
        public string $license_plate,
        public int $seats,
        public bool $has_insurance,
        public bool $has_roadworthy,
        public ?array $features = null,
        public ?string $insurance_expiry_date = null,
        public ?string $roadworthy_expiry_date = null,
        public ?string $status = null,
        public bool $is_active = true,
        public bool $is_featured = false,
        public ?string $notes = null,
        public ?string $description = null,
        public ?array $airport_packages = null,
        public ?array $chauffeur_service = null,
        public ?string $transmission = null,
        public ?string $fuel_type = null,
        public ?string $engine = null,
        public ?string $default_driver_id = null,
        public bool $is_personal_vehicle = false,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            branch_id: $data['branch_id'],
            make: $data['make'],
            model: $data['model'],
            year: (int) $data['year'],
            color: $data['color'],
            license_plate: $data['license_plate'],
            seats: (int) $data['seats'],
            has_insurance: (bool) ($data['has_insurance'] ?? true),
            has_roadworthy: (bool) ($data['has_roadworthy'] ?? true),
            features: $data['features'] ?? null,
            insurance_expiry_date: $data['insurance_expiry_date'] ?? null,
            roadworthy_expiry_date: $data['roadworthy_expiry_date'] ?? null,
            status: $data['status'] ?? null,
            is_active: (bool) ($data['is_active'] ?? true),
            is_featured: (bool) ($data['is_featured'] ?? false),
            notes: $data['notes'] ?? null,
            description: $data['description'] ?? null,
            airport_packages: $data['airport_packages'] ?? null,
            chauffeur_service: $data['chauffeur_service'] ?? null,
            transmission: $data['transmission'] ?? null,
            fuel_type: $data['fuel_type'] ?? null,
            engine: $data['engine'] ?? null,
            default_driver_id: $data['default_driver_id'] ?? null,
            is_personal_vehicle: (bool) ($data['is_personal_vehicle'] ?? false),
        );
    }

    public function toArray(): array
    {
        // airport_packages and chauffeur_service are handled separately by the service layer
        return array_filter([
            'branch_id' => $this->branch_id,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'color' => $this->color,
            'license_plate' => $this->license_plate,
            'seats' => $this->seats,
            'has_insurance' => $this->has_insurance,
            'has_roadworthy' => $this->has_roadworthy,
            'features' => $this->features,
            'insurance_expiry_date' => $this->insurance_expiry_date,
            'roadworthy_expiry_date' => $this->roadworthy_expiry_date,
            'status' => $this->status,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'notes' => $this->notes,
            'description' => $this->description,
            'transmission' => $this->transmission,
            'fuel_type' => $this->fuel_type,
            'engine' => $this->engine,
        ], fn ($v) => $v !== null) + [
            'default_driver_id' => $this->default_driver_id,
            'is_personal_vehicle' => $this->is_personal_vehicle,
        ];
    }
}
