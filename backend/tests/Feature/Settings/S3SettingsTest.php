<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('stores credentials on PUT /settings/s3', function () {
    $this->actingAs(adminUser(), 'sanctum')
        ->putJson('/api/v1/settings/s3', [
            'aws_access_key_id' => 'AKIAIOSFODNN7EXAMPLE',
            'aws_secret_access_key' => 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            'aws_default_region' => 'us-east-1',
            'aws_bucket' => 'my-rental-bucket',
            'aws_url' => null,
            'aws_endpoint' => null,
            'use_path_style_endpoint' => false,
        ])
        ->assertOk();
});

it('returns access_key_id masked as 16 bullets on GET', function () {
    $admin = adminUser();

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings/s3', [
            'aws_access_key_id' => 'AKIAIOSFODNN7EXAMPLE',
        ])
        ->assertOk();

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/settings/s3')
        ->assertOk()
        ->assertJsonPath('data.aws_access_key_id', '••••••••••••••••');
});

it('returns secret_access_key masked as 16 bullets on GET', function () {
    $admin = adminUser();

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings/s3', [
            'aws_secret_access_key' => 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        ])
        ->assertOk();

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/settings/s3')
        ->assertOk()
        ->assertJsonPath('data.aws_secret_access_key', '••••••••••••••••');
});

it('skips overwrite when masked value submitted', function () {
    $admin = adminUser();
    $original = 'AKIAIOSFODNN7EXAMPLE';

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings/s3', ['aws_access_key_id' => $original])
        ->assertOk();

    /* Submit masked value - original must be preserved */
    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings/s3', ['aws_access_key_id' => '••••••••••••••••'])
        ->assertOk();

    expect(app(\App\Settings\S3Settings::class)->aws_access_key_id)->toBe($original);
});

it('persists region, bucket, url, endpoint, use_path_style_endpoint', function () {
    $admin = adminUser();

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings/s3', [
            'aws_default_region' => 'eu-west-1',
            'aws_bucket' => 'fleet-media',
            'aws_url' => 'https://cdn.example.com',
            'aws_endpoint' => 'https://s3.example.com',
            'use_path_style_endpoint' => true,
        ])
        ->assertOk();

    $settings = app(\App\Settings\S3Settings::class);

    expect($settings->aws_default_region)->toBe('eu-west-1')
        ->and($settings->aws_bucket)->toBe('fleet-media')
        ->and($settings->aws_url)->toBe('https://cdn.example.com')
        ->and($settings->aws_endpoint)->toBe('https://s3.example.com')
        ->and($settings->use_path_style_endpoint)->toBeTrue();
});

it('requires settings.edit permission on PUT', function () {
    $user = \App\Models\User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/s3', ['aws_bucket' => 'test'])
        ->assertForbidden();
});
