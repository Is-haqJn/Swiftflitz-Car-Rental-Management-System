<?php

namespace App\Traits;

trait HasCustomMediaPath
{
    /**
     * Return a custom media path used by CustomPathGenerator.
     * Override in the model to customize media storage location.
     */
    public function mediaPath(): string
    {
        // By default use the table name
        return $this->getTable();
    }
}
