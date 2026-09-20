<?php

use App\Settings\EmailSettings;
use App\Settings\NotificationSystemSettings;
use App\Settings\SmsSettings;
use App\Settings\WhatsAppSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can set and retrieve notify_branch_managers in WhatsAppSettings', function () {
    $settings = app(WhatsAppSettings::class);
    $settings->notify_branch_managers = false;
    $settings->save();

    $fresh = app(WhatsAppSettings::class);
    expect($fresh->notify_branch_managers)->toBeFalse();

    $fresh->notify_branch_managers = true;
    $fresh->save();

    expect(app(WhatsAppSettings::class)->notify_branch_managers)->toBeTrue();
});

it('can set and retrieve notify_branch_managers in SmsSettings', function () {
    $settings = app(SmsSettings::class);
    $settings->notify_branch_managers = false;
    $settings->save();

    $fresh = app(SmsSettings::class);
    expect($fresh->notify_branch_managers)->toBeFalse();

    $fresh->notify_branch_managers = true;
    $fresh->save();

    expect(app(SmsSettings::class)->notify_branch_managers)->toBeTrue();
});

it('can set and retrieve notify_customers in EmailSettings', function () {
    $settings = app(EmailSettings::class);
    $settings->notify_customers = false;
    $settings->save();

    expect(app(EmailSettings::class)->notify_customers)->toBeFalse();
});

it('can set and retrieve notify_branch_managers in EmailSettings', function () {
    $settings = app(EmailSettings::class);
    $settings->notify_branch_managers = false;
    $settings->save();

    expect(app(EmailSettings::class)->notify_branch_managers)->toBeFalse();
});

it('can set and retrieve notify_admins in EmailSettings', function () {
    $settings = app(EmailSettings::class);
    $settings->notify_admins = false;
    $settings->save();

    expect(app(EmailSettings::class)->notify_admins)->toBeFalse();
});

it('can set and retrieve send_admin_new_booking in EmailSettings', function () {
    $settings = app(EmailSettings::class);
    $settings->send_admin_new_booking = false;
    $settings->save();

    expect(app(EmailSettings::class)->send_admin_new_booking)->toBeFalse();
});

it('can set and retrieve inapp_notify_branch_managers in NotificationSystemSettings', function () {
    $settings = app(NotificationSystemSettings::class);
    $settings->inapp_notify_branch_managers = false;
    $settings->save();

    expect(app(NotificationSystemSettings::class)->inapp_notify_branch_managers)->toBeFalse();
});

it('can set and retrieve inapp_notify_admins in NotificationSystemSettings', function () {
    $settings = app(NotificationSystemSettings::class);
    $settings->inapp_notify_admins = false;
    $settings->save();

    expect(app(NotificationSystemSettings::class)->inapp_notify_admins)->toBeFalse();
});
