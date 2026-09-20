<?php

use App\Models\Customer;
use App\Models\User;
use App\Models\Vehicle;
use App\Settings\EmailSettings;
use App\Settings\GeneralSettings;
use App\Settings\PricingSettings;
use App\Settings\RentalSettings;
use App\Settings\SeoSettings;
use App\Settings\WhatsAppSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

/* Helpers */
/**
 * @param  array<string, mixed>  $overrides
 */
function seedGeneralSettings(array $overrides = []): void
{
    $settings = app(GeneralSettings::class);

    $defaults = [
        'site_name' => 'Swiftflitz',
        'site_email' => 'info@swiftflitz.com',
        'site_phone' => '+233201234567',
        'site_address' => '123 Main St',
        'currency' => 'GHS',
        'currency_symbol' => '₵',
        'timezone' => 'Africa/Accra',
        'logo_url' => null,
        'favicon_url' => null,
        'maintenance_mode' => false,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/**
 * @param  array<string, mixed>  $overrides
 */
function seedRentalSettings(array $overrides = []): void
{
    $settings = app(RentalSettings::class);

    $defaults = [
        'min_rental_days' => 1,
        'max_rental_days' => 365,
        'booking_advance_days' => 0,
        'require_license_verification' => true,
        'allow_public_booking' => true,
        'auto_confirm_bookings' => false,
        'overdue_check_hour' => 8,
        'return_reminder_hours_before' => '24',
        'allow_online_booking' => true,
        'booking_requires_confirmation' => true,
        'booking_grace_period_hours' => 2,
        'vat_enabled' => false,
        'vat_rate' => 15.0,
        'coupon_code_prefix' => 'SF',
        'pickup_window_start' => '08:00',
        'pickup_window_end' => '20:00',
        'return_time_threshold' => null,
        'documents_required' => false,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/**
 * @param  array<string, mixed>  $overrides
 */
function seedPricingSettings(array $overrides = []): void
{
    $settings = app(PricingSettings::class);

    $defaults = [
        'default_daily_rate' => 100.0,
        'weekly_discount_percentage' => 5.0,
        'monthly_discount_percentage' => 10.0,
        'show_prices_on_website' => true,
        'deposit_percentage' => 20.0,
        'charge_deposit' => true,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/**
 * @param  array<string, mixed>  $overrides
 */
function seedEmailSettings(array $overrides = []): void
{
    $settings = app(EmailSettings::class);

    $defaults = [
        'mailer' => 'smtp',
        'host' => 'smtp.mailtrap.io',
        'port' => 587,
        'encryption' => 'tls',
        'username' => 'test@example.com',
        'password' => null,
        'from_address' => 'noreply@swiftflitz.com',
        'from_name' => 'Swiftflitz',
        'send_new_booking_notification' => true,
        'send_return_reminder' => true,
        'send_overdue_alert' => true,
        'send_quote_confirmation' => true,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/**
 * @param  array<string, mixed>  $overrides
 */
function seedWhatsAppSettings(array $overrides = []): void
{
    $settings = app(WhatsAppSettings::class);

    $defaults = [
        'enabled' => false,
        'access_token' => null,
        'phone_number_id' => null,
        'business_account_id' => null,
        'test_mode' => false,
        'test_phone_number' => null,
        'admin_only_mode' => false,
        'admin_phone_number' => null,
        'notify_customers' => true,
        'send_new_booking' => true,
        'send_return_reminder' => true,
        'send_overdue_alert' => true,
        'send_pickup_reminder' => false,
        'send_payment_confirmation' => false,
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/**
 * @param  array<string, mixed>  $overrides
 */
function seedSeoSettings(array $overrides = []): void
{
    $settings = app(SeoSettings::class);

    $defaults = [
        'meta_title' => 'Swiftflitz - Car Rentals',
        'meta_description' => 'Best car rentals.',
        'meta_keywords' => null,
        'og_image' => null,
        'google_analytics_id' => null,
        'google_tag_manager_id' => null,
        'facebook_pixel_id' => null,
        'robots' => 'index, follow',
    ];

    foreach (array_merge($defaults, $overrides) as $key => $value) {
        $settings->$key = $value;
    }

    $settings->save();
}

/* General Settings */
it('general settings are publicly accessible without authentication', function () {
    $this->getJson('/api/v1/settings/general')
        ->assertSuccessful();
});

it('can view general settings', function () {
    $user = User::factory()->create();
    seedGeneralSettings();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/general')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('site_name')
        ->and($data)->toHaveKey('site_email')
        ->and($data)->toHaveKey('currency')
        ->and($data)->toHaveKey('timezone');
});

it('requires authentication to update general settings', function () {
    $this->putJson('/api/v1/settings/general', [])
        ->assertUnauthorized();
});

it('can update general settings site name', function () {
    seedGeneralSettings(['site_name' => 'Old Name']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/general', [
            'site_name' => 'New Name',
        ])
        ->assertSuccessful();

    $settings = app(GeneralSettings::class);
    expect($settings->site_name)->toBe('New Name');
});

it('can update general settings currency', function () {
    seedGeneralSettings(['currency' => 'GHS']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/general', [
            'currency' => 'USD',
        ])
        ->assertSuccessful();

    $settings = app(GeneralSettings::class);
    expect($settings->currency)->toBe('USD');
});

/* Rental Settings */
it('requires authentication to view rental settings', function () {
    $this->getJson('/api/v1/settings/rental')
        ->assertUnauthorized();
});

it('can view rental settings', function () {
    $user = User::factory()->create();
    seedRentalSettings();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/rental')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('min_rental_days')
        ->and($data)->toHaveKey('max_rental_days')
        ->and($data)->toHaveKey('allow_public_booking');
});

it('requires authentication to update rental settings', function () {
    $this->putJson('/api/v1/settings/rental', [])
        ->assertUnauthorized();
});

it('can update rental settings min days', function () {
    seedRentalSettings(['min_rental_days' => 1]);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/rental', [
            'min_rental_days' => 2,
        ])
        ->assertSuccessful();

    $settings = app(RentalSettings::class);
    expect($settings->min_rental_days)->toBe(2);
});

it('can toggle allow_public_booking in rental settings', function () {
    seedRentalSettings(['allow_public_booking' => true]);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/rental', [
            'allow_public_booking' => false,
        ])
        ->assertSuccessful();

    $settings = app(RentalSettings::class);
    expect($settings->allow_public_booking)->toBeFalse();
});

/* Pricing Settings */
it('requires authentication to view pricing settings', function () {
    $this->getJson('/api/v1/settings/pricing')
        ->assertUnauthorized();
});

it('can view pricing settings', function () {
    $user = User::factory()->create();
    seedPricingSettings();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/pricing')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('default_daily_rate')
        ->and($data)->toHaveKey('weekly_discount_percentage')
        ->and($data)->toHaveKey('deposit_percentage');
});

it('can update pricing settings daily rate', function () {
    seedPricingSettings(['default_daily_rate' => 100.0]);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/pricing', [
            'default_daily_rate' => 150.0,
        ])
        ->assertSuccessful();

    $settings = app(PricingSettings::class);
    expect($settings->default_daily_rate)->toBe(150.0);
});

/* Email Settings */
it('requires authentication to view email settings', function () {
    $this->getJson('/api/v1/settings/email')
        ->assertUnauthorized();
});

it('can view email settings', function () {
    $user = User::factory()->create();
    seedEmailSettings();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/email')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('mailer')
        ->and($data)->toHaveKey('host')
        ->and($data)->toHaveKey('from_address');
});

it('masks email password in response', function () {
    $user = User::factory()->create();
    seedEmailSettings(['password' => 'supersecret']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/email')
        ->assertSuccessful();

    expect($response->json('data.password'))->toBe('••••••••••••••••');
});

it('does not mask empty email password', function () {
    $user = User::factory()->create();
    seedEmailSettings(['password' => null]);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/email')
        ->assertSuccessful();

    expect($response->json('data.password'))->toBeNull();
});

it('can update email settings from address', function () {
    seedEmailSettings(['from_address' => 'old@swiftflitz.com']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/email', [
            'from_address' => 'new@swiftflitz.com',
        ])
        ->assertSuccessful();

    $settings = app(EmailSettings::class);
    expect($settings->from_address)->toBe('new@swiftflitz.com');
});

it('requires authentication to send test email', function () {
    $this->postJson('/api/v1/settings/email/test', ['email' => 'test@example.com'])
        ->assertUnauthorized();
});

it('requires admin permission to send test email', function () {
    $user = User::factory()->create();
    seedEmailSettings();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/email/test', ['email' => 'test@example.com'])
        ->assertForbidden();
});

it('validates email address for test email', function () {
    seedEmailSettings();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/settings/email/test', ['email' => 'not-an-email'])
        ->assertUnprocessable();
});

it('sends test email using stored smtp configuration', function () {
    Mail::fake();
    seedEmailSettings(['host' => 'smtp.mailtrap.io', 'port' => 587]);

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/settings/email/test', ['email' => 'admin@example.com'])
        ->assertSuccessful()
        ->assertJsonPath('message', 'Test email sent successfully.');

    Mail::assertSent(\App\Mail\TestConnectionMail::class);
});

/* WhatsApp Settings */
it('requires authentication to view whatsapp settings', function () {
    $this->getJson('/api/v1/settings/whatsapp')
        ->assertUnauthorized();
});

it('can view whatsapp settings', function () {
    $user = User::factory()->create();
    seedWhatsAppSettings();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/whatsapp')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('enabled')
        ->and($data)->toHaveKey('send_new_booking');
});

it('masks whatsapp access token in response', function () {
    $user = User::factory()->create();
    seedWhatsAppSettings(['access_token' => 'secret-access-token']);

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/whatsapp')
        ->assertSuccessful();

    expect($response->json('data.access_token'))->toBe('••••••••••••••••');
});

it('can update whatsapp enabled toggle', function () {
    seedWhatsAppSettings(['enabled' => false]);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/whatsapp', [
            'enabled' => true,
        ])
        ->assertSuccessful();

    $settings = app(WhatsAppSettings::class);
    expect($settings->enabled)->toBeTrue();
});

