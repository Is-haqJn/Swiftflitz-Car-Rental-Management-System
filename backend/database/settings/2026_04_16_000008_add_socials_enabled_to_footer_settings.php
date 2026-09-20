<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('footer.footer_socials_enabled', true);
        $this->migrator->delete('footer.social_facebook');
        $this->migrator->delete('footer.social_twitter');
        $this->migrator->delete('footer.social_instagram');
        $this->migrator->delete('footer.social_linkedin');
        $this->migrator->delete('footer.social_youtube');
    }
};
