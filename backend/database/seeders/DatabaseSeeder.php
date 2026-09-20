<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\info;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! confirm('Proceed with database seeding?', default: true)) {
            info('Seeding skipped.');

            return;
        }

        $runAll = confirm('Run ALL seeders without prompting for each one?', default: true);

        /** @var array<int, array{label: string, class: class-string<Seeder>}> $seeders */
        $seeders = [
            ['label' => 'Permissions', 'class' => PermissionsSeeder::class],
            ['label' => 'Roles', 'class' => RolesSeeder::class],
            ['label' => 'Role Permissions', 'class' => RolePermissionsSeeder::class],
            ['label' => 'Test Users', 'class' => TestUserSeeder::class],
            ['label' => 'Drivers', 'class' => DriverSeeder::class],
            ['label' => 'Notification Settings', 'class' => NotificationSettingSeeder::class],
            ['label' => 'Categories', 'class' => CategorySeeder::class],
            ['label' => 'Branches', 'class' => BranchSeeder::class],
            ['label' => 'Airports', 'class' => AirportSeeder::class],
            ['label' => 'Airport Locations', 'class' => AirportLocationSeeder::class],
            ['label' => 'Airport Packages', 'class' => AirportPackageSeeder::class],
            ['label' => 'Airport Package Assignments', 'class' => AirportPackageAssignmentSeeder::class],
            ['label' => 'Vehicles', 'class' => VehicleSeeder::class],
            ['label' => 'Fleet Vehicles', 'class' => FleetVehicleSeeder::class],
            ['label' => 'Customers', 'class' => CustomerSeeder::class],
            ['label' => 'Features', 'class' => FeatureSeeder::class],
            ['label' => 'Email Templates', 'class' => EmailTemplateSeeder::class],
            ['label' => 'WhatsApp Templates', 'class' => WhatsAppTemplateSeeder::class],
            ['label' => 'SMS Templates', 'class' => SmsTemplateSeeder::class],
            ['label' => 'Rental Locations', 'class' => RentalLocationSeeder::class],
            ['label' => 'Additional Charges', 'class' => AdditionalChargeSeeder::class],
            ['label' => 'Discount Rules', 'class' => DiscountRuleSeeder::class],
            ['label' => 'Discount Coupons', 'class' => DiscountCouponSeeder::class],
            ['label' => 'Overdue Charge Settings', 'class' => OverdueChargeSettingSeeder::class],
            ['label' => 'Rentals', 'class' => RentalSeeder::class],
            ['label' => 'Payment Transactions', 'class' => PaymentTransactionSeeder::class],
            ['label' => 'Under-Review Transactions', 'class' => UnderReviewTransactionSeeder::class],
            ['label' => 'Historical Rentals', 'class' => HistoricalRentalSeeder::class],
            ['label' => 'Homepage Settings', 'class' => HomepageSettingsSeeder::class],
            ['label' => 'FAQ Settings', 'class' => FaqSettingsSeeder::class],
            ['label' => 'Terms & Conditions Settings', 'class' => TermsSettingsSeeder::class],
            ['label' => 'Privacy Policy Settings', 'class' => PrivacySettingsSeeder::class],
        ];

        foreach ($seeders as $seeder) {
            if (! $runAll && ! confirm("Run {$seeder['label']}?", default: true)) {
                $this->command->warn("{$seeder['label']} skipped.");

                continue;
            }

            $this->call($seeder['class']);
        }
    }
}
