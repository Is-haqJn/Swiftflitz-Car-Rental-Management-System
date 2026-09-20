<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TestEmailRequest;
use App\Http\Requests\TestSmsRequest;
use App\Http\Requests\TestWhatsAppRequest;
use App\Http\Requests\UpdateAboutSettingsRequest;
use App\Http\Requests\UpdateCancellationSettingsRequest;
use App\Http\Requests\UpdateContactSettingsRequest;
use App\Http\Requests\UpdateEarlyReturnSettingsRequest;
use App\Http\Requests\UpdateEmailSettingsRequest;
use App\Http\Requests\UpdateFaqSettingsRequest;
use App\Http\Requests\UpdateFooterSettingsRequest;
use App\Http\Requests\UpdateGeneralSettingsRequest;
use App\Http\Requests\UpdateHeaderSettingsRequest;
use App\Http\Requests\UpdateHomepageSettingsRequest;
use App\Http\Requests\UpdateNotificationSystemSettingsRequest;
use App\Http\Requests\UpdateOverdueSettingsRequest;
use App\Http\Requests\UpdatePaymentSettingsRequest;
use App\Http\Requests\UpdatePopupSettingsRequest;
use App\Http\Requests\UpdatePricingSettingsRequest;
use App\Http\Requests\UpdatePrivacySettingsRequest;
use App\Http\Requests\UpdateRentalSettingsRequest;
use App\Http\Requests\UpdateS3SettingsRequest;
use App\Http\Requests\UpdateSeoSettingsRequest;
use App\Http\Requests\UpdateServicesSettingsRequest;
use App\Http\Requests\UpdateSmsSettingsRequest;
use App\Http\Requests\UpdateTermsSettingsRequest;
use App\Http\Requests\UpdateWhatsAppSettingsRequest;
use App\Models\SiteContent;
use App\Models\Vehicle;
use App\Services\Contracts\EmailTestServiceInterface;
use App\Services\Contracts\SmsTemplateServiceInterface;
use App\Services\Contracts\WhatsAppTemplateServiceInterface;
use App\Services\Notifications\Channels\SmsChannel;
use App\Services\Notifications\Channels\WhatsAppChannel;
use App\Settings\AboutSettings;
use App\Settings\CancellationSettings;
use App\Settings\ChauffeurSettings;
use App\Settings\ContactSettings;
use App\Settings\EarlyReturnSettings;
use App\Settings\EmailSettings;
use App\Settings\FaqSettings;
use App\Settings\FooterSettings;
use App\Settings\GeneralSettings;
use App\Settings\HeaderSettings;
use App\Settings\HomepageSettings;
use App\Settings\NotificationSystemSettings;
use App\Settings\OverdueSettings;
use App\Settings\PaymentSettings;
use App\Settings\PopupSettings;
use App\Settings\PricingSettings;
use App\Settings\PrivacySettings;
use App\Settings\RentalSettings;
use App\Settings\S3Settings;
use App\Settings\SeoSettings;
use App\Settings\ServicesSettings;
use App\Settings\SmsSettings;
use App\Settings\TermsSettings;
use App\Settings\WhatsAppSettings;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class SettingsController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly EmailTestServiceInterface $emailTestService,
        private readonly SmsChannel $smsChannel,
        private readonly WhatsAppChannel $whatsAppChannel,
        private readonly SmsTemplateServiceInterface $smsTemplateService,
        private readonly WhatsAppTemplateServiceInterface $whatsAppTemplateService,
    ) {}

    /**
     * GET /api/settings/general
     * Get general site settings.
     */
    public function showGeneral(GeneralSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * GET /api/settings/logo
     * Proxy the site logo through the API so cross-origin frontends can
     * fetch it for PDF generation (storage files lack CORS headers).
     */
    public function logo(GeneralSettings $settings): BinaryFileResponse
    {
        $url = $settings->site_image_url;

        abort_unless($url, 404);

        $path = ltrim(parse_url($url, PHP_URL_PATH), '/');
        $fullPath = public_path($path);

        abort_unless(file_exists($fullPath), 404);

        return response()->file($fullPath);
    }

    /**
     * PUT /api/settings/general
     * Update general site settings.
     */
    public function updateGeneral(UpdateGeneralSettingsRequest $request, GeneralSettings $settings): JsonResponse
    {
        $this->authorize('updateGeneral', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'General settings updated successfully.');
    }

    /**
     * GET /api/v1/public/rental-settings
     * Expose only the pickup window times - no auth required.
     */
    public function showPublicRental(RentalSettings $settings): JsonResponse
    {
        return $this->successResponse([
            'pickup_window_start' => $settings->pickup_window_start,
            'pickup_window_end' => $settings->pickup_window_end,
            'min_rental_days' => $settings->min_rental_days,
            'documents_required' => $settings->documents_required,
            'return_time_threshold' => $settings->return_time_threshold,
        ]);
    }

    /**
     * GET /api/settings/rental
     * Get rental configuration settings.
     */
    public function showRental(RentalSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/rental
     * Update rental configuration settings.
     */
    public function updateRental(UpdateRentalSettingsRequest $request, RentalSettings $settings): JsonResponse
    {
        $this->authorize('updateRental', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Rental settings updated successfully.');
    }

    /**
     * GET /api/settings/pricing
     * Get pricing and discount settings.
     */
    public function showPricing(PricingSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/pricing
     * Update pricing and discount settings.
     */
    public function updatePricing(UpdatePricingSettingsRequest $request, PricingSettings $settings): JsonResponse
    {
        $this->authorize('updatePricing', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Pricing settings updated successfully.');
    }

    /**
     * GET /api/settings/cancellation
     * Get cancellation and no-show policy settings.
     */
    public function showCancellation(CancellationSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/cancellation
     * Update cancellation and no-show policy settings.
     */
    public function updateCancellation(UpdateCancellationSettingsRequest $request, CancellationSettings $settings): JsonResponse
    {
        $this->authorize('updateCancellation', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Cancellation settings updated successfully.');
    }

    /**
     * GET /api/settings/overdue
     * Get overdue charge policy settings.
     */
    public function showOverdue(OverdueSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/overdue
     * Update overdue charge policy settings.
     */
    public function updateOverdue(UpdateOverdueSettingsRequest $request, OverdueSettings $settings): JsonResponse
    {
        $this->authorize('updateOverdue', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Overdue settings updated successfully.');
    }

    /**
     * GET /api/settings/early-return
     * Get early return policy settings.
     */
    public function showEarlyReturn(EarlyReturnSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/early-return
     * Update early return policy settings.
     */
    public function updateEarlyReturn(UpdateEarlyReturnSettingsRequest $request, EarlyReturnSettings $settings): JsonResponse
    {
        $this->authorize('updateCancellation', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Early return settings updated successfully.');
    }

    /**
     * GET /api/settings/email
     * Get email configuration settings.
     */
    public function showEmail(EmailSettings $settings): JsonResponse
    {
        $data = $settings->toArray();
        if (! empty($data['password'])) {
            $data['password'] = '••••••••••••••••';
        }

        return $this->successResponse($data);
    }

    /**
     * PUT /api/settings/email
     * Update email configuration settings.
     */
    public function updateEmail(UpdateEmailSettingsRequest $request, EmailSettings $settings): JsonResponse
    {
        $this->authorize('updateEmail', GeneralSettings::class);

        $mask = '••••••••••••••••';
        foreach ($request->validated() as $key => $value) {
            if ($key === 'password' && $value === $mask) {
                continue;
            }
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse(null, 'Email settings updated successfully.');
    }

    /**
     * POST /api/settings/email/test
     * Send a test email using the current stored SMTP configuration.
     */
    public function testEmail(TestEmailRequest $request, EmailSettings $settings): JsonResponse
    {
        $this->authorize('testEmail', GeneralSettings::class);

        try {
            $this->emailTestService->sendTestEmail($request->validated('email'), $settings);
        } catch (Throwable $e) {
            return $this->errorResponse('Connection failed: ' . $e->getMessage(), 422);
        }

        return $this->successResponse(null, 'Test email sent successfully.');
    }

    /**
     * GET /api/settings/whatsapp
     * Get WhatsApp integration settings.
     */
    public function showWhatsApp(WhatsAppSettings $settings): JsonResponse
    {
        // ? Mask the API key before returning
        $data = $settings->toArray();
        if (! empty($data['access_token'])) {
            $data['access_token'] = '••••••••••••••••';
        }
        if (! empty($data['app_secret'])) {
            $data['app_secret'] = '••••••••••••••••';
        }

        return $this->successResponse($data);
    }

    /**
     * PUT /api/settings/whatsapp
     * Update WhatsApp integration settings.
     */
    public function updateWhatsApp(UpdateWhatsAppSettingsRequest $request, WhatsAppSettings $settings): JsonResponse
    {
        $this->authorize('updateWhatsApp', GeneralSettings::class);

        $mask = '••••••••••••••••';

        foreach ($request->validated() as $key => $value) {
            if ($value === $mask) {
                continue;
            }
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse(null, 'WhatsApp settings updated successfully.');
    }

    /**
     * POST /api/settings/whatsapp/test
     * Send a test WhatsApp message to verify provider credentials.
     * For event-specific types, uses the corresponding template key with sample params.
     * Falls back to hello_world (always pre-approved) when the event template is unavailable.
     */
    public function testWhatsApp(TestWhatsAppRequest $request): JsonResponse
    {
        $this->authorize('testWhatsApp', GeneralSettings::class);

        $phone = $request->validated('phone');
        $type = $request->validated('type') ?? 'hello_world';

        /** Map notification type -> [template_key, named_sample_values[]] */
        $templateMap = [
            'hello_world' => ['hello_world', []],
            'new_booking' => ['new_booking', ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla', 'start_date' => '25 Apr 2026']],
            'rental_cancelled' => ['rental_cancelled', ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla']],
            'pickup_reminder' => ['pickup_reminder', ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla', 'pickup_date' => '25 Apr 2026']],
            'return_reminder' => ['return_reminder', ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla', 'return_date' => '25 Apr 2026']],
            'overdue_alert' => ['overdue_alert', ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla']],
            'payment_confirmation' => ['payment_confirmation', ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001']],
            'rental_status_change' => ['rental_status_change', ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'new_status' => 'Confirmed', 'vehicle_name' => 'Toyota Corolla']],
            'admin_new_booking' => ['admin_new_booking', ['booking_reference' => 'REF-TEST001', 'branch_name' => 'Main Branch', 'customer_name' => 'John Doe', 'vehicle_name' => 'Toyota Corolla', 'total_amount' => '500.00']],
            'airport_booking' => ['airport_booking', ['customer_name' => 'John Doe', 'booking_reference' => 'ABK-TEST001', 'scheduled_at' => 'Sat, 25 Apr 2026 09:00']],
            'airport_booking_cancelled' => ['airport_booking_cancelled', ['customer_name' => 'John Doe', 'booking_reference' => 'ABK-TEST001']],
            'airport_booking_status_changed' => ['airport_booking_status_changed', ['booking_reference' => 'ABK-TEST001', 'new_status' => 'Confirmed']],
            'chauffeur_booking' => ['chauffeur_booking', ['customer_name' => 'John Doe', 'booking_reference' => 'CHF-TEST001', 'pickup_time' => 'Sat, 25 Apr 2026 08:00', 'vehicle_name' => 'Toyota Corolla']],
            'chauffeur_booking_cancelled' => ['chauffeur_booking_cancelled', ['customer_name' => 'John Doe', 'booking_reference' => 'CHF-TEST001']],
            'chauffeur_booking_status_changed' => ['chauffeur_booking_status_changed', ['booking_reference' => 'CHF-TEST001', 'new_status' => 'Confirmed']],
            'chauffeur_pickup_reminder' => ['chauffeur_pickup_reminder', ['customer_name' => 'John Doe', 'booking_reference' => 'CHF-TEST001', 'pickup_time' => 'Sat, 25 Apr 2026 08:00', 'vehicle_name' => 'Toyota Corolla']],
            'driver_document_expiry' => ['driver_document_expiry', ['driver_name' => 'John Driver', 'document_type' => 'driver\'s license', 'expiry_date' => '09 May 2026']],
            'vehicle_expiry' => ['vehicle_expiry', ['vehicle_name' => 'Toyota Corolla', 'plate_number' => 'GR-1234-20', 'document_type' => 'roadworthy', 'expiry_date' => '09 May 2026', 'days_until_expiry' => '14']],
        ];

        [$templateKey, $namedValues] = $templateMap[$type] ?? ['hello_world', []];

        /* Resolve positional params using the DB template when available */
        $params = [];
        if ($templateKey !== 'hello_world' && ! empty($namedValues)) {
            $dbTemplate = $this->whatsAppTemplateService->getTemplate($templateKey);
            if ($dbTemplate) {
                $params = $this->whatsAppTemplateService->resolveParams($dbTemplate, $namedValues);
            } else {
                /* Template not in DB yet - use namedValues as ordered fallback */
                $params = array_values($namedValues);
            }
        }

        try {
            $templateName = isset($dbTemplate) ? $dbTemplate->template_name : $templateKey;
            $languageCode = isset($dbTemplate) ? ($dbTemplate->language_code ?? 'en_US') : 'en_US';
            $sent = $this->whatsAppChannel->sendTemplate($phone, $templateName, $languageCode, $params);
        } catch (Throwable $e) {
            /* If event template fails (not approved), fall back to hello_world */
            if ($templateKey !== 'hello_world') {
                try {
                    $sent = $this->whatsAppChannel->sendTemplate($phone, 'hello_world');
                } catch (Throwable $fallbackEx) {
                    return $this->errorResponse('WhatsApp send failed: ' . $fallbackEx->getMessage(), 422);
                }
            } else {
                return $this->errorResponse('WhatsApp send failed: ' . $e->getMessage(), 422);
            }
        }

        if (! $sent) {
            return $this->errorResponse('WhatsApp message could not be sent. Check that WhatsApp is enabled and your credentials are correct.', 422);
        }

        return $this->successResponse(null, 'Test WhatsApp message sent successfully.');
    }

    /**
     * GET /api/settings/sms
     * Get SMS integration settings.
     */
    public function showSms(SmsSettings $settings): JsonResponse
    {
        $mask = '••••••••••••••••';
        $data = $settings->toArray();

        if (! empty($data['arkessel_api_key'])) {
            $data['arkessel_api_key'] = $mask;
        }

        if (! empty($data['twilio_auth_token'])) {
            $data['twilio_auth_token'] = $mask;
        }

        if (! empty($data['nalo_api_key'])) {
            $data['nalo_api_key'] = $mask;
        }

        if (! empty($data['hubtel_sms_client_secret'])) {
            $data['hubtel_sms_client_secret'] = $mask;
        }

        return $this->successResponse($data);
    }

    /**
     * PUT /api/settings/sms
     * Update SMS integration settings.
     */
    public function updateSms(UpdateSmsSettingsRequest $request, SmsSettings $settings): JsonResponse
    {
        $this->authorize('updateSms', GeneralSettings::class);

        $mask = '••••••••••••••••';

        foreach ($request->validated() as $key => $value) {
            if ($value === $mask) {
                continue;
            }
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse(null, 'SMS settings updated successfully.');
    }

    /**
     * POST /api/settings/sms/test
     * Send a test SMS using the current stored provider configuration.
     * Accepts an optional 'type' field to send a representative message for a specific notification type.
     */
    public function testSms(TestSmsRequest $request, GeneralSettings $generalSettings): JsonResponse
    {
        $this->authorize('testSms', GeneralSettings::class);

        $phone = $request->validated('phone');
        $type = $request->validated('type') ?? 'connection_test';
        $appName = $generalSettings->site_name ?: config('app.name', 'Swiftflitz');

        $message = $this->composeSmsTestMessage($type, $appName);

        try {
            $sent = $this->smsChannel->send($phone, $message);

        } catch (Throwable $e) {
            return $this->errorResponse('SMS send failed: ' . $e->getMessage(), 422);
        }

        if (! $sent) {
            return $this->errorResponse('SMS could not be sent. Check that SMS is enabled and your provider credentials are correct.', 422);
        }

        return $this->successResponse(null, 'Test SMS sent successfully.');
    }

    /**
     * GET /api/settings/seo
     * Get SEO and metadata settings.
     */
    public function showSeo(SeoSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/seo
     * Update SEO and metadata settings.
     */
    public function updateSeo(UpdateSeoSettingsRequest $request, SeoSettings $settings): JsonResponse
    {
        $this->authorize('updateSeo', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'SEO settings updated successfully.');
    }

    /**
     * GET /api/settings/payment
     * Get payment gateway settings.
     */
    public function showPayment(PaymentSettings $settings): JsonResponse
    {
        // ? Mask secret keys before returning
        $mask = '••••••••••••••••';
        $data = $settings->toArray();
        if (! empty($data['paystack_secret_key'])) {
            $data['paystack_secret_key'] = $mask;
        }
        if (! empty($data['stripe_secret_key'])) {
            $data['stripe_secret_key'] = $mask;
        }
        if (! empty($data['hubtel_client_secret'])) {
            $data['hubtel_client_secret'] = $mask;
        }

        return $this->successResponse($data);
    }

    /**
     * PUT /api/settings/payment
     * Update payment gateway settings.
     */
    /**
     * GET /api/settings/payment-config
     * Get public-safe payment config (public key only, no auth required).
     */
    public function showPublicPayment(PaymentSettings $settings): JsonResponse
    {
        $general = app(GeneralSettings::class);

        return $this->successResponse([
            'payment_provider' => $settings->payment_provider,
            'paystack_public_key' => $settings->paystack_public_key,
            'stripe_public_key' => $settings->stripe_public_key,
            'hubtel_client_id' => $settings->hubtel_client_id,
            'payment_currency' => $settings->payment_currency,
            'enable_online_payments' => $settings->enable_online_payments,
            'enable_paystack' => $settings->enable_paystack,
            'enable_stripe' => $settings->enable_stripe,
            'enable_hubtel' => $settings->enable_hubtel,
            'paystack_logo_url' => $settings->paystack_logo_url,
            'stripe_logo_url' => $settings->stripe_logo_url,
            'hubtel_logo_url' => $settings->hubtel_logo_url,
            'support_email' => $general->site_email ?? null,
            'support_phone' => $general->site_phone ?? null,
        ]);
    }

    public function updatePayment(UpdatePaymentSettingsRequest $request, PaymentSettings $settings): JsonResponse
    {
        $this->authorize('updatePayment', GeneralSettings::class);

        $mask = '••••••••••••••••';
        $secretFields = ['paystack_secret_key', 'stripe_secret_key', 'hubtel_client_secret'];

        foreach ($request->validated() as $key => $value) {
            if (in_array($key, $secretFields) && $value === $mask) {
                continue;
            }

            $settings->$key = $value;
        }

        $settings->save();

        $data = $settings->toArray();
        foreach ($secretFields as $field) {
            if (! empty($data[$field])) {
                $data[$field] = $mask;
            }
        }

        return $this->successResponse($data, 'Payment settings updated successfully.');
    }

    /**
     * GET /api/settings/s3
     * Get S3 storage credentials (masked).
     */
    public function showS3(S3Settings $settings): JsonResponse
    {
        $this->authorize('updateGeneral', GeneralSettings::class);

        $mask = '••••••••••••••••';
        $data = $settings->toArray();

        if (! empty($data['aws_access_key_id'])) {
            $data['aws_access_key_id'] = $mask;
        }

        if (! empty($data['aws_secret_access_key'])) {
            $data['aws_secret_access_key'] = $mask;
        }

        return $this->successResponse($data);
    }

    /**
     * PUT /api/settings/s3
     * Update S3 storage credentials (skip-overwrite masked values).
     */
    public function updateS3(UpdateS3SettingsRequest $request, S3Settings $settings): JsonResponse
    {
        $this->authorize('updateGeneral', GeneralSettings::class);

        $mask = '••••••••••••••••';
        $maskedFields = ['aws_access_key_id', 'aws_secret_access_key'];

        foreach ($request->validated() as $key => $value) {
            if (in_array($key, $maskedFields) && $value === $mask) {
                continue;
            }

            $settings->$key = $value;
        }

        $settings->save();

        $data = $settings->toArray();
        foreach ($maskedFields as $field) {
            if (! empty($data[$field])) {
                $data[$field] = $mask;
            }
        }

        return $this->successResponse($data, 'S3 settings updated successfully.');
    }

    /**
     * GET /api/settings/header
     * Get website header settings.
     */
    public function showHeader(HeaderSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/header
     * Update website header settings.
     */
    public function updateHeader(UpdateHeaderSettingsRequest $request, HeaderSettings $settings): JsonResponse
    {
        $this->authorize('updateHeader', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Header settings updated successfully.');
    }

    /**
     * GET /api/settings/homepage
     * Get website homepage settings.
     */
    public function showHomepage(HomepageSettings $settings, GeneralSettings $generalSettings): JsonResponse
    {
        $siteContent = SiteContent::instance();

        $resolvedName = null;
        $resolvedPrice = null;

        if ($settings->hero_featured_vehicle_enabled) {
            $mode = $settings->hero_featured_vehicle_mode;

            if ($mode === 'custom') {
                $resolvedName = $settings->hero_featured_vehicle_custom_title;
                $resolvedPrice = $settings->hero_featured_vehicle_custom_price;
            } elseif (in_array($mode, ['specific', 'random'], true) && $settings->hero_featured_vehicle_id) {
                $vehicle = Vehicle::find($settings->hero_featured_vehicle_id);
                if ($vehicle) {
                    $resolvedName = $vehicle->name;
                    $resolvedPrice = $generalSettings->currency_symbol . number_format((float) $vehicle->daily_rate, 0);
                }
            }
        }

        return $this->successResponse(array_merge($settings->toArray(), [
            'hero_image_url' => $siteContent->getFirstMediaUrl('hero', 'hero-web') ?: $siteContent->getFirstMediaUrl('hero') ?: null,
            'whychooseus_bg_image_url' => $siteContent->getFirstMediaUrl('whychooseus-bg', 'whychooseus-web') ?: $siteContent->getFirstMediaUrl('whychooseus-bg') ?: null,
            'chauffeur_image_url' => $siteContent->getFirstMediaUrl('chauffeur', 'chauffeur-web') ?: $siteContent->getFirstMediaUrl('chauffeur') ?: null,
            'pickup_process_bg_image_url' => $siteContent->getFirstMediaUrl('pickup-process-bg', 'pickup-process-bg-web') ?: $siteContent->getFirstMediaUrl('pickup-process-bg') ?: null,
            'pickup_process_bottom_image_url' => $siteContent->getFirstMediaUrl('pickup-process-bottom', 'pickup-process-bottom-web') ?: $siteContent->getFirstMediaUrl('pickup-process-bottom') ?: null,
            'hero_featured_vehicle_resolved_name' => $resolvedName,
            'hero_featured_vehicle_resolved_price' => $resolvedPrice,
        ]));
    }

    /**
     * PUT /api/settings/homepage
     * Update website homepage settings.
     */
    public function updateHomepage(UpdateHomepageSettingsRequest $request, HomepageSettings $settings): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        if ($settings->hero_featured_vehicle_mode === 'random') {
            $vehicle = Vehicle::inRandomOrder()->first();
            if ($vehicle) {
                $settings->hero_featured_vehicle_id = $vehicle->id;
                $settings->hero_featured_vehicle_url = "/listings/{$vehicle->id}";
            }
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Homepage settings updated successfully.');
    }

    /**
     * POST /api/settings/homepage/hero-image
     * Upload hero background image via Spatie Media Library.
     */
    public function uploadHeroImage(Request $request, HomepageSettings $settings): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('hero');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("hero-bg.{$extension}")
            ->toMediaCollection('hero');

        $settings->hero_image_version = time();
        $settings->save();

        $freshContent = $siteContent->fresh();

        return $this->successResponse(
            array_merge($settings->toArray(), [
                'hero_image_url' => $freshContent->getFirstMediaUrl('hero', 'hero-web') ?: $freshContent->getFirstMediaUrl('hero') ?: null,
            ]),
            'Hero image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/about/banner-image
     * Upload the about page banner background image via Spatie Media Library.
     */
    public function uploadAboutBannerImage(Request $request, AboutSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('about-banner');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("about-banner.{$extension}")
            ->toMediaCollection('about-banner');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('about-banner', 'about-banner-web')
            ?: $freshContent->getFirstMediaUrl('about-banner')
            ?: null;

        $settings->banner_image_url = $url;
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['banner_image_url' => $url]),
            'About banner image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/about/team-photo
     * Upload a team member photo to Spatie Media Library and return its URL.
     */
    public function uploadTeamPhoto(Request $request): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());

        $siteContent = SiteContent::instance();
        $media = $siteContent->addMediaFromRequest('image')
            ->usingFileName($filename)
            ->toMediaCollection('about-team-photos');

        $url = $media->getUrl('about-team-photo-web') ?: $media->getUrl();

        return $this->successResponse(
            ['url' => $url],
            'Team photo uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/about/values-bg-image
     * Upload the Our Values section background image via Spatie Media Library.
     */
    public function uploadAboutValuesBgImage(Request $request, AboutSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('about-values-bg');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("about-values-bg.{$extension}")
            ->toMediaCollection('about-values-bg');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('about-values-bg', 'about-values-bg-web')
            ?: $freshContent->getFirstMediaUrl('about-values-bg')
            ?: null;

        $settings->values_bg_image_url = $url;
        $settings->values_bg_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['values_bg_image_url' => $url]),
            'Our Values background image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/about/bg-image
     * Upload the about section background image via Spatie Media Library.
     */
    public function uploadAboutBgImage(Request $request, AboutSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('about-general-bg');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("about-general-bg.{$extension}")
            ->toMediaCollection('about-general-bg');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('about-general-bg', 'about-general-bg-web')
            ?: $freshContent->getFirstMediaUrl('about-general-bg')
            ?: null;

        $settings->general_bg_image_url = $url;
        $settings->general_bg_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['general_bg_image_url' => $url]),
            'About background image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/about/overlay-image
     * Upload the about section overlay image via Spatie Media Library.
     */
    public function uploadAboutOverlayImage(Request $request, AboutSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('about-general-overlay');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("about-general-overlay.{$extension}")
            ->toMediaCollection('about-general-overlay');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('about-general-overlay', 'about-general-overlay-web')
            ?: $freshContent->getFirstMediaUrl('about-general-overlay')
            ?: null;

        $settings->general_overlay_image_url = $url;
        $settings->general_overlay_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['general_overlay_image_url' => $url]),
            'About overlay image uploaded successfully.'
        );
    }

    /**
     * GET /api/settings/icons
     * List icons stored in the Spatie Media Library icons collection.
     */
    public function listIcons(): JsonResponse
    {
        $icons = SiteContent::instance()
            ->getMedia('icons')
            ->map(fn (Media $m) => [
                'url' => $m->getUrl(),
                'filename' => $m->file_name,
            ])
            ->values()
            ->all();

        return $this->successResponse($icons);
    }

    /**
     * POST /api/settings/icons/upload
     * Upload a new icon to the Spatie Media Library icons collection.
     */
    public function uploadCardIcon(Request $request): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:2048'],
        ]);

        $file = $request->file('image');
        $filename = time() . '-' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());

        $siteContent = SiteContent::instance();
        $media = $siteContent->addMediaFromRequest('image')
            ->usingFileName($filename)
            ->toMediaCollection('icons');

        return $this->successResponse([
            'url' => $media->getUrl(),
            'filename' => $media->file_name,
        ], 'Icon uploaded successfully.');
    }

    /**
     * POST /api/settings/why-choose-us/bg-image
     * Overwrite the Why Choose Us section background image via Spatie Media Library.
     */
    public function uploadWhyChooseUsBgImage(Request $request, HomepageSettings $settings): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('whychooseus-bg');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("whychooseus-bg.{$extension}")
            ->toMediaCollection('whychooseus-bg');

        $settings->why_bg_image_version = time();
        $settings->save();

        $freshContent = $siteContent->fresh();

        return $this->successResponse(
            array_merge($settings->toArray(), [
                'hero_image_url' => $freshContent->getFirstMediaUrl('hero', 'hero-web') ?: $freshContent->getFirstMediaUrl('hero') ?: null,
                'whychooseus_bg_image_url' => $freshContent->getFirstMediaUrl('whychooseus-bg', 'whychooseus-web') ?: $freshContent->getFirstMediaUrl('whychooseus-bg') ?: null,
            ]),
            'Background image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/chauffeur/image
     * Upload the Chauffeur section image via Spatie Media Library.
     */
    public function uploadChauffeurImage(Request $request, HomepageSettings $settings): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('chauffeur');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("chauffeur.{$extension}")
            ->toMediaCollection('chauffeur');

        $settings->chauffeur_image_version = time();
        $settings->save();

        $freshContent = $siteContent->fresh();

        return $this->successResponse(
            array_merge($settings->toArray(), [
                'hero_image_url' => $freshContent->getFirstMediaUrl('hero', 'hero-web') ?: $freshContent->getFirstMediaUrl('hero') ?: null,
                'whychooseus_bg_image_url' => $freshContent->getFirstMediaUrl('whychooseus-bg', 'whychooseus-web') ?: $freshContent->getFirstMediaUrl('whychooseus-bg') ?: null,
                'chauffeur_image_url' => $freshContent->getFirstMediaUrl('chauffeur', 'chauffeur-web') ?: $freshContent->getFirstMediaUrl('chauffeur') ?: null,
            ]),
            'Chauffeur image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/pickup-process/bg-image
     * Upload the Pickup Process section background image via Spatie Media Library.
     */
    public function uploadPickupProcessBgImage(Request $request, HomepageSettings $settings): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('pickup-process-bg');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("pickup-process-bg.{$extension}")
            ->toMediaCollection('pickup-process-bg');

        $settings->pickup_process_bg_image_version = time();
        $settings->save();

        $freshContent = $siteContent->fresh();

        return $this->successResponse(
            array_merge($settings->toArray(), [
                'pickup_process_bg_image_url' => $freshContent->getFirstMediaUrl('pickup-process-bg', 'pickup-process-bg-web') ?: $freshContent->getFirstMediaUrl('pickup-process-bg') ?: null,
                'pickup_process_bottom_image_url' => $freshContent->getFirstMediaUrl('pickup-process-bottom', 'pickup-process-bottom-web') ?: $freshContent->getFirstMediaUrl('pickup-process-bottom') ?: null,
            ]),
            'Background image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/pickup-process/bottom-image
     * Upload the Pickup Process section bottom image via Spatie Media Library.
     */
    public function uploadPickupProcessBottomImage(Request $request, HomepageSettings $settings): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('pickup-process-bottom');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("pickup-process-bottom.{$extension}")
            ->toMediaCollection('pickup-process-bottom');

        $settings->pickup_process_bottom_image_version = time();
        $settings->save();

        $freshContent = $siteContent->fresh();

        return $this->successResponse(
            array_merge($settings->toArray(), [
                'pickup_process_bg_image_url' => $freshContent->getFirstMediaUrl('pickup-process-bg', 'pickup-process-bg-web') ?: $freshContent->getFirstMediaUrl('pickup-process-bg') ?: null,
                'pickup_process_bottom_image_url' => $freshContent->getFirstMediaUrl('pickup-process-bottom', 'pickup-process-bottom-web') ?: $freshContent->getFirstMediaUrl('pickup-process-bottom') ?: null,
            ]),
            'Bottom image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/homepage/testimonial-image
     * Upload a testimonial card image and return its Spatie media URL.
     */
    public function uploadTestimonialImage(Request $request): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->getClientOriginalExtension();
        $filename = time() . '.' . $extension;

        $siteContent = SiteContent::instance();
        $media = $siteContent->addMediaFromRequest('image')
            ->usingFileName($filename)
            ->toMediaCollection('testimonials');

        $url = $media->getUrl('testimonial-web') ?: $media->getUrl();

        return $this->successResponse([
            'path' => $url,
            'filename' => $media->file_name,
        ], 'Testimonial image uploaded successfully.');
    }

    /**
     * GET /api/settings/about
     * Get website about page settings.
     */
    public function showAbout(AboutSettings $settings): JsonResponse
    {
        $siteContent = SiteContent::instance();

        $bannerImageUrl = $settings->banner_image_url
            ?: $siteContent->getFirstMediaUrl('about-banner', 'about-banner-web')
            ?: $siteContent->getFirstMediaUrl('about-banner')
            ?: null;

        $generalBgImageUrl = $settings->general_bg_image_url
            ?: $siteContent->getFirstMediaUrl('about-general-bg', 'about-general-bg-web')
            ?: $siteContent->getFirstMediaUrl('about-general-bg')
            ?: null;

        $generalOverlayImageUrl = $settings->general_overlay_image_url
            ?: $siteContent->getFirstMediaUrl('about-general-overlay', 'about-general-overlay-web')
            ?: $siteContent->getFirstMediaUrl('about-general-overlay')
            ?: null;

        $valuesBgImageUrl = $settings->values_bg_image_url
            ?: $siteContent->getFirstMediaUrl('about-values-bg', 'about-values-bg-web')
            ?: $siteContent->getFirstMediaUrl('about-values-bg')
            ?: null;

        return $this->successResponse(
            array_merge($settings->toArray(), [
                'banner_image_url' => $bannerImageUrl,
                'general_bg_image_url' => $generalBgImageUrl,
                'general_overlay_image_url' => $generalOverlayImageUrl,
                'values_bg_image_url' => $valuesBgImageUrl,
            ])
        );
    }

    /**
     * PUT /api/settings/about
     * Update website about page settings.
     */
    public function updateAbout(UpdateAboutSettingsRequest $request, AboutSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'About page settings updated successfully.');
    }

    /**
     * GET /api/settings/services
     * Get website services page settings.
     */
    public function showServices(ServicesSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/services
     * Update website services page settings.
     */
    public function updateServices(UpdateServicesSettingsRequest $request, ServicesSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Services page settings updated successfully.');
    }

    /**
     * POST /api/settings/services/banner-image
     * Overwrite the services page banner background image in-place and bump the version stamp.
     */
    public function uploadServicesBannerImage(Request $request, ServicesSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('services-banner');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("services-banner.{$extension}")
            ->toMediaCollection('services-banner');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('services-banner', 'services-banner-web')
            ?: $freshContent->getFirstMediaUrl('services-banner')
            ?: null;

        $settings->banner_image_url = $url;
        $settings->banner_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['banner_image_url' => $url]),
            'Services banner image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/services/why-choose-us-bg-image
     * Overwrite the Why Choose Us section background image and bump the version stamp.
     */
    public function uploadServicesWhyChooseUsBgImage(Request $request, ServicesSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $file = $request->file('image');
        $extension = $file->extension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('services-why-choose-us-bg');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("services-why-choose-us-bg.{$extension}")
            ->toMediaCollection('services-why-choose-us-bg');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('services-why-choose-us-bg', 'services-why-choose-us-bg-web')
            ?: $freshContent->getFirstMediaUrl('services-why-choose-us-bg')
            ?: null;

        $settings->why_choose_us_bg_image_url = $url;
        $settings->why_choose_us_bg_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['why_choose_us_bg_image_url' => $url]),
            'Why Choose Us background image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/services/facility-card-image
     * Upload a service facility card image. Deletes the previous image for the same slot if it exists.
     */
    public function uploadServicesFacilityCardImage(Request $request, ServicesSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
            'index' => ['required', 'integer', 'min:0'],
        ]);

        $index = (int) $request->input('index');
        $extension = $request->file('image')->extension();

        $siteContent = SiteContent::instance();

        // Delete the existing media for this card slot before replacing
        $siteContent->getMedia('services-facility-cards')
            ->filter(fn ($media) => $media->getCustomProperty('card_index') === $index)
            ->each->delete();

        $media = $siteContent->addMediaFromRequest('image')
            ->withCustomProperties(['card_index' => $index])
            ->usingFileName("facility-card-{$index}.{$extension}")
            ->toMediaCollection('services-facility-cards');

        $url = $media->getUrl('services-facility-card-web') ?: $media->getUrl();

        // Ensure each card is a plain associative array (spatie may deserialise as stdClass)
        $cards = array_map(fn ($card) => (array) $card, $settings->facilities_cards ?? []);

        if (isset($cards[$index])) {
            $cards[$index]['image_url'] = $url;
        } else {
            $cards[$index] = ['image_url' => $url, 'title' => '', 'description' => '', 'button_text' => '', 'button_url' => ''];
        }

        $settings->facilities_cards = array_values($cards);
        $settings->save();

        return $this->successResponse(
            ['path' => $url],
            'Service card image uploaded successfully.'
        );
    }

    /**
     * GET /api/settings/faq
     * Get website FAQ page settings.
     */
    public function showFaq(FaqSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/faq
     * Update website FAQ page settings.
     */
    public function updateFaq(UpdateFaqSettingsRequest $request, FaqSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'FAQ page settings updated successfully.');
    }

    /**
     * POST /api/settings/faq/banner-image
     * Upload the FAQ page banner background image via Spatie MediaLibrary.
     */
    public function uploadFaqBannerImage(Request $request, FaqSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $extension = $request->file('image')->getClientOriginalExtension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('faq-banner');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("faq-banner.{$extension}")
            ->toMediaCollection('faq-banner');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('faq-banner', 'faq-banner-web')
            ?: $freshContent->getFirstMediaUrl('faq-banner') ?: null;

        $settings->banner_image_url = $url;
        $settings->banner_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['banner_image_url' => $url]),
            'FAQ banner image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/faq/section-bg-image
     * Upload the FAQ section side background image via Spatie MediaLibrary.
     */
    public function uploadFaqSectionBgImage(Request $request, FaqSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $extension = $request->file('image')->getClientOriginalExtension();

        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('faq-section-bg');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("faq-section-bg.{$extension}")
            ->toMediaCollection('faq-section-bg');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('faq-section-bg', 'faq-section-bg-web')
            ?: $freshContent->getFirstMediaUrl('faq-section-bg') ?: null;

        $settings->faq_section_bg_image_url = $url;
        $settings->faq_section_bg_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['faq_section_bg_image_url' => $url]),
            'FAQ section background image uploaded successfully.'
        );
    }

    /**
     * GET /api/settings/terms
     * Get website Terms & Conditions page settings.
     */
    public function showTerms(TermsSettings $settings, ChauffeurSettings $chauffeurSettings): JsonResponse
    {
        return $this->successResponse(array_merge($settings->toArray(), [
            'chauffeur_overtime_rate' => $chauffeurSettings->overtime_charge_per_hour,
        ]));
    }

    /**
     * PUT /api/settings/terms
     * Update website Terms & Conditions page settings.
     */
    public function updateTerms(UpdateTermsSettingsRequest $request, TermsSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Terms & Conditions settings updated successfully.');
    }

    /**
     * POST /api/settings/terms/banner-image
     * Overwrite the Terms page banner background image in-place and bump the version stamp.
     */
    public function uploadTermsBannerImage(Request $request, TermsSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $assetDir = base_path('../frontend/public/assets/images');
        $request->file('image')->move($assetDir, 'terms-banner.jpg');

        $settings->banner_image_version = time();
        $settings->save();

        return $this->successResponse($settings->toArray(), 'Terms banner image uploaded successfully.');
    }

    /**
     * GET /api/settings/privacy
     * Get website Privacy Policy page settings.
     */
    public function showPrivacy(PrivacySettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/privacy
     * Update website Privacy Policy page settings.
     */
    public function updatePrivacy(UpdatePrivacySettingsRequest $request, PrivacySettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Privacy Policy settings updated successfully.');
    }

    /**
     * POST /api/settings/privacy/banner-image
     * Overwrite the Privacy page banner background image in-place and bump the version stamp.
     */
    public function uploadPrivacyBannerImage(Request $request, PrivacySettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $assetDir = base_path('../frontend/public/assets/images');
        $request->file('image')->move($assetDir, 'privacy-banner.jpg');

        $settings->banner_image_version = time();
        $settings->save();

        return $this->successResponse($settings->toArray(), 'Privacy banner image uploaded successfully.');
    }

    /**
     * GET /api/settings/contact
     * Get website contact page settings.
     */
    public function showContact(ContactSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/contact
     * Update website contact page settings.
     */
    public function updateContact(UpdateContactSettingsRequest $request, ContactSettings $settings): JsonResponse
    {
        $this->authorize('updateContact', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Contact page settings updated successfully.');
    }

    /**
     * POST /api/settings/contact/banner-image
     * Overwrite the contact page banner image and bump the version stamp.
     */
    public function uploadContactBannerImage(Request $request, ContactSettings $settings): JsonResponse
    {
        $this->authorize('updateContact', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $extension = $request->file('image')->getClientOriginalExtension();
        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('contact-banner');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("contact-banner.{$extension}")
            ->toMediaCollection('contact-banner');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('contact-banner', 'contact-banner-web')
            ?: $freshContent->getFirstMediaUrl('contact-banner') ?: null;

        $settings->banner_image_url = $url;
        $settings->banner_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['banner_image_url' => $url]),
            'Contact banner image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/contact/section-bg-image
     * Overwrite the contact section background image and bump the version stamp.
     */
    public function uploadContactSectionBgImage(Request $request, ContactSettings $settings): JsonResponse
    {
        $this->authorize('updateContact', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $extension = $request->file('image')->getClientOriginalExtension();
        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('contact-section-bg');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("contact-section-bg.{$extension}")
            ->toMediaCollection('contact-section-bg');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('contact-section-bg', 'contact-section-bg-web')
            ?: $freshContent->getFirstMediaUrl('contact-section-bg') ?: null;

        $settings->contact_section_bg_image_url = $url;
        $settings->contact_section_bg_image_version = time();
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['contact_section_bg_image_url' => $url]),
            'Contact section background image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/services/listings-banner-image
     * Upload the listings page banner background image via Spatie MediaLibrary.
     */
    public function uploadListingsBannerImage(Request $request, ServicesSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $extension = $request->file('image')->getClientOriginalExtension();
        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('listings-banner');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("listings-banner.{$extension}")
            ->toMediaCollection('listings-banner');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('listings-banner', 'listings-banner-web')
            ?: $freshContent->getFirstMediaUrl('listings-banner') ?: null;

        $settings->listings_banner_image_url = $url;
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['listings_banner_image_url' => $url]),
            'Listings banner image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/services/airport-transfer-banner-image
     * Upload the airport transfer page banner background image via Spatie MediaLibrary.
     */
    public function uploadAirportTransferBannerImage(Request $request, ServicesSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $extension = $request->file('image')->getClientOriginalExtension();
        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('airport-transfer-banner');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("airport-transfer-banner.{$extension}")
            ->toMediaCollection('airport-transfer-banner');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('airport-transfer-banner', 'airport-transfer-banner-web')
            ?: $freshContent->getFirstMediaUrl('airport-transfer-banner') ?: null;

        $settings->airport_transfer_banner_image_url = $url;
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['airport_transfer_banner_image_url' => $url]),
            'Airport transfer banner image uploaded successfully.'
        );
    }

    /**
     * POST /api/settings/services/chauffeur-banner-image
     * Upload the chauffeur services page banner background image via Spatie MediaLibrary.
     */
    public function uploadChauffeurBannerImage(Request $request, ServicesSettings $settings): JsonResponse
    {
        $this->authorize('updateAbout', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $extension = $request->file('image')->getClientOriginalExtension();
        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('chauffeur-banner');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("chauffeur-banner.{$extension}")
            ->toMediaCollection('chauffeur-banner');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('chauffeur-banner', 'chauffeur-banner-web')
            ?: $freshContent->getFirstMediaUrl('chauffeur-banner') ?: null;

        $settings->chauffeur_banner_image_url = $url;
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['chauffeur_banner_image_url' => $url]),
            'Chauffeur banner image uploaded successfully.'
        );
    }

    /**
     * GET /api/settings/footer
     * Get website footer settings.
     */
    public function showFooter(FooterSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/footer
     * Update website footer settings.
     */
    public function updateFooter(UpdateFooterSettingsRequest $request, FooterSettings $settings): JsonResponse
    {
        $this->authorize('updateFooter', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Footer settings updated successfully.');
    }

    /**
     * GET /api/settings/notifications
     * Get system-wide notification settings.
     */
    public function showNotificationSystem(NotificationSystemSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/notifications
     * Update system-wide notification settings.
     */
    public function updateNotificationSystem(UpdateNotificationSystemSettingsRequest $request, NotificationSystemSettings $settings): JsonResponse
    {
        $this->authorize('updateGeneral', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Notification settings updated successfully.');
    }

    /**
     * GET /api/settings/popups
     * Get popup settings.
     */
    public function showPopups(PopupSettings $settings): JsonResponse
    {
        return $this->successResponse($settings->toArray());
    }

    /**
     * PUT /api/settings/popups
     * Update popup settings.
     */
    public function updatePopups(UpdatePopupSettingsRequest $request, PopupSettings $settings): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        foreach ($request->validated() as $key => $value) {
            $settings->$key = $value;
        }

        $settings->save();

        return $this->successResponse($settings->toArray(), 'Popup settings updated successfully.');
    }

    /**
     * POST /api/settings/popups/promo-image
     * Upload the promo popup image via Spatie MediaLibrary.
     */
    public function uploadPromoImage(Request $request, PopupSettings $settings): JsonResponse
    {
        $this->authorize('updateHomepage', GeneralSettings::class);

        $request->validate([
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $extension = $request->file('image')->getClientOriginalExtension();
        $siteContent = SiteContent::instance();
        $siteContent->clearMediaCollection('promo-popup-image');
        $siteContent->addMediaFromRequest('image')
            ->usingFileName("promo-popup-image.{$extension}")
            ->toMediaCollection('promo-popup-image');

        $freshContent = $siteContent->fresh();
        $url = $freshContent->getFirstMediaUrl('promo-popup-image', 'promo-popup-image-web')
            ?: $freshContent->getFirstMediaUrl('promo-popup-image') ?: null;

        $versionedUrl = null;
        if ($url !== null) {
            $separator = str_contains($url, '?') ? '&' : '?';
            $versionedUrl = "{$url}{$separator}v=" . now()->valueOf();
        }

        $settings->promo_image_url = $versionedUrl;
        $settings->save();

        return $this->successResponse(
            array_merge($settings->toArray(), ['promo_image_url' => $versionedUrl]),
            'Promo image uploaded successfully.'
        );
    }

    /**
     * Compose a representative SMS message body for the given notification type.
     *
     * Tries to render the stored SMS template with sample data. Falls back to an
     * embedded string when no template record exists for that key.
     */
    private function composeSmsTestMessage(string $type, string $appName): string
    {
        /** @var array<string, array<string, string>> $sampleData */
        $sampleData = [
            'new_booking' => ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla'],
            'rental_cancelled' => ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla'],
            'pickup_reminder' => ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla', 'pickup_date' => '25 Apr 2026'],
            'return_reminder' => ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla', 'return_date' => '25 Apr 2026'],
            'overdue_alert' => ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'vehicle_name' => 'Toyota Corolla'],
            'payment_confirmation' => ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001'],
            'rental_status_change' => ['customer_name' => 'John Doe', 'booking_reference' => 'REF-TEST001', 'new_status' => 'Confirmed', 'vehicle_name' => 'Toyota Corolla'],
            'admin_new_booking' => ['booking_reference' => 'REF-TEST001', 'branch_name' => 'Main Branch', 'customer_name' => 'John Doe', 'vehicle_name' => 'Toyota Corolla', 'total_amount' => '500.00'],
            'airport_booking' => ['customer_name' => 'John Doe', 'booking_reference' => 'ABK-TEST001', 'scheduled_at' => 'Sat, 25 Apr 2026 09:00'],
            'airport_booking_cancelled' => ['customer_name' => 'John Doe', 'booking_reference' => 'ABK-TEST001'],
            'airport_booking_status_changed' => ['booking_reference' => 'ABK-TEST001', 'new_status' => 'Confirmed'],
            'chauffeur_booking' => ['customer_name' => 'John Doe', 'booking_reference' => 'CHF-TEST001', 'pickup_time' => 'Sat, 25 Apr 2026 08:00', 'vehicle_name' => 'Toyota Corolla'],
            'chauffeur_booking_cancelled' => ['customer_name' => 'John Doe', 'booking_reference' => 'CHF-TEST001'],
            'chauffeur_booking_status_changed' => ['booking_reference' => 'CHF-TEST001', 'new_status' => 'Confirmed'],
            'chauffeur_pickup_reminder' => ['customer_name' => 'John Doe', 'booking_reference' => 'CHF-TEST001', 'pickup_time' => 'Sat, 25 Apr 2026 08:00', 'vehicle_name' => 'Toyota Corolla'],
            'driver_document_expiry' => ['driver_name' => 'John Driver', 'document_type' => "driver's license", 'expiry_date' => '09 May 2026'],
            'vehicle_expiry' => ['vehicle_name' => 'Toyota Corolla', 'plate_number' => 'GR-1234-20', 'document_type' => 'roadworthy', 'expiry_date' => '09 May 2026', 'days_until_expiry' => '14'],
        ];

        /** @var array<string, string> $fallbacks */
        $fallbacks = [
            'new_booking' => "[{$appName}] TEST: Your booking REF-TEST001 has been received. Pickup: 25 Apr 2026. We will confirm shortly.",
            'rental_cancelled' => "[{$appName}] TEST: Your booking REF-TEST001 has been cancelled. Contact us if this was unexpected.",
            'pickup_reminder' => "[{$appName}] TEST: Reminder - your vehicle pickup is tomorrow. Booking: REF-TEST001.",
            'return_reminder' => "[{$appName}] TEST: Reminder - your vehicle return is due tomorrow. Booking: REF-TEST001. Please return on time.",
            'overdue_alert' => "[{$appName}] TEST: OVERDUE - Your rental REF-TEST001 was due for return yesterday. Please return immediately or contact us.",
            'payment_confirmation' => "[{$appName}] TEST: Payment confirmed for booking REF-TEST001. Thank you!",
            'rental_status_change' => "[{$appName}] TEST: Your rental REF-TEST001 status has been updated to: Confirmed.",
            'admin_new_booking' => "[{$appName}] ADMIN TEST: New booking received - REF-TEST001. Customer: John Doe. Vehicle: Toyota Corolla.",
            'airport_booking' => "[{$appName}] TEST: Airport transfer ABK-TEST001 confirmed. Passenger: John Doe. Date: 25 Apr 2026.",
            'airport_booking_cancelled' => "[{$appName}] TEST: Airport transfer ABK-TEST001 has been cancelled.",
            'airport_booking_status_changed' => "[{$appName}] TEST: Airport transfer ABK-TEST001 status updated to: Confirmed.",
            'chauffeur_booking' => "[{$appName}] TEST: Chauffeur booking CHF-TEST001 confirmed. Client: John Doe. Date: 25 Apr 2026.",
            'chauffeur_booking_cancelled' => "[{$appName}] TEST: Chauffeur booking CHF-TEST001 has been cancelled.",
            'chauffeur_booking_status_changed' => "[{$appName}] TEST: Chauffeur booking CHF-TEST001 status updated to: Confirmed.",
            'chauffeur_pickup_reminder' => "[{$appName}] TEST: Reminder - chauffeur pickup tomorrow at 08:00 AM for CHF-TEST001.",
            'driver_document_expiry' => "[{$appName}] TEST: Driver alert - John Driver's license expires in 14 days (09 May 2026).",
            'vehicle_expiry' => "[{$appName}] TEST: Vehicle alert - Toyota Corolla (GR-1234-20) roadworthy expires in 14 days (09 May 2026).",
        ];

        if (isset($sampleData[$type])) {
            $template = $this->smsTemplateService->getTemplate($type);
            if ($template) {
                return $this->smsTemplateService->render($template, $sampleData[$type]);
            }
        }

        return $fallbacks[$type] ?? "[{$appName}] TEST: This is a test SMS to confirm your SMS provider is configured correctly.";
    }
}
