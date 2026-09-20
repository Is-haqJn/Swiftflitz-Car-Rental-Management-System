<?php

namespace Database\Seeders;

use App\Settings\HomepageSettings;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HomepageSettingsSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $settings = app(HomepageSettings::class);

        $settings->hero_cta_text = 'Rent A Car';
        $settings->hero_cta_url = '/listings';
        $settings->hero_secondary_cta_text = 'Airport Transfer';
        $settings->hero_secondary_cta_url = '/airport-transfer';

        $settings->save();

        $this->command->info('Homepage hero CTA URLs seeded successfully.');
    }
}