/* SEO Settings */
it('can view seo settings without authentication', function () {
    seedSeoSettings();

    $response = $this->getJson('/api/v1/settings/seo')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('meta_title')
        ->and($data)->toHaveKey('meta_description')
        ->and($data)->toHaveKey('robots');
});

it('can view seo settings', function () {
    $user = User::factory()->create();
    seedSeoSettings();

    $response = $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/settings/seo')
        ->assertSuccessful();

    $data = $response->json('data');

    expect($data)->toHaveKey('meta_title')
        ->and($data)->toHaveKey('meta_description')
        ->and($data)->toHaveKey('robots');
});

it('can update seo settings meta title', function () {
    seedSeoSettings(['meta_title' => 'Old Title']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/seo', [
            'meta_title' => 'New SEO Title',
        ])
        ->assertSuccessful();

    $settings = app(SeoSettings::class);
    expect($settings->meta_title)->toBe('New SEO Title');
});

it('can update seo robots setting', function () {
    seedSeoSettings(['robots' => 'index, follow']);

    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/seo', [
            'robots' => 'noindex, nofollow',
        ])
        ->assertSuccessful();

    $settings = app(SeoSettings::class);
    expect($settings->robots)->toBe('noindex, nofollow');
});

/* Website Content Authorization */
it('denies homepage update without website.edit_homepage permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/homepage', [
            'hero_title' => 'New Hero',
        ])
        ->assertForbidden();
});

