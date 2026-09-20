<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('payment.hubtel_client_id', null);
        $this->migrator->add('payment.hubtel_client_secret', null);
        $this->migrator->add('payment.enable_hubtel', false);
        $this->migrator->add('payment.paystack_logo_url', 'http://profitbooks.net/wp-content/uploads/2020/01/paystack-logo.jpg');
        $this->migrator->add('payment.stripe_logo_url', 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg');
        $this->migrator->add('payment.hubtel_logo_url', 'https://hubtel.com/_nuxt/hubtel-primary-logo.DE_lS_hk.svg');
    }
};
