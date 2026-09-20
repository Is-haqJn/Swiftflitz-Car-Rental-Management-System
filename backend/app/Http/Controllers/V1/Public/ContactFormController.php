<?php

namespace App\Http\Controllers\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactMessageRequest;
use App\Mail\ContactFormMail;
use App\Settings\GeneralSettings;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class ContactFormController extends Controller
{
    use ApiResponse;

    public function store(StoreContactMessageRequest $request, GeneralSettings $settings): JsonResponse
    {
        Mail::to($settings->site_email)->send(new ContactFormMail($request->validated()));

        return $this->successResponse(null, 'Your message has been sent. Our team will be in touch shortly.');
    }
}
