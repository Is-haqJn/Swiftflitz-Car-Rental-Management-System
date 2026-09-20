<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSmsTemplateRequest;
use App\Http\Resources\SmsTemplateResource;
use App\Models\SmsTemplate;
use App\Settings\GeneralSettings;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SmsTemplateController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/sms-templates
     * List all SMS templates.
     */
    public function index(Request $request): JsonResponse
    {
        $templates = SmsTemplate::query()->orderBy('name')->get();

        return $this->successResponse(SmsTemplateResource::collection($templates));
    }

    /**
     * GET /api/v1/sms-templates/{key}
     * Show a single SMS template by key.
     */
    public function show(Request $request, string $key): JsonResponse
    {
        $template = SmsTemplate::query()->where('key', $key)->firstOrFail();

        return $this->successResponse(new SmsTemplateResource($template));
    }

    /**
     * PUT /api/v1/sms-templates/{key}
     * Update an SMS template's body.
     */
    public function update(UpdateSmsTemplateRequest $request, string $key): JsonResponse
    {
        $this->authorize('updateSmsTemplates', GeneralSettings::class);

        $template = SmsTemplate::query()->where('key', $key)->firstOrFail();

        $template->update($request->validated());

        Cache::forget("sms_template:{$key}");

        return $this->successResponse(new SmsTemplateResource($template), 'SMS template updated successfully.');
    }

    /**
     * POST /api/v1/sms-templates/{key}/reset
     * Reset an SMS template to its default body.
     */
    public function reset(Request $request, string $key): JsonResponse
    {
        $this->authorize('updateSmsTemplates', GeneralSettings::class);

        $template = SmsTemplate::query()->where('key', $key)->firstOrFail();

        $template->update(['body' => $template->default_body]);

        Cache::forget("sms_template:{$key}");

        return $this->successResponse(new SmsTemplateResource($template), 'Template reset to default.');
    }
}
