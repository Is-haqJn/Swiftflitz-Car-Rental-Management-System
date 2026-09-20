<?php

namespace App\Services;

use App\Mail\TestConnectionMail;
use App\Services\Contracts\EmailTestServiceInterface;
use App\Settings\EmailSettings;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Throwable;

class EmailTestService implements EmailTestServiceInterface
{
    /**
     * Apply the stored SMTP configuration at runtime and send a test email.
     *
     * @throws Throwable
     */
    public function sendTestEmail(string $to, EmailSettings $settings): void
    {
        Config::set('mail.default', $settings->mailer);
        Config::set('mail.mailers.smtp.host', $settings->host);
        Config::set('mail.mailers.smtp.port', $settings->port);
        Config::set('mail.mailers.smtp.encryption', $settings->encryption ?: null);
        Config::set('mail.mailers.smtp.username', $settings->username ?: null);
        Config::set('mail.mailers.smtp.password', $settings->password ?: null);
        Config::set('mail.from.address', $settings->from_address);
        Config::set('mail.from.name', $settings->from_name);

        Mail::to($to)->send(new TestConnectionMail);
    }
}
