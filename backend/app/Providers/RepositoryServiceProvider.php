<?php

namespace App\Providers;

use App\Repositories\AdditionalChargeRepository;
use App\Repositories\AirportBookingRepository;
use App\Repositories\AirportCustomerRepository;
use App\Repositories\AirportLocationRepository;
use App\Repositories\AirportPackageAssignmentRepository;
use App\Repositories\AirportPackageRepository;
use App\Repositories\AirportRepository;
use App\Repositories\BranchRepository;
use App\Repositories\CategoryRepository;
use App\Repositories\ChauffeurBookingRepository;
use App\Repositories\ChauffeurCustomerRepository;
use App\Repositories\ChauffeurLocationRepository;
use App\Repositories\Contracts\AdditionalChargeRepositoryInterface;
use App\Repositories\Contracts\AirportBookingRepositoryInterface;
use App\Repositories\Contracts\AirportCustomerRepositoryInterface;
use App\Repositories\Contracts\AirportLocationRepositoryInterface;
use App\Repositories\Contracts\AirportPackageAssignmentRepositoryInterface;
use App\Repositories\Contracts\AirportPackageRepositoryInterface;
use App\Repositories\Contracts\AirportRepositoryInterface;
use App\Repositories\Contracts\BranchRepositoryInterface;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\ChauffeurBookingRepositoryInterface;
use App\Repositories\Contracts\ChauffeurCustomerRepositoryInterface;
use App\Repositories\Contracts\ChauffeurLocationRepositoryInterface;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\DiscountCouponRepositoryInterface;
use App\Repositories\Contracts\DiscountRuleRepositoryInterface;
use App\Repositories\Contracts\DriverRepositoryInterface;
use App\Repositories\Contracts\ExportRepositoryInterface;
use App\Repositories\Contracts\FeatureRepositoryInterface;
use App\Repositories\Contracts\FleetVehicleRepositoryInterface;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Repositories\Contracts\PaymentTransactionRepositoryInterface;
use App\Repositories\Contracts\QuoteRequestRepositoryInterface;
use App\Repositories\Contracts\RentalDiscountUsageRepositoryInterface;
use App\Repositories\Contracts\RentalLocationRepositoryInterface;
use App\Repositories\Contracts\RentalRepositoryInterface;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\TestNotificationRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\VehicleExpenseRepositoryInterface;
use App\Repositories\Contracts\VehicleRepositoryInterface;
use App\Repositories\CustomerDocument\CustomerDocumentRepository;
use App\Repositories\CustomerDocument\CustomerDocumentRepositoryInterface;
use App\Repositories\CustomerRepository;
use App\Repositories\DiscountCouponRepository;
use App\Repositories\DiscountRuleRepository;
use App\Repositories\DriverRepository;
use App\Repositories\ExportRepository;
use App\Repositories\FeatureRepository;
use App\Repositories\FleetVehicleRepository;
use App\Repositories\NotificationRepository;
use App\Repositories\PaymentTransactionRepository;
use App\Repositories\QuoteRequestRepository;
use App\Repositories\RentalDiscountUsageRepository;
use App\Repositories\RentalLocationRepository;
use App\Repositories\RentalRepository;
use App\Repositories\RoleRepository;
use App\Repositories\TestNotificationRepository;
use App\Repositories\UserRepository;
use App\Repositories\VehicleExpenseRepository;
use App\Repositories\VehicleRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AirportRepositoryInterface::class, AirportRepository::class);
        $this->app->bind(AirportLocationRepositoryInterface::class, AirportLocationRepository::class);
        $this->app->bind(AirportCustomerRepositoryInterface::class, AirportCustomerRepository::class);
        $this->app->bind(AirportBookingRepositoryInterface::class, AirportBookingRepository::class);
        $this->app->bind(AirportPackageRepositoryInterface::class, AirportPackageRepository::class);
        $this->app->bind(AirportPackageAssignmentRepositoryInterface::class, AirportPackageAssignmentRepository::class);
        $this->app->bind(BranchRepositoryInterface::class, BranchRepository::class);
        $this->app->bind(VehicleRepositoryInterface::class, VehicleRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(CustomerRepositoryInterface::class, CustomerRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, CategoryRepository::class);
        $this->app->bind(FeatureRepositoryInterface::class, FeatureRepository::class);
        $this->app->bind(RoleRepositoryInterface::class, RoleRepository::class);
        $this->app->bind(NotificationRepositoryInterface::class, NotificationRepository::class);
        $this->app->bind(TestNotificationRepositoryInterface::class, TestNotificationRepository::class);
        $this->app->bind(ExportRepositoryInterface::class, ExportRepository::class);
        $this->app->bind(VehicleExpenseRepositoryInterface::class, VehicleExpenseRepository::class);
        $this->app->bind(AdditionalChargeRepositoryInterface::class, AdditionalChargeRepository::class);
        $this->app->bind(RentalLocationRepositoryInterface::class, RentalLocationRepository::class);
        $this->app->bind(DiscountRuleRepositoryInterface::class, DiscountRuleRepository::class);
        $this->app->bind(DiscountCouponRepositoryInterface::class, DiscountCouponRepository::class);
        $this->app->bind(RentalRepositoryInterface::class, RentalRepository::class);
        $this->app->bind(DriverRepositoryInterface::class, DriverRepository::class);
        $this->app->bind(FleetVehicleRepositoryInterface::class, FleetVehicleRepository::class);
        $this->app->bind(QuoteRequestRepositoryInterface::class, QuoteRequestRepository::class);
        $this->app->bind(ChauffeurCustomerRepositoryInterface::class, ChauffeurCustomerRepository::class);
        $this->app->bind(ChauffeurBookingRepositoryInterface::class, ChauffeurBookingRepository::class);
        $this->app->bind(ChauffeurLocationRepositoryInterface::class, ChauffeurLocationRepository::class);
        $this->app->bind(RentalDiscountUsageRepositoryInterface::class, RentalDiscountUsageRepository::class);
        $this->app->bind(PaymentTransactionRepositoryInterface::class, PaymentTransactionRepository::class);

        // customer document repository
        $this->app->bind(
            CustomerDocumentRepositoryInterface::class,
            CustomerDocumentRepository::class
        );
    }

    public function boot(): void {}
}
