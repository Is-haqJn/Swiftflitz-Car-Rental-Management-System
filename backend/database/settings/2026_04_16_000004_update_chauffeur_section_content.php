<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->update('homepage.chauffeur_title', fn () => 'Chauffeur Services');
        $this->migrator->update('homepage.chauffeur_large_title', fn () => 'Ride in Comfort, Arrive in Style');
        $this->migrator->update('homepage.chauffeur_cta_text', fn () => 'Book a Chauffeur');
        $this->migrator->update('homepage.chauffeur_cta_url', fn () => '/chauffeur-services');
    }
};
