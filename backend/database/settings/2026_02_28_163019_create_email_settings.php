<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('email.mailer', 'log');
        $this->migrator->add('email.host', 'smtp.mailtrap.io');
        $this->migrator->add('email.port', 587);
        $this->migrator->add('email.encryption', 'tls');
        $this->migrator->add('email.username', '');
        $this->migrator->add('email.password', null);
        $this->migrator->add('email.from_address', 'noreply@swiftflitz.com');
        $this->migrator->add('email.from_name', 'Swiftflitz');
        $this->migrator->add('email.send_new_booking_notification', true);
        $this->migrator->add('email.send_return_reminder', true);
        $this->migrator->add('email.send_overdue_alert', true);
        $this->migrator->add('email.send_quote_confirmation', true);
    }
};
