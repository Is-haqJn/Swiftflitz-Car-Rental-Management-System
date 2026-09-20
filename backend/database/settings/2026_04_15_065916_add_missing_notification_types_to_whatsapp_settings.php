<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('whatsapp.send_rental_status_change', false);
        $this->migrator->add('whatsapp.send_vehicle_expiry', false);
        $this->migrator->add('whatsapp.send_quote_request', false);
        $this->migrator->add('whatsapp.send_document_expiry_alert', false);
    }
};
