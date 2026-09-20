<?php

use App\Models\User;
use App\Settings\EmailSettings;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

/* Helpers */

function settingsAdminUser(): User
{
    $user = User::factory()->create();
    $role = Role::findOrCreate('admin', 'web');
    $user->assignRole($role);

    return $user;
}

function settingsManagerUser(): User
{
    $user = User::factory()->create();
    $role = Role::findOrCreate('manager', 'web');
    $user->assignRole($role);

    return $user;
}

function grantSettingsPerm(User $user, string $permission): void
{
    Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    $user->givePermissionTo($permission);
}

function seedBaseGeneralSettings(): void
{
    $settings = app(GeneralSettings::class);
    $settings->site_name = 'Test';
    $settings->site_email = 'test@example.com';
    $settings->site_phone = '+233200000000';
    $settings->site_address = '123 Main St';
    $settings->currency = 'GHS';
    $settings->currency_symbol = '₵';
    $settings->timezone = 'Africa/Accra';
    $settings->logo_url = null;
    $settings->favicon_url = null;
    $settings->maintenance_mode = false;
    $settings->save();
}

function seedBaseEmailSettings(): void
{
    $settings = app(EmailSettings::class);
    $settings->mailer = 'smtp';
    $settings->host = 'smtp.example.com';
    $settings->port = 587;
    $settings->username = 'user';
    $settings->password = 'secret';
    $settings->from_address = 'noreply@example.com';
    $settings->from_name = 'Test';
    $settings->encryption = 'tls';
    $settings->save();
}

/* SettingsPolicy tests */

it('super_admin can update general settings', function () {
    seedBaseGeneralSettings();
    $user = adminUser();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/general', ['site_name' => 'Updated'])
        ->assertSuccessful();
});

it('admin with settings.edit_email permission can update email settings', function () {
    seedBaseEmailSettings();
    $user = settingsAdminUser();
    grantSettingsPerm($user, 'settings.edit_email');

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/email', [
            'mailer' => 'smtp',
            'host' => 'smtp.mailtrap.io',
            'port' => 587,
            'username' => 'user',
            'password' => 'secret',
            'from_address' => 'noreply@test.com',
            'from_name' => 'Test App',
            'encryption' => 'tls',
        ])
        ->assertSuccessful();
});

it('admin without settings.edit_email is denied email settings update', function () {
    seedBaseEmailSettings();
    $user = settingsAdminUser();

    /* admin role - but NO settings.edit_email permission granted */

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/email', [
            'mailer' => 'smtp',
            'host' => 'smtp.mailtrap.io',
            'port' => 587,
            'username' => 'user',
            'password' => 'secret',
            'from_address' => 'noreply@test.com',
            'from_name' => 'Test App',
            'encryption' => 'tls',
        ])
        ->assertForbidden();
});

it('manager cannot update general settings', function () {
    seedBaseGeneralSettings();
    $user = settingsManagerUser();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/settings/general', ['site_name' => 'Hacked'])
        ->assertForbidden();
});
