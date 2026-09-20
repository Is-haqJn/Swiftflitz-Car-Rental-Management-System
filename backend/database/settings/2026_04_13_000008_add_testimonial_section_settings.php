<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('homepage.show_testimonial_section', true);
        $this->migrator->add('homepage.testimonial_title', 'Testimonial');
        $this->migrator->add('homepage.testimonial_large_title', 'What Our Customers Say');
        $this->migrator->add('homepage.testimonial_show_images', true);
        $this->migrator->add('homepage.testimonial_show_ratings', true);
        $this->migrator->add('homepage.testimonial_cards', [
            [
                'image_url' => 'assets/images/testimonial/pic1.jpg',
                'name' => 'Kevin Martin',
                'position' => 'Customer',
                'details' => 'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
                'rating' => 5,
            ],
            [
                'image_url' => 'assets/images/testimonial/pic2.jpg',
                'name' => 'Devid Cullen',
                'position' => 'Customer',
                'details' => 'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
                'rating' => 5,
            ],
            [
                'image_url' => 'assets/images/testimonial/pic3.jpg',
                'name' => 'Piter Has',
                'position' => 'Customer',
                'details' => 'I Was Very Impresed Lorem posuere in miss and drana en the nisan semere sceriun amiss etiam ornare in the miss drana is lorem fermen mauris.',
                'rating' => 5,
            ],
        ]);
    }
};
