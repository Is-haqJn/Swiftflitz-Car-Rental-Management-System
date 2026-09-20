<?php

namespace App\DTOs;

readonly class DriverData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $phoneNumber,
        public string $dateOfBirth,
        public string $licenseNumber,
        public string $licenseClass,
        public string $licenseExpiryDate,
        public ?string $email = null,
        public ?string $address = null,
        public ?string $city = null,
        public ?string $idType = null,
        public ?string $idNumber = null,
        public ?string $idExpiryDate = null,
        public ?bool $licenseVerified = null,
        public ?string $emergencyContactName = null,
        public ?string $emergencyContactPhone = null,
        public ?string $emergencyContactRelation = null,
        public ?bool $availableForChauffeur = null,
        public ?bool $availableForAirport = null,
        public ?string $status = null,
        public ?string $notes = null,
        public ?bool $isActive = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            firstName: $data['first_name'],
            lastName: $data['last_name'],
            phoneNumber: $data['phone_number'],
            dateOfBirth: $data['date_of_birth'],
            licenseNumber: $data['license_number'],
            licenseClass: $data['license_class'],
            licenseExpiryDate: $data['license_expiry_date'],
            email: $data['email'] ?? null,
            address: $data['address'] ?? null,
            city: $data['city'] ?? null,
            idType: $data['id_type'] ?? null,
            idNumber: $data['id_number'] ?? null,
            idExpiryDate: $data['id_expiry_date'] ?? null,
            licenseVerified: isset($data['license_verified']) ? (bool) $data['license_verified'] : null,
            emergencyContactName: $data['emergency_contact_name'] ?? null,
            emergencyContactPhone: $data['emergency_contact_phone'] ?? null,
            emergencyContactRelation: $data['emergency_contact_relation'] ?? null,
            availableForChauffeur: isset($data['available_for_chauffeur']) ? (bool) $data['available_for_chauffeur'] : null,
            availableForAirport: isset($data['available_for_airport']) ? (bool) $data['available_for_airport'] : null,
            status: $data['status'] ?? null,
            notes: $data['notes'] ?? null,
            isActive: isset($data['is_active']) ? (bool) $data['is_active'] : null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
            'phone_number' => $this->phoneNumber,
            'date_of_birth' => $this->dateOfBirth,
            'license_number' => $this->licenseNumber,
            'license_class' => $this->licenseClass,
            'license_expiry_date' => $this->licenseExpiryDate,
            'email' => $this->email,
            'address' => $this->address,
            'city' => $this->city,
            'id_type' => $this->idType,
            'id_number' => $this->idNumber,
            'id_expiry_date' => $this->idExpiryDate,
            'license_verified' => $this->licenseVerified,
            'emergency_contact_name' => $this->emergencyContactName,
            'emergency_contact_phone' => $this->emergencyContactPhone,
            'emergency_contact_relation' => $this->emergencyContactRelation,
            'available_for_chauffeur' => $this->availableForChauffeur,
            'available_for_airport' => $this->availableForAirport,
            'status' => $this->status,
            'notes' => $this->notes,
            'is_active' => $this->isActive,
        ];

        return array_filter($data, fn ($value) => $value !== null);
    }
}
