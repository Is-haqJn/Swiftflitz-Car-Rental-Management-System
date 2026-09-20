<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('footer.tagline', 'Premium car rental service');
        $this->migrator->add('footer.copyright', '© ' . date('Y') . ' Swiftflitz. All rights reserved.');
        $this->migrator->add('footer.social_facebook', null);
        $this->migrator->add('footer.social_twitter', null);
        $this->migrator->add('footer.social_instagram', null);
        $this->migrator->add('footer.social_linkedin', null);
        $this->migrator->add('footer.social_youtube', null);
    }
};
