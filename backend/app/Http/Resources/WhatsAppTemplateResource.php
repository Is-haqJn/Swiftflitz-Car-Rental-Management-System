<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WhatsAppTemplateResource extends JsonResource
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
            'template_name' => $this->template_name,
            'default_template_name' => $this->default_template_name,
            'header' => $this->header,
            'default_header' => $this->default_header,
            'body' => $this->body,
            'default_body' => $this->default_body,
            'footer' => $this->footer,
            'default_footer' => $this->default_footer,
            'variables' => $this->variables,
            'default_variables' => $this->default_variables,
            'language_code' => $this->language_code,
            'is_customised' => $this->isCustomised(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
