<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('sms.send_rental_status_change', false);
        $this->migrator->add('sms.send_vehicle_expiry', false);
        $this->migrator->add('sms.send_quote_request', false);
        $this->migrator->add('sms.send_document_expiry_alert', false);
    }
};
