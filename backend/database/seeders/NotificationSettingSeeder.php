<?php

namespace Database\Seeders;

use App\Models\NotificationSetting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class NotificationSettingSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Create default notification settings for every seeded user.
     * Super admins default to all disabled (they have full visibility in the app).
     * All other users default to all enabled.
     */
    public function run(): void
    {
        $superAdminDefaults = [
            /* In-app notification toggles */
            'new_booking' => false,
            'return_reminder' => false,
            'overdue_alert' => false,
            'quote_request' => false,
            'vehicle_expiry' => false,
            'pickup_reminder' => false,
            'rental_status_change' => false,
            'payment_confirmation' => false,
            'document_expiry_alert' => false,
            'rental_cancelled' => false,
            'airport_booking' => false,
            'airport_booking_cancelled' => false,
            'airport_booking_status_changed' => false,
            'chauffeur_booking' => false,
            'chauffeur_booking_cancelled' => false,
            'chauffeur_booking_status_changed' => false,
            'chauffeur_pickup_reminder' => false,
            'driver_document_expiry' => false,
            /* Email notification toggles */
            'email_new_booking' => false,
            'email_return_reminder' => false,
            'email_overdue_alert' => false,
            'email_quote_request' => false,
            'email_vehicle_expiry' => false,
            'email_pickup_reminder' => false,
            'email_rental_status_change' => false,
            'email_payment_confirmation' => false,
            'email_document_expiry_alert' => false,
            'email_rental_cancelled' => false,
            'email_airport_booking' => false,
            'email_airport_booking_cancelled' => false,
            'email_airport_booking_status_changed' => false,
            'email_chauffeur_booking' => false,
            'email_chauffeur_booking_cancelled' => false,
            'email_chauffeur_booking_status_changed' => false,
            'email_chauffeur_pickup_reminder' => false,
            'email_driver_document_expiry' => false,
        ];

        User::query()->each(function (User $user) use ($superAdminDefaults): void {
            $defaults = $user->hasRole('super_admin') ? $superAdminDefaults : [];

            NotificationSetting::firstOrCreate(['user_id' => $user->id], $defaults);
        });

        $this->command->info('Notification settings seeded for all users.');
    }
}
