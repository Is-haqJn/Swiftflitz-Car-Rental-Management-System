<?php

use App\Http\Controllers\ManagementAuthController;
use App\Http\Controllers\ManagementDashboardController;
use App\Http\Controllers\ManagementProfileController;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('login', function () {
    return response()->json([
        'message' => 'Please login to access.',
    ], 401);
})->name('login');

Route::prefix('management')->name('management.')->group(function () {
    /* Guest-only auth routes */
    Route::middleware('guest')->group(function () {
        Route::get('login', [ManagementAuthController::class, 'showLogin'])->name('login');
        Route::post('login', [ManagementAuthController::class, 'login'])
            ->middleware('throttle:10,1')
            ->name('login.submit');
    });

    /* Authenticated + super_admin-only */
    Route::middleware(['auth', EnsureSuperAdmin::class])->group(function () {
        Route::post('logout', [ManagementAuthController::class, 'logout'])->name('logout');

        Route::get('/', [ManagementDashboardController::class, 'index'])->name('dashboard');

        Route::post('queue/retry', [ManagementDashboardController::class, 'retryQueue'])->name('queue.retry');
        Route::post('queue/flush', [ManagementDashboardController::class, 'flushQueue'])->name('queue.flush');
        Route::post('queue/restart', [ManagementDashboardController::class, 'restartQueue'])->name('queue.restart');

        Route::post('logo', [ManagementDashboardController::class, 'uploadLogo'])->name('logo.upload');
        Route::delete('logo', [ManagementDashboardController::class, 'deleteLogo'])->name('logo.delete');

        Route::get('profile', [ManagementProfileController::class, 'show'])->name('profile');
        Route::put('profile', [ManagementProfileController::class, 'update'])->name('profile.update');
        Route::put('profile/password', [ManagementProfileController::class, 'updatePassword'])->name('profile.password');
        Route::post('profile/avatar', [ManagementProfileController::class, 'uploadAvatar'])->name('profile.avatar.upload');
        Route::delete('profile/avatar', [ManagementProfileController::class, 'deleteAvatar'])->name('profile.avatar.delete');
    });
});

Route::get('/check-timeout', function () {
    return response()->json([
        'max_execution_time' => ini_get('max_execution_time') . ' seconds',
        'php_sapi' => php_sapi_name(),
    ]);
});

Route::get('/test-timeout', function () {
    $seconds = 120; // 2 minutes

    // Intentionally halt execution
    sleep($seconds);

    return "The request successfully survived for {$seconds} seconds without timing out!";
});
