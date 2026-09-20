<?php

use App\Mail\AdminProfileSubmittedMail;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;

uses(RefreshDatabase::class);

it('uses frontend_url in AdminProfileSubmittedMail action button', function () {
    $customer = Customer::factory()->create();

    Config::set('app.admin_url', 'https://app.swiftflitz.test');

    $mailable = new AdminProfileSubmittedMail($customer, 'REF-001');
    $rendered = $mailable->render();

    expect($rendered)->toContain('https://app.swiftflitz.test/management/customers/' . $customer->id);
});

it('does not use backend api url in AdminProfileSubmittedMail', function () {
    $customer = Customer::factory()->create();

    $backendUrl = config('app.url');
    $frontendUrl = config('app.admin_url');

    $mailable = new AdminProfileSubmittedMail($customer, 'REF-002');
    $rendered = $mailable->render();

    // Must NOT point to the backend API URL
    expect($rendered)->not->toContain($backendUrl . '/management/customers/');
    // Must point to the admin/frontend URL
    expect($rendered)->toContain($frontendUrl . '/management/customers/' . $customer->id);
});
