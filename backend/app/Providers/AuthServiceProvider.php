<?php

namespace App\Providers;

use App\Models\AdditionalCharge;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\DiscountCoupon;
use App\Models\DiscountRule;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Models\RentalLocation;
use App\Models\Role;
use App\Models\User;
use App\Models\Vehicle;
use App\Policies\AdditionalChargePolicy;
use App\Policies\BranchPolicy;
use App\Policies\CouponPolicy;
use App\Policies\CustomerPolicy;
use App\Policies\DiscountRulePolicy;
use App\Policies\PaymentTransactionPolicy;
use App\Policies\RentalLocationPolicy;
use App\Policies\RentalPolicy;
use App\Policies\RolePolicy;
use App\Policies\SettingsPolicy;
use App\Policies\UserPolicy;
use App\Policies\VehiclePolicy;
use App\Settings\GeneralSettings;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        AdditionalCharge::class => AdditionalChargePolicy::class,
        User::class => UserPolicy::class,
        Customer::class => CustomerPolicy::class,
        Vehicle::class => VehiclePolicy::class,
        Role::class => RolePolicy::class,
        Branch::class => BranchPolicy::class,
        RentalLocation::class => RentalLocationPolicy::class,
        DiscountRule::class => DiscountRulePolicy::class,
        DiscountCoupon::class => CouponPolicy::class,
        Rental::class => RentalPolicy::class,
        PaymentTransaction::class => PaymentTransactionPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // ? Point password reset emails to the SPA frontend instead of a backend route
        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $frontendUrl = rtrim(config('app.frontend_url'), '/');
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return "{$frontendUrl}/auth/reset-password?token={$token}&email={$email}";
        });

        // ? Super admin bypasses all gate/permission checks globally
        Gate::before(function (User $user, string $ability): ?bool {
            if ($user->hasRole('super_admin')) {
                return true;
            }

            return null;
        });

        // ? Register settings policy for non-model authorization
        Gate::policy(GeneralSettings::class, SettingsPolicy::class);
    }
}