it('allows homepage update with website.edit_homepage permission', function () {
    Permission::firstOrCreate(
        ['name' => 'website.edit_homepage', 'guard_name' => 'web']
    );
    $user = User::factory()->create();
    $user->givePermissionTo('website.edit_homepage');

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/homepage', [])
        ->assertSuccessful();
});

it('allows super admin to update homepage', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/homepage', [])
        ->assertSuccessful();
});

it('denies about page update without website.edit_about permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/about', [])
        ->assertForbidden();
});

it('allows about page update with website.edit_about permission', function () {
    Permission::firstOrCreate(
        ['name' => 'website.edit_about', 'guard_name' => 'web']
    );
    $user = User::factory()->create();
    $user->givePermissionTo('website.edit_about');

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/about', [])
        ->assertSuccessful();
});

it('denies contact page update without website.edit_contact permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/contact', [])
        ->assertForbidden();
});

it('allows contact page update with website.edit_contact permission', function () {
    Permission::firstOrCreate(
        ['name' => 'website.edit_contact', 'guard_name' => 'web']
    );
    $user = User::factory()->create();
    $user->givePermissionTo('website.edit_contact');

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/contact', [])
        ->assertSuccessful();
});

/* Test Email Permission */
it('requires settings.test_email permission to send test email', function () {
    $user = User::factory()->create();
    seedEmailSettings();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/email/test', ['email' => 'test@example.com'])
        ->assertForbidden();
});

