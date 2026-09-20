<?php

namespace App\DTOs;

readonly class ExportData
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        public string $type,
        public string $format,
        public array $filters,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromRequest(array $data): self
    {
        return new self(
            type: $data['type'],
            format: $data['format'] ?? 'xlsx',
            filters: $data['filters'] ?? [],
        );
    }
}
