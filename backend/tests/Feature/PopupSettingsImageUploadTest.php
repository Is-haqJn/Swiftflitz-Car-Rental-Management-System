<?php

use App\Settings\PopupSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

it('uploads promo popup image and stores a cache-busted image url', function () {
    $file = UploadedFile::fake()->image('promo.jpg', 640, 360);

    $response = $this->actingAs(adminUser(), 'sanctum')
        ->postJson('/api/v1/settings/popups/promo-image', [
            'image' => $file,
        ])
        ->assertSuccessful();

    $uploadedUrl = $response->json('data.promo_image_url');

    expect($uploadedUrl)
        ->not->toBeNull()
        ->toContain('?v=');

    $settings = app(PopupSettings::class);
    expect($settings->promo_image_url)->toBe($uploadedUrl);
});
