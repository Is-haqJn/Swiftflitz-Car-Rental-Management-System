<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SmsTemplateResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'key' => $this->key,
            'name' => $this->name,
            'description' => $this->description,
            'body' => $this->body,
            'default_body' => $this->default_body,
            'is_customised' => $this->isCustomised(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
