<?php

namespace App\Services\Contracts;

use App\Settings\EmailSettings;
use Throwable;

interface EmailTestServiceInterface
{
    /**
     * Configure mail runtime settings and dispatch a test email.
     *
     * @throws Throwable
     */
    public function sendTestEmail(string $to, EmailSettings $settings): void;
}
