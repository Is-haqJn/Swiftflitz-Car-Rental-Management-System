<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmailTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'key' => $this->key,
            'name' => $this->name,
            'description' => $this->description,
            'subject' => $this->subject,
            'default_subject' => $this->default_subject,
            'html_content' => $this->html_content,
            'default_html' => $this->default_html,
            'is_customised' => $this->isCustomised(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
