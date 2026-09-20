<?php

namespace App\Http\Resources\Customers;

use App\Http\Resources\BranchResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'alt_phone' => $this->alt_phone,
            'address' => $this->address,
            'license_number' => $this->license_number,
            'license_expiry_date' => $this->license_expiry_date?->format('Y-m-d'),
            'id_type' => $this->id_type,
            'id_number' => $this->id_number,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'emergency_contact' => $this->emergency_contact,
            'notes' => $this->notes,
            'is_blacklisted' => $this->is_blacklisted,
            'blacklist_reason' => $this->blacklist_reason,
            'profile_status' => $this->profile_status?->value,
            'id_expiry_date' => $this->id_expiry_date?->format('Y-m-d'),

            // Media URLs
            'license_images' => $this->getMedia('license')->map(function ($media) {
                return [
                    'id' => $media->id,
                    'file_name' => $media->file_name,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'urls' => [
                        'original' => $media->getUrl(),
                        'thumb' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('thumb') : null,
                        'medium' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('medium') : null,
                        'large' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('large') : null,
                    ],
                    'created_at' => $media->created_at?->toISOString(),
                ];
            }),

            'id_document_images' => $this->getMedia('id_document')->map(function ($media) {
                return [
                    'id' => $media->id,
                    'file_name' => $media->file_name,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'urls' => [
                        'original' => $media->getUrl(),
                        'thumb' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('thumb') : null,
                        'medium' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('medium') : null,
                        'large' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('large') : null,
                    ],
                    'created_at' => $media->created_at?->toISOString(),
                ];
            }),

            'passport_images' => $this->getMedia('passport')->map(function ($media) {
                return [
                    'id' => $media->id,
                    'file_name' => $media->file_name,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'urls' => [
                        'original' => $media->getUrl(),
                        'thumb' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('thumb') : null,
                        'medium' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('medium') : null,
                        'large' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('large') : null,
                    ],
                    'created_at' => $media->created_at?->toISOString(),
                ];
            }),

            'additional_documents' => $this->getMedia('documents')->map(function ($media) {
                return [
                    'id' => $media->id,
                    'file_name' => $media->file_name,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'urls' => [
                        'original' => $media->getUrl(),
                        'thumb' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('thumb') : null,
                        'medium' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('medium') : null,
                        'large' => str_starts_with($media->mime_type, 'image/') ? $media->getUrl('large') : null,
                    ],
                    'created_at' => $media->created_at?->toISOString(),
                ];
            }),

            'branch_count' => $this->branches()->count(),
            'branches' => BranchResource::collection($this->whenLoaded('branches')),
            'rentals_count' => $this->when($this->rentals_count !== null, $this->rentals_count),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
