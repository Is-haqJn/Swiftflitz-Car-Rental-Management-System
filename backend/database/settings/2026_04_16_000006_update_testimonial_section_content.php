<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update('homepage.testimonial_title', fn () => 'Testimonials');
        $this->migrator->update('homepage.testimonial_large_title', fn () => 'What Our Customers Are Saying');
        $this->migrator->update('homepage.testimonial_show_images', fn () => false);
        $this->migrator->update('homepage.testimonial_cards', fn () => [
            [
                'image_url' => '',
                'name' => 'Kwame Asante',
                'position' => 'Business Traveller',
                'details' => 'Swiftflitz made my Accra business trip completely stress-free. The car was spotless, pickup was smooth, and the pricing was exactly what was quoted - no surprises. I\'ll definitely be using them again.',
                'rating' => 5,
            ],
            [
                'image_url' => '',
                'name' => 'Abena Osei-Bonsu',
                'position' => 'Tourist',
                'details' => 'I visited Ghana from the UK and needed a reliable car for two weeks. Swiftflitz delivered beyond my expectations - the vehicle was in great condition and the team was incredibly helpful throughout my stay.',
                'rating' => 5,
            ],
            [
                'image_url' => '',
                'name' => 'Emmanuel Tetteh',
                'position' => 'Entrepreneur',
                'details' => 'I\'ve used several car rental services in Accra, but Swiftflitz stands out. Their booking process is quick, the vehicles are well-maintained, and customer service actually picks up when you call.',
                'rating' => 5,
            ],
            [
                'image_url' => '',
                'name' => 'Serena Mensah',
                'position' => 'Event Planner',
                'details' => 'We hired a chauffeur-driven car for a client\'s wedding and it was absolutely perfect. Punctual, professional, and the car looked stunning. Our client was over the moon. Highly recommend Swiftflitz.',
                'rating' => 5,
            ],
            [
                'image_url' => '',
                'name' => 'Daniel Acheampong',
                'position' => 'Corporate Client',
                'details' => 'Our company regularly books vehicles through Swiftflitz for executive travel. The consistency in quality and professionalism is what keeps us coming back. Reliable partner for corporate transportation.',
                'rating' => 5,
            ],
            [
                'image_url' => '',
                'name' => 'Nana Ama Darko',
                'position' => 'Frequent Renter',
                'details' => 'What I love most is the transparency - the price you see is the price you pay. No hidden fees, no awkward conversations at pickup. The SUV I hired for my family road trip was clean, comfortable, and excellent value.',
                'rating' => 5,
            ],
            [
                'image_url' => '',
                'name' => 'Fiifi Boateng',
                'position' => 'Student',
                'details' => 'Even on a student budget I found a great deal with Swiftflitz. The booking was easy, the car was ready on time, and the staff were friendly and professional. Won\'t be going anywhere else for rentals.',
                'rating' => 5,
            ],
        ]);
    }
};