it('allows sending test email with settings.test_email permission', function () {
    Mail::fake();
    Permission::firstOrCreate(
        ['name' => 'settings.test_email', 'guard_name' => 'web']
    );
    $user = User::factory()->create();
    $user->givePermissionTo('settings.test_email');
    seedEmailSettings();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/settings/email/test', ['email' => 'test@example.com'])
        ->assertSuccessful();
});

/* Rental Settings Enforcement */
it('blocks website booking when allow_online_booking is disabled', function () {
    seedRentalSettings(['allow_online_booking' => false]);
    seedPricingSettings();

    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => now()->addDay()->format('Y-m-d'),
            'return_date' => now()->addDays(4)->format('Y-m-d'),
            'source' => 'website',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['source']);
});

it('allows website booking when allow_online_booking is enabled', function () {
    seedRentalSettings(['allow_online_booking' => true]);
    seedPricingSettings();

    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => now()->addDay()->format('Y-m-d'),
            'return_date' => now()->addDays(4)->format('Y-m-d'),
            'source' => 'website',
        ])
        ->assertCreated();
});

it('enforces minimum rental days from settings', function () {
    seedRentalSettings(['allow_online_booking' => true, 'min_rental_days' => 3]);
    seedPricingSettings();

    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => now()->addDay()->format('Y-m-d'),
            'return_date' => now()->addDays(2)->format('Y-m-d'), // only 1 day
            'source' => 'walk_in',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['return_date']);
});

it('enforces maximum rental days from settings', function () {
    seedRentalSettings(['allow_online_booking' => true, 'max_rental_days' => 5]);
    seedPricingSettings();

    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => now()->addDay()->format('Y-m-d'),
            'return_date' => now()->addDays(10)->format('Y-m-d'), // 9 days, exceeds max of 5
            'source' => 'walk_in',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['return_date']);
});

it('auto-confirms website booking when auto_confirm is enabled and confirmation not required', function () {
    seedRentalSettings([
        'allow_online_booking' => true,
        'auto_confirm_bookings' => true,
        'booking_requires_confirmation' => false,
    ]);
    seedPricingSettings();

    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => now()->addDay()->format('Y-m-d'),
            'return_date' => now()->addDays(4)->format('Y-m-d'),
            'source' => 'website',
        ])
        ->assertCreated();

    expect($response->json('data.status'))->toBe('confirmed');
});

it('creates pending status when auto_confirm is disabled for website booking', function () {
    seedRentalSettings([
        'allow_online_booking' => true,
        'auto_confirm_bookings' => false,
    ]);
    seedPricingSettings();

    $vehicle = Vehicle::factory()->create(['daily_rate' => 200.00, 'status' => 'available']);
    $customer = Customer::factory()->create();

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/rentals', [
            'vehicle_id' => $vehicle->id,
            'customer_id' => $customer->id,
            'pickup_date' => now()->addDay()->format('Y-m-d'),
            'return_date' => now()->addDays(4)->format('Y-m-d'),
            'source' => 'website',
        ])
        ->assertCreated();

    expect($response->json('data.status'))->toBe('pending');
});
