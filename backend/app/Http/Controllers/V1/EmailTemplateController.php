<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateEmailTemplateRequest;
use App\Http\Resources\EmailTemplateResource;
use App\Models\EmailTemplate;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EmailTemplateController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/email-templates
     * List all email templates.
     */
    public function index(Request $request): JsonResponse
    {
        $templates = EmailTemplate::query()->orderBy('name')->get();

        return $this->successResponse(EmailTemplateResource::collection($templates));
    }

    /**
     * GET /api/v1/email-templates/{key}
     * Show a single email template by key.
     */
    public function show(Request $request, string $key): JsonResponse
    {
        $template = EmailTemplate::query()->where('key', $key)->firstOrFail();

        return $this->successResponse(new EmailTemplateResource($template));
    }

    /**
     * PUT /api/v1/email-templates/{key}
     * Update a template's subject and HTML content.
     */
    public function update(UpdateEmailTemplateRequest $request, string $key): JsonResponse
    {
        $template = EmailTemplate::query()->where('key', $key)->firstOrFail();

        $template->update($request->validated());

        // ? Clear the cached template so the next email send picks up the new content
        Cache::forget("email_template:{$key}");

        return $this->successResponse(new EmailTemplateResource($template), 'Email template updated successfully.');
    }

    /**
     * POST /api/v1/email-templates/{key}/reset
     * Reset a template to its default HTML.
     */
    public function reset(Request $request, string $key): JsonResponse
    {
        $template = EmailTemplate::query()->where('key', $key)->firstOrFail();

        $template->update([
            'subject' => $template->default_subject,
            'html_content' => $template->default_html,
        ]);

        // ? Clear the cached template so the next email send picks up the reset content
        Cache::forget("email_template:{$key}");

        return $this->successResponse(new EmailTemplateResource($template), 'Template reset to default.');
    }
}
