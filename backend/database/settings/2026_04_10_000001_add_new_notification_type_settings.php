<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('notifications.rental_status_change', true);
        $this->migrator->add('notifications.email_rental_status_change', true);
        $this->migrator->add('notifications.payment_confirmation', true);
        $this->migrator->add('notifications.email_payment_confirmation', true);
        $this->migrator->add('notifications.document_expiry_alert', true);
        $this->migrator->add('notifications.email_document_expiry_alert', true);
    }

    public function down(): void
    {
        $this->migrator->delete('notifications.rental_status_change');
        $this->migrator->delete('notifications.email_rental_status_change');
        $this->migrator->delete('notifications.payment_confirmation');
        $this->migrator->delete('notifications.email_payment_confirmation');
        $this->migrator->delete('notifications.document_expiry_alert');
        $this->migrator->delete('notifications.email_document_expiry_alert');
    }
};
