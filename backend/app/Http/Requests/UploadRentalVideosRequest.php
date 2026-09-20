<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadRentalVideosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'video_tus_tokens' => ['required', 'array', 'min:1'],
            'video_tus_tokens.*' => ['string'],
        ];
    }
}
