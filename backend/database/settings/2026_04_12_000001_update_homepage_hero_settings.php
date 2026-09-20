<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Replace flat hero_title with 4-part structured title
        $this->migrator->delete('homepage.hero_title');
        $this->migrator->add('homepage.hero_title_beginning', 'Your');
        $this->migrator->add('homepage.hero_title_words', ['Choice', 'Car']);
        $this->migrator->add('homepage.hero_title_highlight', 'For');
        $this->migrator->add('homepage.hero_title_ending', 'Rent');

        // Add side text (the small badge above the title)
        $this->migrator->add('homepage.hero_side_text', 'Premium');
    }
};
