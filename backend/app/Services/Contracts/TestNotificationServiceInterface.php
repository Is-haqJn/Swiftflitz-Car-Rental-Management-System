<?php

namespace App\Services\Contracts;

use RuntimeException;

interface TestNotificationServiceInterface
{
    /**
     * Send a test email of the given type to the specified email address.
     * Returns true on success, or throws an exception if no sample data is available.
     *
     * @throws RuntimeException When no sample data is found for the given type.
     */
    public function sendTestEmail(string $type, string $recipientEmail): void;
}
