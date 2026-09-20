<?php

namespace App\Providers;

use App\Exceptions\Handler;
use App\Models\AirportBooking;
use App\Models\ChauffeurBooking;
use App\Models\PaymentTransaction;
use App\Models\Rental;
use App\Observers\PaymentTransactionObserver;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // add the custom exception handler
        $this->app->singleton(
            ExceptionHandler::class,
            Handler::class
        );

    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Date::use(CarbonImmutable::class);

        PaymentTransaction::observe(PaymentTransactionObserver::class);

        Relation::morphMap([
            'rental' => Rental::class,
            'airport_booking' => AirportBooking::class,
            'chauffeur_booking' => ChauffeurBooking::class,
        ]);
    }
}
