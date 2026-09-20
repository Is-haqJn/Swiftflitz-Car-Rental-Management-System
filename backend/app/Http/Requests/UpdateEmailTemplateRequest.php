<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmailTemplateRequest extends FormRequest
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
            'subject' => ['required', 'string', 'max:255'],
            'html_content' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => 'Email subject is required.',
            'html_content.required' => 'Email HTML content is required.',
        ];
    }
}
