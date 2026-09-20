<?php

namespace Database\Seeders;

use App\Models\Feature;
use Illuminate\Database\Seeder;

class FeatureSeeder extends Seeder
{
    public function run(): void
    {
        $features = [
            ['name' => 'Air Conditioning',    'icon' => 'MdAcUnit'],
            ['name' => 'Bluetooth',           'icon' => 'MdBluetooth'],
            ['name' => 'GPS Navigation',      'icon' => 'MdGpsFixed'],
            ['name' => 'Reverse Camera',      'icon' => 'MdCameraAlt'],
            ['name' => 'Parking Sensors',     'icon' => 'MdSensors'],
            ['name' => 'Sunroof',             'icon' => 'MdWbSunny'],
            ['name' => 'Leather Seats',       'icon' => 'MdAirlineSeatReclineExtra'],
            ['name' => 'Heated Seats',        'icon' => 'MdHeatPump'],
            ['name' => 'Cruise Control',      'icon' => 'MdSpeed'],
            ['name' => 'USB Port',            'icon' => 'MdUsb'],
            ['name' => 'AUX Input',           'icon' => 'MdHeadset'],
            ['name' => 'Apple CarPlay',       'icon' => 'MdScreenShare'],
            ['name' => 'Android Auto',        'icon' => 'LuMonitor'],
            ['name' => 'Keyless Entry',       'icon' => 'MdKey'],
            ['name' => 'Push Start',          'icon' => 'LuZap'],
            ['name' => 'Automatic Headlights', 'icon' => 'LuSun'],
            ['name' => 'Rain Sensors',        'icon' => 'MdAir'],
            ['name' => 'Alloy Wheels',        'icon' => 'MdTireRepair'],
            ['name' => 'Tinted Windows',      'icon' => 'TintedWindow'],
            ['name' => 'Child Safety Locks',  'icon' => 'MdChildCare'],
        ];

        foreach ($features as $feature) {
            Feature::firstOrCreate(
                ['name' => $feature['name']],
                ['icon' => $feature['icon'], 'is_active' => true]
            );
        }
    }
}
