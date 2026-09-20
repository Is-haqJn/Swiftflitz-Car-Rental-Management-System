<?php

namespace App\Enums;

enum InspectionType: string
{
    case Pickup = 'pickup';
    case Return = 'return';
    case Swap = 'swap';
}
