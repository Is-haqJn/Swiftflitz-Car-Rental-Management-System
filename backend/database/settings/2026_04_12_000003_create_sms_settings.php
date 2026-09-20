<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('sms.enabled', false);
        $this->migrator->add('sms.default_provider', 'twilio');
        $this->migrator->add('sms.test_mode', false);
        $this->migrator->add('sms.test_phone_number', null);
        $this->migrator->add('sms.admin_only_mode', false);
        $this->migrator->add('sms.admin_phone_number', null);
        $this->migrator->add('sms.notify_customers', true);
        $this->migrator->add('sms.send_new_booking', false);
        $this->migrator->add('sms.send_return_reminder', false);
        $this->migrator->add('sms.send_overdue_alert', false);
        $this->migrator->add('sms.send_pickup_reminder', false);
        $this->migrator->add('sms.send_payment_confirmation', false);
        $this->migrator->add('sms.arkessel_api_key', null);
        $this->migrator->add('sms.arkessel_sender_id', null);
        $this->migrator->add('sms.twilio_account_sid', null);
        $this->migrator->add('sms.twilio_auth_token', null);
        $this->migrator->add('sms.twilio_from_number', null);
        $this->migrator->add('sms.nalo_api_key', null);
        $this->migrator->add('sms.nalo_sender_id', null);
    }
};
