<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSetting extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'new_booking',
        'return_reminder',
        'overdue_alert',
        'quote_request',
        'vehicle_expiry',
        'pickup_reminder',
        'rental_status_change',
        'payment_confirmation',
        'document_expiry_alert',
        'rental_cancelled',
        'airport_booking',
        'airport_booking_cancelled',
        'airport_booking_status_changed',
        'chauffeur_booking',
        'chauffeur_booking_cancelled',
        'chauffeur_booking_status_changed',
        'chauffeur_pickup_reminder',
        'driver_document_expiry',
        'email_new_booking',
        'email_return_reminder',
        'email_overdue_alert',
        'email_quote_request',
        'email_vehicle_expiry',
        'email_pickup_reminder',
        'email_rental_status_change',
        'email_payment_confirmation',
        'email_document_expiry_alert',
        'email_rental_cancelled',
        'email_airport_booking',
        'email_airport_booking_cancelled',
        'email_airport_booking_status_changed',
        'email_chauffeur_booking',
        'email_chauffeur_booking_cancelled',
        'email_chauffeur_booking_status_changed',
        'email_chauffeur_pickup_reminder',
        'email_driver_document_expiry',
    ];

    /**
     * The user this setting belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'new_booking' => 'boolean',
            'return_reminder' => 'boolean',
            'overdue_alert' => 'boolean',
            'quote_request' => 'boolean',
            'vehicle_expiry' => 'boolean',
            'pickup_reminder' => 'boolean',
            'rental_status_change' => 'boolean',
            'payment_confirmation' => 'boolean',
            'document_expiry_alert' => 'boolean',
            'rental_cancelled' => 'boolean',
            'airport_booking' => 'boolean',
            'airport_booking_cancelled' => 'boolean',
            'airport_booking_status_changed' => 'boolean',
            'chauffeur_booking' => 'boolean',
            'chauffeur_booking_cancelled' => 'boolean',
            'chauffeur_booking_status_changed' => 'boolean',
            'chauffeur_pickup_reminder' => 'boolean',
            'driver_document_expiry' => 'boolean',
            'email_new_booking' => 'boolean',
            'email_return_reminder' => 'boolean',
            'email_overdue_alert' => 'boolean',
            'email_quote_request' => 'boolean',
            'email_vehicle_expiry' => 'boolean',
            'email_pickup_reminder' => 'boolean',
            'email_rental_status_change' => 'boolean',
            'email_payment_confirmation' => 'boolean',
            'email_document_expiry_alert' => 'boolean',
            'email_rental_cancelled' => 'boolean',
            'email_airport_booking' => 'boolean',
            'email_airport_booking_cancelled' => 'boolean',
            'email_airport_booking_status_changed' => 'boolean',
            'email_chauffeur_booking' => 'boolean',
            'email_chauffeur_booking_cancelled' => 'boolean',
            'email_chauffeur_booking_status_changed' => 'boolean',
            'email_chauffeur_pickup_reminder' => 'boolean',
            'email_driver_document_expiry' => 'boolean',
        ];
    }
}
