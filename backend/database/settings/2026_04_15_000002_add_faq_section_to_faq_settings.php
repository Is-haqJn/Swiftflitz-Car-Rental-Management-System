<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('faq.faq_section_enabled', true);
        $this->migrator->add('faq.faq_section_bg_image_version', 1);
        $this->migrator->add('faq.faq_section_large_title', 'Frequently Asked Questions');
        $this->migrator->add('faq.faq_items', [
            [
                'question' => 'How do I book a vehicle?',
                'answer' => 'Booking is simple - browse our fleet on the Vehicles page, select your preferred car, choose your pickup and return dates, and complete the reservation form. You will receive an instant confirmation by email once your booking is submitted.',
            ],
            [
                'question' => 'What documents do I need to rent a car?',
                'answer' => 'You will need a valid government-issued photo ID (national ID or passport) and a valid driver\'s licence. International visitors should carry their home country licence along with an International Driving Permit (IDP) where applicable.',
            ],
            [
                'question' => 'Is there a minimum age requirement for renting a vehicle?',
                'answer' => 'Yes. You must be at least 21 years old to rent a standard vehicle. Some premium or high-performance vehicles may require drivers to be 25 or older. Age restrictions are displayed on each vehicle listing.',
            ],
            [
                'question' => 'Can I cancel or modify my reservation?',
                'answer' => 'Yes. You can cancel or modify a reservation through your account dashboard or by contacting our support team. Cancellations made before the rental start time are eligible for a refund according to our cancellation policy. Please review the policy displayed at checkout for exact terms.',
            ],
            [
                'question' => 'What is included in the rental price?',
                'answer' => 'The quoted rental price covers the vehicle hire for the selected period and basic insurance coverage. Fuel, additional driver fees, and optional add-ons such as child seats or GPS are not included unless stated. All applicable charges are clearly itemised before you confirm your booking.',
            ],
            [
                'question' => 'Is a security deposit required?',
                'answer' => 'A refundable security deposit is held at the start of your rental to cover any potential damages or traffic fines incurred during the hire period. The deposit amount varies by vehicle category and is fully refunded within a few business days of the vehicle being returned in its original condition.',
            ],
            [
                'question' => 'Do you offer airport transfer services?',
                'answer' => 'Yes. Our airport transfer service provides reliable, punctual pick-up and drop-off at all major airports. You can book a transfer directly on our Airport Transfer page, specifying your flight details and destination. A professional driver will meet you at the arrivals hall.',
            ],
            [
                'question' => 'What is a chauffeur service and how is it different from a standard rental?',
                'answer' => 'With a standard rental you drive yourself. Our chauffeur service provides a professional, uniformed driver for the duration of your trip - ideal for corporate travel, special occasions, or when you simply prefer to sit back and relax. You can book it by the hour or for a fixed route.',
            ],
            [
                'question' => 'What should I do if the vehicle breaks down during my rental?',
                'answer' => 'Contact our 24/7 roadside assistance line immediately - the number is provided in your rental agreement and on the confirmation email. Do not attempt repairs yourself. We will arrange a replacement vehicle or technical support as quickly as possible at no extra cost to you.',
            ],
            [
                'question' => 'Can I extend my rental period?',
                'answer' => 'Yes, subject to vehicle availability. To extend your rental, log in to your account and request an extension, or contact our support team before your scheduled return time. Extensions are charged at the standard daily rate for the vehicle category.',
            ],
        ]);
    }
};
