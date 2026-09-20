<?php

use App\Http\Middleware\DisableActivityLogForSuperAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        channels: __DIR__ . '/../routes/channels.php',
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // ? allow sessions and CSRF protection for API routes to support Sanctum cookie authentication
        // add stafeful middle ware when in token mode
        if (env('SWIFTFLITZ_AUTH_MODE', 'token') === 'cookie') {
            $middleware->statefulApi();
        }

        // ? Exclude Telescope's own API endpoints from CSRF so the dashboard
        // works after a fresh session without producing 419 errors.
        $middleware->validateCsrfTokens(except: [
            'telescope/telescope-api/*',
        ]);

        // alias for disable activitylog for admin
        $middleware->alias([
            'disable-activitylog' => DisableActivityLogForSuperAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //

    })->create();
