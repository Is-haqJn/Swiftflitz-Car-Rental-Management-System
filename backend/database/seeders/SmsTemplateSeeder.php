<?php

namespace Database\Seeders;

use App\Models\SmsTemplate;
use Illuminate\Database\Seeder;

class SmsTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'key' => 'new_booking',
                'name' => 'New Booking Confirmation',
                'description' => 'Sent to the customer when a new booking is created.',
                'body' => 'Hi {{customer_name}}, your booking {{booking_reference}} has been confirmed. Vehicle: {{vehicle_name}}. Thank you for choosing us!',
            ],
            [
                'key' => 'return_reminder',
                'name' => 'Return Reminder',
                'description' => 'Sent to the customer as a reminder to return the vehicle.',
                'body' => 'Reminder: Your rental {{booking_reference}} ({{vehicle_name}}) is due for return on {{return_date}}. Please ensure timely return to avoid overdue charges.',
            ],
            [
                'key' => 'overdue_alert',
                'name' => 'Overdue Alert',
                'description' => 'Sent to the customer when a rental becomes overdue.',
                'body' => 'OVERDUE NOTICE: Your rental {{booking_reference}} ({{vehicle_name}}) was due for return and is now overdue. Please contact us immediately to avoid further charges.',
            ],
            [
                'key' => 'pickup_reminder',
                'name' => 'Pickup Reminder',
                'description' => 'Sent to the customer as a reminder of their upcoming vehicle pickup.',
                'body' => 'Reminder: Your vehicle pickup for booking {{booking_reference}} ({{vehicle_name}}) is scheduled for {{pickup_date}}. We look forward to seeing you!',
            ],
            [
                'key' => 'payment_confirmation',
                'name' => 'Payment Confirmation',
                'description' => 'Sent to the customer when a payment is received.',
                'body' => 'Payment confirmed for booking {{booking_reference}}. Thank you, {{customer_name}}! Your payment has been received and recorded.',
            ],
            [
                'key' => 'admin_new_booking',
                'name' => 'Admin - New Booking Alert',
                'description' => 'Sent to the admin when a new booking is created, with branch and amount details.',
                'body' => 'New booking {{booking_reference}} from {{branch_name}} branch. Customer: {{customer_name}}. Vehicle: {{vehicle_name}}. Amount: {{total_amount}}.',
            ],
            [
                'key' => 'rental_cancelled',
                'name' => 'Rental Cancelled',
                'description' => 'Sent to the customer when a rental booking is cancelled.',
                'body' => 'Hi {{customer_name}}, your rental booking {{booking_reference}} for {{vehicle_name}} has been cancelled. If you have any questions, please contact us.',
            ],
            [
                'key' => 'rental_status_change',
                'name' => 'Rental Status Update',
                'description' => 'Sent to the customer when their rental booking status changes.',
                'body' => 'Hi {{customer_name}}, your rental booking {{booking_reference}} for {{vehicle_name}} has been updated to {{new_status}}. Contact us if you have any questions.',
            ],
            [
                'key' => 'airport_booking',
                'name' => 'Airport Transfer Confirmation',
                'description' => 'Sent to the customer when a new airport transfer booking is created.',
                'body' => 'Hi {{customer_name}}, your airport transfer booking {{booking_reference}} has been received and is scheduled for {{scheduled_at}}. We will confirm shortly.',
            ],
            [
                'key' => 'airport_booking_cancelled',
                'name' => 'Airport Transfer Cancelled',
                'description' => 'Sent to the customer when an airport transfer booking is cancelled.',
                'body' => 'Hi {{customer_name}}, your airport transfer booking {{booking_reference}} has been cancelled. If you have any questions, please contact us.',
            ],
            [
                'key' => 'airport_booking_status_changed',
                'name' => 'Airport Booking Status Update',
                'description' => 'Sent to the admin when an airport booking status changes.',
                'body' => 'Airport booking {{booking_reference}} status updated to {{new_status}}. Please review in the management portal.',
            ],
            [
                'key' => 'chauffeur_booking',
                'name' => 'Chauffeur Booking Confirmation',
                'description' => 'Sent to the customer when a new chauffeur booking is created.',
                'body' => 'Hi {{customer_name}}, your chauffeur booking {{booking_reference}} has been received. Pickup: {{pickup_time}}. Vehicle: {{vehicle_name}}. We will confirm shortly.',
            ],
            [
                'key' => 'chauffeur_booking_cancelled',
                'name' => 'Chauffeur Booking Cancelled',
                'description' => 'Sent to the customer when a chauffeur booking is cancelled.',
                'body' => 'Hi {{customer_name}}, your chauffeur booking {{booking_reference}} has been cancelled. If you have any questions, please contact us.',
            ],
            [
                'key' => 'chauffeur_booking_status_changed',
                'name' => 'Chauffeur Booking Status Update',
                'description' => 'Sent to the admin when a chauffeur booking status changes.',
                'body' => 'Chauffeur booking {{booking_reference}} status updated to {{new_status}}. Please review in the management portal.',
            ],
            [
                'key' => 'chauffeur_pickup_reminder',
                'name' => 'Chauffeur Pickup Reminder',
                'description' => 'Sent to the customer as a reminder of their upcoming chauffeur pickup.',
                'body' => 'Reminder: Your chauffeur booking {{booking_reference}} ({{vehicle_name}}) has a pickup scheduled for {{pickup_time}}. We look forward to serving you!',
            ],
            [
                'key' => 'driver_document_expiry',
                'name' => 'Driver Document Expiry Alert',
                'description' => 'Sent to the admin when a driver document is expiring soon.',
                'body' => 'Alert: Driver {{driver_name}} has an expiring {{document_type}} on {{expiry_date}}. Please ensure the document is renewed before the expiry date.',
            ],
            [
                'key' => 'admin_rental_cancelled',
                'name' => 'Admin - Rental Cancelled Alert',
                'description' => 'Sent to the admin when a rental booking is cancelled.',
                'body' => 'Booking {{booking_reference}} cancelled for {{customer_name}} (branch {{branch_name}}). Vehicle: {{vehicle_name}}. Review in portal.',
            ],
            [
                'key' => 'admin_pickup_reminder',
                'name' => 'Admin - Pickup Reminder',
                'description' => 'Sent to the admin for an upcoming rental pickup tomorrow.',
                'body' => 'Pickup tomorrow: {{booking_reference}} on {{pickup_date}}. Customer: {{customer_name}}. Vehicle: {{vehicle_name}}. Branch: {{branch_name}}.',
            ],
            [
                'key' => 'admin_return_reminder',
                'name' => 'Admin - Return Reminder',
                'description' => 'Sent to the admin for an upcoming rental return tomorrow.',
                'body' => 'Return tomorrow: {{booking_reference}} on {{return_date}}. Customer: {{customer_name}}. Vehicle: {{vehicle_name}}. Branch: {{branch_name}}.',
            ],
            [
                'key' => 'admin_overdue_alert',
                'name' => 'Admin - Overdue Alert',
                'description' => 'Sent to the admin when a rental becomes overdue.',
                'body' => 'OVERDUE: Booking {{booking_reference}} past return. Customer {{customer_name}}, vehicle {{vehicle_name}}, branch {{branch_name}}. Action required.',
            ],
            [
                'key' => 'admin_payment_confirmation',
                'name' => 'Admin - Payment Confirmed',
                'description' => 'Sent to the admin when a rental payment is confirmed.',
                'body' => 'Payment of {{total_amount}} received for booking {{booking_reference}} (customer {{customer_name}}, branch {{branch_name}}). Recorded in portal.',
            ],
            [
                'key' => 'admin_rental_status_change',
                'name' => 'Admin - Rental Status Change',
                'description' => 'Sent to the admin when a rental status changes.',
                'body' => 'Booking {{booking_reference}} status changed to {{new_status}}. Branch: {{branch_name}}. Review in portal.',
            ],
            [
                'key' => 'admin_airport_booking',
                'name' => 'Admin - New Airport Booking',
                'description' => 'Sent to the admin when a new airport transfer booking is created.',
                'body' => 'New airport booking {{booking_reference}} at {{branch_name}} branch. Customer: {{customer_name}}. Vehicle: {{vehicle_name}}. Review in portal.',
            ],
            [
                'key' => 'admin_airport_booking_cancelled',
                'name' => 'Admin - Airport Booking Cancelled',
                'description' => 'Sent to the admin when an airport transfer booking is cancelled.',
                'body' => 'Airport booking {{booking_reference}} cancelled by/for {{customer_name}} (branch {{branch_name}}). Vehicle: {{vehicle_name}}.',
            ],
            [
                'key' => 'admin_chauffeur_booking',
                'name' => 'Admin - New Chauffeur Booking',
                'description' => 'Sent to the admin when a new chauffeur booking is created.',
                'body' => 'New chauffeur booking {{booking_reference}} at {{branch_name}} branch. Customer: {{customer_name}}. Vehicle: {{vehicle_name}}. Review in portal.',
            ],
            [
                'key' => 'admin_chauffeur_booking_cancelled',
                'name' => 'Admin - Chauffeur Booking Cancelled',
                'description' => 'Sent to the admin when a chauffeur booking is cancelled.',
                'body' => 'Chauffeur booking {{booking_reference}} cancelled by/for {{customer_name}} (branch {{branch_name}}). Vehicle: {{vehicle_name}}.',
            ],
            [
                'key' => 'admin_chauffeur_pickup_reminder',
                'name' => 'Admin - Chauffeur Pickup Reminder',
                'description' => 'Sent to the admin for an upcoming chauffeur pickup tomorrow.',
                'body' => 'Chauffeur pickup tomorrow: {{booking_reference}} on {{pickup_date}}. Customer: {{customer_name}}. Vehicle: {{vehicle_name}}. Branch: {{branch_name}}.',
            ],
        ];

        foreach ($templates as $template) {
            SmsTemplate::query()->updateOrCreate(
                ['key' => $template['key']],
                array_merge($template, ['default_body' => $template['body']])
            );
        }
    }
}
