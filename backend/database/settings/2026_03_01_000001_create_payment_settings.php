<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('payment.payment_provider', 'paystack');
        $this->migrator->add('payment.paystack_public_key', '');
        $this->migrator->add('payment.paystack_secret_key', '');
        $this->migrator->add('payment.stripe_public_key', '');
        $this->migrator->add('payment.stripe_secret_key', '');
        $this->migrator->add('payment.enable_online_payments', false);
        $this->migrator->add('payment.enable_paystack', false);
        $this->migrator->add('payment.enable_stripe', false);
        $this->migrator->add('payment.payment_currency', 'GHS');
    }
};
