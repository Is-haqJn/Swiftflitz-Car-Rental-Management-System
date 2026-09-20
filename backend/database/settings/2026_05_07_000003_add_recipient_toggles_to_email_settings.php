<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('email.notify_customers', true);
        $this->migrator->add('email.notify_branch_managers', true);
        $this->migrator->add('email.notify_admins', true);
        $this->migrator->add('email.send_admin_new_booking', true);
        $this->migrator->add('email.send_admin_rental_cancelled', true);
        $this->migrator->add('email.send_admin_pickup_reminder', true);
        $this->migrator->add('email.send_admin_return_reminder', true);
        $this->migrator->add('email.send_admin_overdue_alert', true);
        $this->migrator->add('email.send_admin_payment_confirmation', true);
        $this->migrator->add('email.send_admin_rental_status_change', true);
        $this->migrator->add('email.send_admin_airport_booking', true);
        $this->migrator->add('email.send_admin_airport_booking_cancelled', true);
        $this->migrator->add('email.send_admin_chauffeur_booking', true);
        $this->migrator->add('email.send_admin_chauffeur_booking_cancelled', true);
        $this->migrator->add('email.send_admin_chauffeur_pickup_reminder', true);
    }
};
