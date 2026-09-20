<?php

namespace App\Exceptions;

use Exception;

class ApiException extends Exception
{
    protected int $status = 400;

    public function __construct(string $message = 'API error', int $status = 400)
    {
        parent::__construct($message);
        $this->status = $status;
    }

    public function getStatus(): int
    {
        return $this->status;
    }
}
