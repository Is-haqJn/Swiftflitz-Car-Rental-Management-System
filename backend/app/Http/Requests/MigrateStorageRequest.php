<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MigrateStorageRequest extends FormRequest
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
            'target' => ['required', 'string', 'in:media,s3'],
        ];
    }
}
