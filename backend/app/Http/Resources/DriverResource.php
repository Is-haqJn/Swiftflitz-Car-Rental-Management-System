<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DriverResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'phone_number' => $this->phone_number,
            'email' => $this->email,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'address' => $this->address,
            'city' => $this->city,

            // Identity
            'id_type' => $this->id_type,
            'id_number' => $this->id_number,
            'id_expiry_date' => $this->id_expiry_date?->format('Y-m-d'),
            'id_expired' => $this->id_expired,
            'id_expires_soon' => $this->id_expires_soon,

            // License
            'license_number' => $this->license_number,
            'license_class' => $this->license_class,
            'license_expiry_date' => $this->license_expiry_date?->format('Y-m-d'),
            'license_verified' => $this->license_verified,
            'license_expired' => $this->license_expired,
            'license_expires_soon' => $this->license_expires_soon,

            // Emergency contact
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'emergency_contact_relation' => $this->emergency_contact_relation,

            // Service assignment
            'available_for_chauffeur' => $this->available_for_chauffeur,
            'available_for_airport' => $this->available_for_airport,

            // Status
            'status' => $this->status,
            'is_active' => $this->is_active,
            'is_available' => $this->is_available,

            'notes' => $this->notes,

            // Media
            'driver_photo' => $this->getFirstMedia('driver_photo') ? [
                'id' => $this->getFirstMedia('driver_photo')->id,
                'file_name' => $this->getFirstMedia('driver_photo')->file_name,
                'mime_type' => $this->getFirstMedia('driver_photo')->mime_type,
                'size' => $this->getFirstMedia('driver_photo')->size,
                'urls' => [
                    'original' => $this->getFirstMediaUrl('driver_photo'),
                    'thumb' => $this->getFirstMediaUrl('driver_photo', 'thumb'),
                    'medium' => $this->getFirstMediaUrl('driver_photo', 'medium'),
                ],
            ] : null,

            'id_document' => $this->getFirstMedia('id_document') ? [
                'id' => $this->getFirstMedia('id_document')->id,
                'file_name' => $this->getFirstMedia('id_document')->file_name,
                'mime_type' => $this->getFirstMedia('id_document')->mime_type,
                'size' => $this->getFirstMedia('id_document')->size,
                'urls' => [
                    'original' => $this->getFirstMediaUrl('id_document'),
                    'thumb' => str_starts_with($this->getFirstMedia('id_document')->mime_type, 'image/') ? $this->getFirstMediaUrl('id_document', 'thumb') : null,
                    'medium' => str_starts_with($this->getFirstMedia('id_document')->mime_type, 'image/') ? $this->getFirstMediaUrl('id_document', 'medium') : null,
                ],
            ] : null,

            'license_photo' => $this->getFirstMedia('license_photo') ? [
                'id' => $this->getFirstMedia('license_photo')->id,
                'file_name' => $this->getFirstMedia('license_photo')->file_name,
                'mime_type' => $this->getFirstMedia('license_photo')->mime_type,
                'size' => $this->getFirstMedia('license_photo')->size,
                'urls' => [
                    'original' => $this->getFirstMediaUrl('license_photo'),
                    'thumb' => str_starts_with($this->getFirstMedia('license_photo')->mime_type, 'image/') ? $this->getFirstMediaUrl('license_photo', 'thumb') : null,
                    'medium' => str_starts_with($this->getFirstMedia('license_photo')->mime_type, 'image/') ? $this->getFirstMediaUrl('license_photo', 'medium') : null,
                ],
            ] : null,

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
