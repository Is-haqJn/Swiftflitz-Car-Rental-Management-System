<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class RentalInspectionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'rental_id' => $this->rental_id,
            'type' => $this->type?->value,
            'inspector_id' => $this->inspector_id,
            'inspector' => $this->whenLoaded('inspector', fn () => $this->inspector ? [
                'id' => $this->inspector->id,
                'name' => $this->inspector->name,
            ] : null),
            'fuel_level' => $this->fuel_level,
            'mileage' => $this->mileage,
            'condition_notes' => $this->condition_notes,
            'damage_noted' => $this->damage_noted,
            'damage_types' => $this->damage_types ?? [],
            'damage_severity' => $this->damage_severity,
            'damage_description' => $this->damage_description,
            'photos' => collect($this->photos ?? [])
                ->map(fn ($p) => Storage::disk('public')->url($p))
                ->values()
                ->all(),
            'swap_vehicle_id' => $this->swap_vehicle_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
