<?php

namespace App\Enums;

enum ExportStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Ready = 'ready';
    case Failed = 'failed';

    public static function list(): array
    {
        return array_column(self::cases(), 'value');
    }
}
