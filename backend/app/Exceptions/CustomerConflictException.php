<?php

namespace App\Exceptions;

use RuntimeException;

class CustomerConflictException extends RuntimeException
{
    public function __construct(
        public readonly string $conflictType,
        public readonly array $existingCustomer,
        string $message,
    ) {
        parent::__construct($message);
    }
}
