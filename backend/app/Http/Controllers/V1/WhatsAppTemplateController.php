<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateWhatsAppTemplateRequest;
use App\Http\Resources\WhatsAppTemplateResource;
use App\Models\WhatsAppTemplate;
use App\Settings\GeneralSettings;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WhatsAppTemplateController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/whatsapp-templates
     * List all WhatsApp templates.
     */
    public function index(Request $request): JsonResponse
    {
        $templates = WhatsAppTemplate::query()->orderBy('name')->get();

        return $this->successResponse(WhatsAppTemplateResource::collection($templates));
    }

    /**
     * GET /api/v1/whatsapp-templates/{key}
     * Show a single WhatsApp template by key.
     */
    public function show(Request $request, string $key): JsonResponse
    {
        $template = WhatsAppTemplate::query()->where('key', $key)->firstOrFail();

        return $this->successResponse(new WhatsAppTemplateResource($template));
    }

    /**
     * PUT /api/v1/whatsapp-templates/{key}
     * Update a WhatsApp template.
     */
    public function update(UpdateWhatsAppTemplateRequest $request, string $key): JsonResponse
    {
        $this->authorize('updateWhatsAppTemplates', GeneralSettings::class);

        $template = WhatsAppTemplate::query()->where('key', $key)->firstOrFail();

        $template->update($request->validated());

        Cache::forget("whatsapp_template:{$key}");

        return $this->successResponse(new WhatsAppTemplateResource($template), 'WhatsApp template updated successfully.');
    }

    /**
     * POST /api/v1/whatsapp-templates/{key}/reset
     * Reset a WhatsApp template to its defaults.
     */
    public function reset(Request $request, string $key): JsonResponse
    {
        $this->authorize('updateWhatsAppTemplates', GeneralSettings::class);

        $template = WhatsAppTemplate::query()->where('key', $key)->firstOrFail();

        $template->update([
            'template_name' => $template->default_template_name,
            'header' => $template->default_header,
            'body' => $template->default_body,
            'footer' => $template->default_footer,
            'variables' => $template->default_variables,
        ]);

        Cache::forget("whatsapp_template:{$key}");

        return $this->successResponse(new WhatsAppTemplateResource($template), 'Template reset to default.');
    }
}
