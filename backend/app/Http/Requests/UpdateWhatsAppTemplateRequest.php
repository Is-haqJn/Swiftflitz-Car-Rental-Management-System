<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWhatsAppTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /* Meta WhatsApp template name: max 512 chars (snake_case, no spaces) */
            'template_name' => ['required', 'string', 'max:512'],
            'language_code' => ['required', 'string', 'max:10'],
            /* Meta header text limit: 60 chars */
            'header' => ['nullable', 'string', 'max:60'],
            /* Meta body limit: 1024 chars */
            'body' => ['required', 'string', 'max:1024'],
            /* Meta footer text limit: 60 chars */
            'footer' => ['nullable', 'string', 'max:60'],
            'variables' => ['required', 'array'],
            'variables.*' => ['string'],
        ];
    }

    public function messages(): array
    {
        return [
            'template_name.required' => 'Template name is required.',
            'template_name.max' => 'Template name may not exceed 512 characters (Meta limit).',
            'header.max' => 'Header text may not exceed 60 characters (Meta limit).',
            'body.required' => 'Template body is required.',
            'body.max' => 'Body text may not exceed 1,024 characters (Meta limit).',
            'footer.max' => 'Footer text may not exceed 60 characters (Meta limit).',
            'variables.required' => 'Variables list is required.',
        ];
    }
}
