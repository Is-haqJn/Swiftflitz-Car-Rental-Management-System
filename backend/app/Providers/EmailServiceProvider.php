<?php

namespace App\Providers;

use App\Settings\EmailSettings;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\ServiceProvider;
use Throwable;

class EmailServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     * Applies DB-stored SMTP settings over the .env defaults at runtime.
     */
    public function boot(): void
    {
        $this->app->booted(function () {
            try {
                /** @var EmailSettings $settings */
                $settings = app(EmailSettings::class);

                if ($settings->host) {
                    Config::set('mail.default', $settings->mailer);
                    Config::set('mail.mailers.smtp.host', $settings->host);
                    Config::set('mail.mailers.smtp.port', $settings->port);
                    Config::set('mail.mailers.smtp.encryption', $settings->encryption ?: null);
                    Config::set('mail.mailers.smtp.username', $settings->username ?: null);
                    Config::set('mail.mailers.smtp.password', $settings->password ?: null);
                    Config::set('mail.from.address', $settings->from_address);
                    Config::set('mail.from.name', $settings->from_name);
                }
            } catch (Throwable) {
                // Silently fail if settings table is not yet migrated (fresh install).
            }
        });
    }
}
