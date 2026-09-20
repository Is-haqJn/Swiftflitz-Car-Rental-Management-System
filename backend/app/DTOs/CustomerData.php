<?php

namespace App\DTOs;

readonly class CustomerData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $phone,
        public ?string $address = null,
        public ?string $licenseNumber = null,
        public ?string $licenseExpiryDate = null,
        public ?string $idType = null,
        public ?string $idNumber = null,
        public ?string $altPhone = null,
        public ?string $dateOfBirth = null,
        public ?array $emergencyContact = null,
        public ?string $notes = null,
        public ?bool $isBlacklisted = null,
        public ?string $blacklistReason = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            phone: $data['phone'],
            address: $data['address'] ?? null,
            licenseNumber: $data['license_number'] ?? null,
            licenseExpiryDate: $data['license_expiry_date'] ?? null,
            idType: $data['id_type'] ?? null,
            idNumber: $data['id_number'] ?? null,
            altPhone: $data['alt_phone'] ?? null,
            dateOfBirth: $data['date_of_birth'] ?? null,
            emergencyContact: $data['emergency_contact'] ?? null,
            notes: $data['notes'] ?? null,
            isBlacklisted: $data['is_blacklisted'] ?? null,
            blacklistReason: $data['blacklist_reason'] ?? null,
        );
    }

    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'license_number' => $this->licenseNumber,
            'license_expiry_date' => $this->licenseExpiryDate,
            'id_type' => $this->idType,
            'id_number' => $this->idNumber,
            'alt_phone' => $this->altPhone,
            'date_of_birth' => $this->dateOfBirth,
            'emergency_contact' => $this->emergencyContact,
            'notes' => $this->notes,
            'is_blacklisted' => $this->isBlacklisted,
            'blacklist_reason' => $this->blacklistReason,
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
