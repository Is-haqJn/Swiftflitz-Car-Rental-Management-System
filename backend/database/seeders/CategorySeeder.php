<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Economy',
                'slug' => 'economy',
                'description' => 'Budget-friendly vehicles for everyday use.',
                'icon' => 'MdDirectionsCar',
                'is_active' => true,
            ],
            [
                'name' => 'Sedan',
                'slug' => 'sedan',
                'description' => 'Comfortable sedans for business and leisure.',
                'icon' => 'LuCar',
                'is_active' => true,
            ],
            [
                'name' => 'SUV',
                'slug' => 'suv',
                'description' => 'Sport utility vehicles for all terrains.',
                'icon' => 'LuCar',
                'is_active' => true,
            ],
            [
                'name' => 'Luxury',
                'slug' => 'luxury',
                'description' => 'Premium vehicles for a luxury experience.',
                'icon' => 'LuCar',
                'is_active' => true,
            ],
            [
                'name' => 'Pickup Truck',
                'slug' => 'pickup-truck',
                'description' => 'Durable trucks for heavy-duty tasks.',
                'icon' => 'LuCar',
                'is_active' => true,
            ],
            [
                'name' => 'Van',
                'slug' => 'van',
                'description' => 'Spacious vans for group travel.',
                'icon' => 'MdDirectionsCar',
                'is_active' => true,
            ],
        ];

        $seeded = 0;
        foreach ($categories as $cat) {
            if (! Category::where('slug', $cat['slug'])->exists()) {
                Category::create($cat);
                $seeded++;
            }
        }

        $this->command->info("✅ Seeded {$seeded} categories.");
    }
}
