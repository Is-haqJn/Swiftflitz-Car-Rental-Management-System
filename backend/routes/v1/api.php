<?php

use App\Http\Controllers\V1\AdditionalChargeController;
use App\Http\Controllers\V1\AirportBookingController;
use App\Http\Controllers\V1\AirportCancellationSettingsController;
use App\Http\Controllers\V1\AirportController;
use App\Http\Controllers\V1\AirportCustomerController;
use App\Http\Controllers\V1\AirportLocationController;
use App\Http\Controllers\V1\AirportPackageAssignmentController;
use App\Http\Controllers\V1\AirportPackageController;
use App\Http\Controllers\V1\APIController;
use App\Http\Controllers\V1\Auth\AuthController;
use App\Http\Controllers\V1\BranchController;
use App\Http\Controllers\V1\CategoryController;
use App\Http\Controllers\V1\ChauffeurBookingController;
use App\Http\Controllers\V1\ChauffeurCustomerController;
use App\Http\Controllers\V1\ChauffeurLocationController;
use App\Http\Controllers\V1\ChauffeurSettingsController;
use App\Http\Controllers\V1\CustomerController;
use App\Http\Controllers\V1\CustomerDocumentController;
use App\Http\Controllers\V1\DashboardController;
use App\Http\Controllers\V1\DiscountCouponController;
use App\Http\Controllers\V1\DiscountRuleController;
use App\Http\Controllers\V1\DiscountUsageController;
use App\Http\Controllers\V1\DriverController;
use App\Http\Controllers\V1\EmailTemplateController;
use App\Http\Controllers\V1\ExportController;
use App\Http\Controllers\V1\FeatureController;
use App\Http\Controllers\V1\FleetVehicleController;
use App\Http\Controllers\V1\NotificationController;
use App\Http\Controllers\V1\PaymentController;
use App\Http\Controllers\V1\PricingController;
use App\Http\Controllers\V1\ProfileController;
use App\Http\Controllers\V1\Public\AirportController as PublicAirportController;
use App\Http\Controllers\V1\Public\BookingVerificationController;
use App\Http\Controllers\V1\Public\CategoryController as PublicCategoryController;
use App\Http\Controllers\V1\Public\ChauffeurController as PublicChauffeurController;
use App\Http\Controllers\V1\Public\ContactBranchesController;
use App\Http\Controllers\V1\Public\ContactFormController;
use App\Http\Controllers\V1\Public\CustomerProfileController;
use App\Http\Controllers\V1\Public\PublicCustomerController;
use App\Http\Controllers\V1\Public\QuoteController as PublicQuoteController;
use App\Http\Controllers\V1\Public\RentalLocationController as PublicRentalLocationController;
use App\Http\Controllers\V1\Public\RentalTrackingController;
use App\Http\Controllers\V1\Public\VehicleController as PublicVehicleController;
use App\Http\Controllers\V1\QuoteRequestController;
use App\Http\Controllers\V1\RentalController;
use App\Http\Controllers\V1\RentalLocationController;
use App\Http\Controllers\V1\ReportController;
use App\Http\Controllers\V1\RoleController;
use App\Http\Controllers\V1\SettingsController;
use App\Http\Controllers\V1\SmsTemplateController;
use App\Http\Controllers\V1\SystemController;
use App\Http\Controllers\V1\TestNotificationController;
use App\Http\Controllers\V1\TransactionController;
use App\Http\Controllers\V1\TusUploadController;
use App\Http\Controllers\V1\UserController;
use App\Http\Controllers\V1\VehicleController;
use App\Http\Controllers\V1\VehicleExpenseController;
use App\Http\Controllers\V1\VehicleImageController;
use App\Http\Controllers\V1\VideoStreamController;
use App\Http\Controllers\V1\WhatsAppTemplateController;
use App\Http\Controllers\WhatsAppWebhookController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Version 1 Routes
|--------------------------------------------------------------------------
*/

Route::get('/', APIController::class)->name('index');

Route::post('auth/login', [AuthController::class, 'login'])->name('auth.login')
    ->middleware('throttle:5,1');

Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])->name('auth.forgot-password')
    ->middleware('throttle:5,1');

Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->name('auth.reset-password');

/* Public Routes (no authentication required) */
Route::prefix('public')->name('public.')->group(function () {
    Route::get('categories', [PublicCategoryController::class, 'index'])->name('categories.index');
    Route::get('vehicles', [PublicVehicleController::class, 'index'])->name('vehicles.index');
    Route::get('vehicles/{id}', [PublicVehicleController::class, 'show'])->name('vehicles.show');
    Route::post('vehicles/{id}/pricing-preview', [PublicVehicleController::class, 'pricingPreview'])->name('vehicles.pricing-preview');
    Route::get('rental-locations/pickup', [PublicRentalLocationController::class, 'pickup'])->name('rental-locations.pickup');
    Route::get('rental-locations/dropoff', [PublicRentalLocationController::class, 'dropoff'])->name('rental-locations.dropoff');
    Route::get('maintenance-status', [SystemController::class, 'maintenanceStatus'])->name('maintenance-status');
    Route::post('contact', [ContactFormController::class, 'store'])->name('contact.store')->middleware('throttle:5,1');
    Route::get('contact/branches', [ContactBranchesController::class, 'index'])->name('contact.branches')->middleware('throttle:30,1');

    // Quote Requests (public submission + token-based confirmation)
    Route::post('bookings', [PublicQuoteController::class, 'store'])->name('quotes.store');
    Route::get('quotes/{token}', [PublicQuoteController::class, 'show'])->name('quotes.show');
    Route::post('quotes/{token}/confirm', [PublicQuoteController::class, 'confirm'])->name('quotes.confirm');
    Route::post('quotes/{token}/book-returning', [PublicQuoteController::class, 'bookReturning'])->name('quotes.book-returning');
    Route::post('quotes/{token}/cancel', [PublicQuoteController::class, 'cancel'])->name('quotes.cancel');

    // Document reupload (token-based, no auth)
    Route::get('reupload/{token}', [PublicCustomerController::class, 'show'])->name('reupload.show');
    Route::post('reupload/{token}', [PublicCustomerController::class, 'upload'])->name('reupload.upload');

    // New customer booking + returning customer identity verification
    Route::post('booking/check-email', [BookingVerificationController::class, 'checkEmail'])->name('booking.check-email');
    Route::post('booking/book-new', [BookingVerificationController::class, 'bookNew'])->name('booking.book-new');
    Route::post('booking/request-verification', [BookingVerificationController::class, 'requestVerification'])->name('booking.request-verification');
    Route::get('booking/verify-status', [BookingVerificationController::class, 'verifyStatus'])->name('booking.verify-status');
    Route::post('booking/verify/{token}', [BookingVerificationController::class, 'confirm'])->name('booking.verify');
    Route::post('booking/book', [BookingVerificationController::class, 'book'])->name('booking.book');

    // Customer profile completion (token-based, for new website customers)
    Route::get('customer/complete-profile/{token}', [CustomerProfileController::class, 'show'])->name('customer.complete-profile.show');
    Route::post('customer/complete-profile/{token}', [CustomerProfileController::class, 'submit'])->name('customer.complete-profile.submit');

    // Airport Transfer (public listing + booking for website)
    Route::get('airports', [PublicAirportController::class, 'airports'])->name('airports.index');
    Route::get('airport-packages', [PublicAirportController::class, 'packages'])->name('airport-packages.index');
    Route::get('airports/{airport}/terminals', [PublicAirportController::class, 'terminals'])->name('airports.terminals');
    Route::get('airports/{airport}/areas', [PublicAirportController::class, 'areas'])->name('airports.areas');
    Route::post('airport-bookings', [PublicAirportController::class, 'book'])->name('airport-bookings.public.store');

    // Chauffeur Services (public listing + detail for website)
    Route::get('chauffeur-vehicles', [FleetVehicleController::class, 'availableForChauffeur'])->name('public.chauffeur-vehicles.index');
    Route::get('chauffeur-vehicles/{vehicle}/booked-dates', [PublicChauffeurController::class, 'bookedDates'])->name('public.chauffeur-vehicles.booked-dates');
    Route::get('chauffeur-vehicles/{vehicle}', [FleetVehicleController::class, 'showPublic'])->name('public.chauffeur-vehicles.show');
    Route::get('chauffeur-locations', [ChauffeurLocationController::class, 'publicIndex'])->name('public.chauffeur-locations.index');
    Route::get('chauffeur-settings', [ChauffeurSettingsController::class, 'showPublic'])->name('public.chauffeur-settings.show');
    Route::get('rental-settings', [SettingsController::class, 'showPublicRental'])->name('public.rental-settings.show');
    Route::get('chauffeur/check-customer', [PublicChauffeurController::class, 'checkCustomer'])->name('public.chauffeur.check-customer');
    Route::post('chauffeur-bookings', [PublicChauffeurController::class, 'book'])->name('public.chauffeur-bookings.store');

    /* Rental Tracking (public - no auth required) */
    Route::get('rentals/track/{reference}', [RentalTrackingController::class, 'track'])->name('rentals.track');
});

/* Public Settings (read-only, no authentication required) */
Route::prefix('settings')->name('settings.public.')->group(function () {
    Route::get('general', [SettingsController::class, 'showGeneral'])->name('general.show');
    Route::get('logo', [SettingsController::class, 'logo'])->name('logo');
    Route::get('header', [SettingsController::class, 'showHeader'])->name('header.show');
    Route::get('homepage', [SettingsController::class, 'showHomepage'])->name('homepage.show');
    Route::get('about', [SettingsController::class, 'showAbout'])->name('about.show');
    Route::get('services', [SettingsController::class, 'showServices'])->name('services.show');
    Route::get('faq', [SettingsController::class, 'showFaq'])->name('faq.show');
    Route::get('terms', [SettingsController::class, 'showTerms'])->name('terms.show');
    Route::get('privacy', [SettingsController::class, 'showPrivacy'])->name('privacy.show');
    Route::get('contact', [SettingsController::class, 'showContact'])->name('contact.show');
    Route::get('footer', [SettingsController::class, 'showFooter'])->name('footer.show');
    Route::get('payment-config', [SettingsController::class, 'showPublicPayment'])->name('payment-config.show');
    Route::get('popups', [SettingsController::class, 'showPopups'])->name('popups.show');
    Route::get('seo', [SettingsController::class, 'showSeo'])->name('seo.show');
});

/* Payments (public - no authentication required) */
Route::prefix('payments')->name('payments.')->group(function () {
    Route::post('initiate', [PaymentController::class, 'initiate'])->name('initiate');
    Route::get('payable-amount', [PaymentController::class, 'payableAmount'])->name('payable-amount')
        ->middleware('throttle:20,1');
    Route::get('verify/{reference}', [PaymentController::class, 'verify'])->name('verify')
        ->middleware('throttle:6,1');
    Route::get('status/{reference}', [PaymentController::class, 'status'])->name('status')
        ->middleware('throttle:30,1');
    Route::post('webhook/{provider}', [PaymentController::class, 'webhook'])->name('webhook')
        ->middleware('throttle:30,1')
        ->where('provider', 'hubtel|paystack|stripe');
});

/* WhatsApp Cloud API webhooks (public - Meta calls these directly, no auth, no CSRF) */
Route::prefix('webhooks')->name('webhooks.')->group(function () {
    Route::get('whatsapp', [WhatsAppWebhookController::class, 'verify'])->name('whatsapp.verify');
    Route::post('whatsapp', [WhatsAppWebhookController::class, 'handle'])->name('whatsapp.handle');
});

Route::middleware(['auth:sanctum', 'disable-activitylog'])->group(function () {

    /*
     * Override the default 'web' middleware (which adds CSRF) so that
     * Pusher/Echo channel-auth POST requests succeed with a Bearer token.
     * The parent group already enforces auth:sanctum + disable-activitylog.
     */
    Broadcast::routes(['middleware' => ['auth:sanctum', 'disable-activitylog']]);

    /* TUS Resumable Uploads */
    Route::prefix('uploads/tus')->name('uploads.tus.')->group(function () {
        Route::post('/', [TusUploadController::class, 'create'])->name('create');
        Route::patch('{token}', [TusUploadController::class, 'patch'])->name('patch');
        Route::match(['HEAD'], '{token}', [TusUploadController::class, 'head'])->name('head');
        Route::delete('{token}', [TusUploadController::class, 'destroy'])->name('destroy');
    });

    /* Auth */
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('me', [AuthController::class, 'me'])->name('me');
    });

    /* Vehicles */
    Route::prefix('vehicles')->name('vehicles.')->group(function () {
        Route::get('/', [VehicleController::class, 'index'])->name('index');
        Route::get('featured', [VehicleController::class, 'featured'])->name('featured');
        Route::post('/', [VehicleController::class, 'store'])->name('store');

        // Static segment before {vehicle} wildcard
        Route::post('{vehicle}/complete-maintenance', [VehicleExpenseController::class, 'completeMaintenance'])->name('complete-maintenance');
        Route::get('{vehicle}/booked-dates', [VehicleController::class, 'getBookedDates'])->name('booked-dates');

        Route::get('{vehicle}', [VehicleController::class, 'show'])->name('show');
        Route::put('{vehicle}', [VehicleController::class, 'update'])->name('update');
        Route::delete('{vehicle}', [VehicleController::class, 'destroy'])->name('destroy');
        Route::patch('{vehicle}/toggle-featured', [VehicleController::class, 'toggleFeatured'])->name('toggle-featured');
        Route::patch('{vehicle}/toggle-price-visible', [VehicleController::class, 'togglePriceVisible'])->name('toggle-price-visible');
        Route::patch('{vehicle}/status', [VehicleController::class, 'updateStatus'])->name('update-status');

        // Images
        Route::prefix('{vehicle}/images')->name('images.')->group(function () {
            Route::get('/', [VehicleImageController::class, 'index'])->name('index');
            Route::post('/', [VehicleImageController::class, 'store'])->name('store');
            Route::put('reorder', [VehicleImageController::class, 'reorder'])->name('reorder');
            Route::patch('{media}/primary', [VehicleImageController::class, 'setPrimary'])->name('set-primary');
            Route::delete('{media}', [VehicleImageController::class, 'destroy'])->name('destroy');
        });
    });

    /* Vehicle Expenses */
    Route::post('vehicle-expenses', [VehicleExpenseController::class, 'store'])->name('vehicle-expenses.store');

    /* Categories */
    Route::apiResource('categories', CategoryController::class);
    Route::post('categories/{category}/image', [CategoryController::class, 'uploadImage'])->name('categories.upload-image');
    Route::delete('categories/{category}/image', [CategoryController::class, 'deleteImage'])->name('categories.delete-image');

    /* Features */
    Route::get('features/active', [FeatureController::class, 'active'])->name('features.active');
    Route::apiResource('features', FeatureController::class);

    /* Customers */
    Route::prefix('customers')->name('customers.')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->name('index');
        Route::get('blacklisted', [CustomerController::class, 'blacklisted'])->name('blacklisted');
        Route::get('active', [CustomerController::class, 'active'])->name('active');
        Route::get('lookup', [CustomerController::class, 'lookup'])->name('lookup');
        Route::post('/', [CustomerController::class, 'store'])->name('store');
        Route::get('{customer}', [CustomerController::class, 'show'])->name('show');
        Route::put('{customer}', [CustomerController::class, 'update'])->name('update');
        Route::delete('{customer}', [CustomerController::class, 'destroy'])->name('destroy');
        Route::patch('{customer}/toggle-blacklist', [CustomerController::class, 'toggleBlacklist'])->name('toggle-blacklist');
        Route::patch('{customer}/verify', [CustomerController::class, 'verify'])->name('verify');
        Route::post('{customer}/request-reupload', [CustomerController::class, 'requestReupload'])->name('request-reupload');
        Route::post('{customer}/send-complete-profile-link', [CustomerController::class, 'sendCompleteProfileLink'])->name('send-complete-profile-link');

        Route::prefix('{customer}/documents')->name('documents.')->group(function () {
            Route::get('/', [CustomerDocumentController::class, 'index'])->name('index');
            Route::post('license', [CustomerDocumentController::class, 'uploadLicense'])->name('license');
            Route::post('id-document', [CustomerDocumentController::class, 'uploadIdDocument'])->name('id-document');
            Route::post('additional', [CustomerDocumentController::class, 'uploadDocument'])->name('additional');
            Route::post('passport', [CustomerDocumentController::class, 'uploadPassport'])->name('passport');
            Route::delete('{media}', [CustomerDocumentController::class, 'destroy'])->name('destroy');
        });
    });

    /* Dashboard */
    Route::prefix('dashboard')->name('dashboard.')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('index');
        Route::get('revenue-trend', [DashboardController::class, 'revenueTrend'])->name('revenue-trend');
        Route::get('vehicle-utilization', [DashboardController::class, 'vehicleUtilization'])->name('vehicle-utilization');
        Route::get('recent-activity', [DashboardController::class, 'recentActivity'])->name('recent-activity');
        Route::get('upcoming-returns', [DashboardController::class, 'upcomingReturns'])->name('upcoming-returns');
    });

    /* Reports */
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('revenue', [ReportController::class, 'revenue'])->name('revenue');
        Route::get('vehicles', [ReportController::class, 'vehicles'])->name('vehicles');
        Route::get('manager-performance', [ReportController::class, 'managerPerformance'])->name('manager-performance');
        Route::get('outstanding-payments', [ReportController::class, 'outstandingPayments'])->name('outstanding-payments');
        Route::get('maintenance', [ReportController::class, 'maintenance'])->name('maintenance');
        Route::get('customer-analysis', [ReportController::class, 'customerAnalysis'])->name('customer-analysis');
        Route::get('vehicle-expenses', [ReportController::class, 'vehicleExpenses'])->name('vehicle-expenses');
        Route::get('{type}/export/pdf', [ReportController::class, 'exportPdf'])->name('export.pdf');
    });

    /* Notifications */
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
        Route::patch('read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
        Route::delete('read', [NotificationController::class, 'destroyAllRead'])->name('destroy-read');
        Route::patch('{notificationId}/read', [NotificationController::class, 'markAsRead'])->name('read');
        Route::patch('{notificationId}/unread', [NotificationController::class, 'markAsUnread'])->name('unread');
        Route::delete('{notificationId}', [NotificationController::class, 'destroy'])->name('destroy');
        Route::get('settings', [NotificationController::class, 'settings'])->name('settings');
        Route::put('settings', [NotificationController::class, 'updateSettings'])->name('settings.update');
        Route::post('test-email', [TestNotificationController::class, 'send'])->name('test-email');
        Route::get('{notificationId}', [NotificationController::class, 'show'])->name('show');
    });

    /* Profile */
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'show'])->name('show');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::patch('password', [ProfileController::class, 'changePassword'])->name('change-password');
        Route::get('activity', [ProfileController::class, 'activity'])->name('activity');
        Route::get('sessions', [ProfileController::class, 'sessions'])->name('sessions');
        Route::delete('sessions/{tokenId}', [ProfileController::class, 'revokeSession'])->name('sessions.revoke');
        Route::post('photo', [ProfileController::class, 'uploadPhoto'])->name('photo');
        Route::delete('photo', [ProfileController::class, 'removePhoto'])->name('photo.remove');
    });

    /* Users & Access */
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('roles/available', [UserController::class, 'availableRoles'])->name('roles.available');
        Route::get('permissions/available', [UserController::class, 'availablePermissions'])->name('permissions.available');

        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('{user}', [UserController::class, 'show'])->name('show');
        Route::put('{user}', [UserController::class, 'update'])->name('update');
        Route::delete('{user}', [UserController::class, 'destroy'])->name('destroy');
        Route::patch('{user}/toggle-active', [UserController::class, 'toggleActive'])->name('toggle-active');
        Route::put('{user}/roles', [UserController::class, 'assignRoles'])->name('roles');
        Route::put('{user}/permissions', [UserController::class, 'assignPermissions'])->name('permissions');
        Route::post('{user}/impersonate', [UserController::class, 'impersonate'])->name('impersonate');
        Route::delete('{user}/sessions', [UserController::class, 'revokeSessions'])->name('sessions.revoke');
        Route::post('{user}/branches', [UserController::class, 'assignBranches'])->name('branches.assign');
    });

    Route::get('activity-logs', [UserController::class, 'activityLogs'])->name('activity-logs.index');

    Route::get('admin/sessions', [UserController::class, 'allSessions'])->name('admin.sessions.index');
    Route::delete('admin/sessions/{tokenId}', [UserController::class, 'revokeAdminSession'])->name('admin.sessions.revoke');

    /* Additional Charges & Rental Locations */
    Route::apiResource('additional-charges', AdditionalChargeController::class);
    Route::apiResource('rental-locations', RentalLocationController::class);

    /* Discount Rules & Usages */
    Route::apiResource('discount-rules', DiscountRuleController::class);
    Route::get('discount-usages', [DiscountUsageController::class, 'index']);

    /* Pricing Preview */
    Route::post('pricing/preview', [PricingController::class, 'preview'])->name('pricing.preview');

    /* Rentals */
    Route::prefix('rentals')->name('rentals.')->group(function () {
        Route::get('/', [RentalController::class, 'index'])->name('index');
        Route::post('/', [RentalController::class, 'store'])->name('store');

        // Static action routes BEFORE {rental} wildcard
        Route::post('{rental}/confirm', [RentalController::class, 'confirm'])->name('confirm');
        Route::post('{rental}/pickup', [RentalController::class, 'processPickup'])->name('pickup');
        Route::post('{rental}/return', [RentalController::class, 'processReturn'])->name('return');
        Route::post('{rental}/approve-return', [RentalController::class, 'approveReturn'])->name('approve-return');
        Route::get('{rental}/cancel-preview', [RentalController::class, 'cancelPreview'])->name('cancel-preview');
        Route::post('{rental}/cancel', [RentalController::class, 'cancel'])->name('cancel');
        Route::post('{rental}/switch-vehicle', [RentalController::class, 'switchVehicle'])->name('switch-vehicle');
        Route::post('{rental}/settle', [RentalController::class, 'settle'])->name('settle');
        Route::post('{rental}/settle-damage', [RentalController::class, 'settleDamage'])->name('settle-damage');
        Route::patch('{rental}/record-repair-cost', [RentalController::class, 'recordRepairCost'])->name('record-repair-cost');
        Route::post('{rental}/collect-damage-balance', [RentalController::class, 'collectDamageBalance'])->name('collect-damage-balance');
        Route::post('{rental}/collect-deposit', [RentalController::class, 'collectDeposit'])->name('collect-deposit');
        Route::post('{rental}/refund-deposit', [RentalController::class, 'refundDeposit'])->name('refund-deposit');
        Route::post('{rental}/settle-with-deposit', [RentalController::class, 'settleWithDeposit'])->name('settle-with-deposit');
        Route::post('{rental}/settle-refund', [RentalController::class, 'settleRefund'])->name('settle-refund');
        Route::post('{rental}/waive-overdue', [RentalController::class, 'waiveOverdue'])->name('waive-overdue');
        Route::get('{rental}/extend-preview', [RentalController::class, 'extendPreview'])->name('extend-preview');
        Route::post('{rental}/extend', [RentalController::class, 'extend'])->name('extend');
        Route::post('{rental}/send-payment-link', [RentalController::class, 'sendPaymentLink'])->name('send-payment-link');
        Route::post('{rental}/send-damage-payment-link', [RentalController::class, 'sendDamagePaymentLink'])->name('send-damage-payment-link');
        Route::post('{rental}/send-security-deposit-payment-link', [RentalController::class, 'sendSecurityDepositPaymentLink'])->name('send-security-deposit-payment-link');
        Route::post('{rental}/send-invoice', [RentalController::class, 'sendInvoice'])->name('send-invoice');
        Route::post('{rental}/upload-pickup-videos', [RentalController::class, 'uploadPickupVideos'])->name('upload-pickup-videos');
        Route::post('{rental}/upload-return-videos', [RentalController::class, 'uploadReturnVideos'])->name('upload-return-videos');
        Route::get('{rental}/videos/{media}/stream', [VideoStreamController::class, 'stream'])
            ->name('videos.stream')
            ->withoutMiddleware(['auth:sanctum'])
            ->middleware('signed');

        Route::get('{rental}', [RentalController::class, 'show'])->name('show');
        Route::put('{rental}', [RentalController::class, 'update'])->name('update');
        Route::delete('{rental}', [RentalController::class, 'destroy'])->name('destroy');
    });

    /* Coupons */
    Route::get('coupons/validate', [DiscountCouponController::class, 'validateCode']); // BEFORE wildcard
    Route::apiResource('coupons', DiscountCouponController::class);

    /* Branches */
    Route::get('branches/active', [BranchController::class, 'active'])->name('branches.active');
    Route::patch('branches/{branch}/toggle-active', [BranchController::class, 'toggleActive'])->name('branches.toggle-active');
    Route::post('branches/{branch}/vacate', [BranchController::class, 'vacate'])->name('branches.vacate');
    Route::post('branches/{branch}/managers', [BranchController::class, 'assignManagers'])->name('branches.managers.assign');
    Route::apiResource('branches', BranchController::class);

    /* Roles */
    Route::prefix('roles')->name('roles.')->group(function () {
        Route::get('permissions', [RoleController::class, 'permissions'])->name('permissions');

        Route::get('/', [RoleController::class, 'index'])->name('index');
        Route::post('/', [RoleController::class, 'store'])->name('store');
        Route::put('{role}', [RoleController::class, 'update'])->name('update');
        Route::delete('{role}', [RoleController::class, 'destroy'])->name('destroy');
        Route::get('{role}/users', [RoleController::class, 'users'])->name('users');
    });

    /* Settings (admin only) */
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::put('general', [SettingsController::class, 'updateGeneral'])->name('general.update');

        Route::get('rental', [SettingsController::class, 'showRental'])->name('rental.show');
        Route::put('rental', [SettingsController::class, 'updateRental'])->name('rental.update');

        Route::get('pricing', [SettingsController::class, 'showPricing'])->name('pricing.show');
        Route::put('pricing', [SettingsController::class, 'updatePricing'])->name('pricing.update');

        Route::get('cancellation', [SettingsController::class, 'showCancellation'])->name('cancellation.show');
        Route::put('cancellation', [SettingsController::class, 'updateCancellation'])->name('cancellation.update');

        Route::get('overdue', [SettingsController::class, 'showOverdue'])->name('overdue.show');
        Route::put('overdue', [SettingsController::class, 'updateOverdue'])->name('overdue.update');

        Route::get('early-return', [SettingsController::class, 'showEarlyReturn'])->name('early-return.show');
        Route::put('early-return', [SettingsController::class, 'updateEarlyReturn'])->name('early-return.update');

        Route::get('email', [SettingsController::class, 'showEmail'])->name('email.show');
        Route::put('email', [SettingsController::class, 'updateEmail'])->name('email.update');
        Route::post('email/test', [SettingsController::class, 'testEmail'])->name('email.test');

        Route::get('whatsapp', [SettingsController::class, 'showWhatsApp'])->name('whatsapp.show');
        Route::put('whatsapp', [SettingsController::class, 'updateWhatsApp'])->name('whatsapp.update');
        Route::post('whatsapp/test', [SettingsController::class, 'testWhatsApp'])->name('whatsapp.test');

        Route::get('sms', [SettingsController::class, 'showSms'])->name('sms.show');
        Route::put('sms', [SettingsController::class, 'updateSms'])->name('sms.update');
        Route::post('sms/test', [SettingsController::class, 'testSms'])->name('sms.test');

        Route::get('payment', [SettingsController::class, 'showPayment'])->name('payment.show');
        Route::put('payment', [SettingsController::class, 'updatePayment'])->name('payment.update');

        Route::get('s3', [SettingsController::class, 'showS3'])->name('s3.show');
        Route::put('s3', [SettingsController::class, 'updateS3'])->name('s3.update');

        Route::put('seo', [SettingsController::class, 'updateSeo'])->name('seo.update');

        /* Website Content */
        Route::put('header', [SettingsController::class, 'updateHeader'])->name('header.update');
        Route::put('homepage', [SettingsController::class, 'updateHomepage'])->name('homepage.update');
        Route::post('homepage/hero-image', [SettingsController::class, 'uploadHeroImage'])->name('homepage.hero-image.upload');
        Route::put('about', [SettingsController::class, 'updateAbout'])->name('about.update');
        Route::post('about/banner-image', [SettingsController::class, 'uploadAboutBannerImage'])->name('about.banner-image.upload');
        Route::post('about/bg-image', [SettingsController::class, 'uploadAboutBgImage'])->name('about.bg-image.upload');
        Route::post('about/overlay-image', [SettingsController::class, 'uploadAboutOverlayImage'])->name('about.overlay-image.upload');
        Route::post('about/values-bg-image', [SettingsController::class, 'uploadAboutValuesBgImage'])->name('about.values-bg-image.upload');
        Route::post('about/team-photo', [SettingsController::class, 'uploadTeamPhoto'])->name('about.team-photo.upload');
        Route::get('icons', [SettingsController::class, 'listIcons'])->name('icons.index');
        Route::post('icons/upload', [SettingsController::class, 'uploadCardIcon'])->name('icons.upload');
        Route::post('why-choose-us/bg-image', [SettingsController::class, 'uploadWhyChooseUsBgImage'])->name('why-choose-us.bg-image.upload');
        Route::post('chauffeur/image', [SettingsController::class, 'uploadChauffeurImage'])->name('chauffeur.image.upload');
        Route::post('pickup-process/bg-image', [SettingsController::class, 'uploadPickupProcessBgImage'])->name('pickup-process.bg-image.upload');
        Route::post('pickup-process/bottom-image', [SettingsController::class, 'uploadPickupProcessBottomImage'])->name('pickup-process.bottom-image.upload');
        Route::post('homepage/testimonial-image', [SettingsController::class, 'uploadTestimonialImage'])->name('homepage.testimonial-image.upload');
        Route::put('services', [SettingsController::class, 'updateServices'])->name('services.update');
        Route::post('services/banner-image', [SettingsController::class, 'uploadServicesBannerImage'])->name('services.banner-image.upload');
        Route::post('services/facility-card-image', [SettingsController::class, 'uploadServicesFacilityCardImage'])->name('services.facility-card-image.upload');
        Route::post('services/why-choose-us-bg-image', [SettingsController::class, 'uploadServicesWhyChooseUsBgImage'])->name('services.why-choose-us-bg-image.upload');
        Route::post('services/listings-banner-image', [SettingsController::class, 'uploadListingsBannerImage'])->name('services.listings-banner-image.upload');
        Route::post('services/airport-transfer-banner-image', [SettingsController::class, 'uploadAirportTransferBannerImage'])->name('services.airport-transfer-banner-image.upload');
        Route::post('services/chauffeur-banner-image', [SettingsController::class, 'uploadChauffeurBannerImage'])->name('services.chauffeur-banner-image.upload');
        Route::put('faq', [SettingsController::class, 'updateFaq'])->name('faq.update');
        Route::post('faq/banner-image', [SettingsController::class, 'uploadFaqBannerImage'])->name('faq.banner-image.upload');
        Route::post('faq/section-bg-image', [SettingsController::class, 'uploadFaqSectionBgImage'])->name('faq.section-bg-image.upload');
        Route::put('terms', [SettingsController::class, 'updateTerms'])->name('terms.update');
        Route::post('terms/banner-image', [SettingsController::class, 'uploadTermsBannerImage'])->name('terms.banner-image.upload');
        Route::put('privacy', [SettingsController::class, 'updatePrivacy'])->name('privacy.update');
        Route::post('privacy/banner-image', [SettingsController::class, 'uploadPrivacyBannerImage'])->name('privacy.banner-image.upload');
        Route::put('contact', [SettingsController::class, 'updateContact'])->name('contact.update');
        Route::post('contact/banner-image', [SettingsController::class, 'uploadContactBannerImage'])->name('contact.banner-image.upload');
        Route::post('contact/section-bg-image', [SettingsController::class, 'uploadContactSectionBgImage'])->name('contact.section-bg-image.upload');
        Route::put('footer', [SettingsController::class, 'updateFooter'])->name('footer.update');

        Route::get('notifications', [SettingsController::class, 'showNotificationSystem'])->name('notifications.show');
        Route::put('notifications', [SettingsController::class, 'updateNotificationSystem'])->name('notifications.update');

        Route::put('popups', [SettingsController::class, 'updatePopups'])->name('popups.update');
        Route::post('popups/promo-image', [SettingsController::class, 'uploadPromoImage'])->name('popups.promo-image.upload');
    });

    /* Exports */
    Route::prefix('export')->name('export.')->group(function () {
        Route::get('rentals', [ExportController::class, 'rentals'])->name('rentals');
        Route::get('customers', [ExportController::class, 'customers'])->name('customers');
        Route::get('vehicles', [ExportController::class, 'vehicles'])->name('vehicles');
    });

    /* Async Export Records */
    Route::prefix('exports')->name('exports.')->group(function () {
        Route::get('/', [ExportController::class, 'index'])->name('index');
        Route::post('queue', [ExportController::class, 'queue'])->name('queue');
        Route::get('{export}/download', [ExportController::class, 'download'])->name('download');
        Route::delete('{export}', [ExportController::class, 'destroy'])->name('destroy');
    });

    /* System & Maintenance */
    Route::prefix('system')->name('system.')->group(function () {
        Route::get('info', [SystemController::class, 'info'])->name('info');
        Route::post('cache/clear', [SystemController::class, 'clearCache'])->name('cache.clear');
        Route::post('cache/config', [SystemController::class, 'clearConfigCache'])->name('cache.config');
        Route::post('cache/routes', [SystemController::class, 'clearRouteCache'])->name('cache.routes');
        Route::post('cache/views', [SystemController::class, 'clearViewCache'])->name('cache.views');
        Route::get('maintenance-mode', [SystemController::class, 'maintenanceMode'])->name('maintenance-mode.show');
        Route::post('maintenance-mode', [SystemController::class, 'toggleMaintenanceMode'])->name('maintenance-mode.toggle');
        Route::post('maintenance/run', [SystemController::class, 'runMaintenance'])->name('maintenance.run');
        Route::post('backup', [SystemController::class, 'runBackup'])->name('backup');
        Route::post('backup/full', [SystemController::class, 'runSystemBackup'])->name('backup.full');
        Route::get('backups', [SystemController::class, 'listBackups'])->name('backups.index');
        Route::get('backups/{filename}', [SystemController::class, 'downloadBackup'])->name('backups.download');
        Route::delete('backups/{filename}', [SystemController::class, 'deleteBackup'])->where('filename', '[A-Za-z0-9._-]+')->name('backups.delete');
        Route::get('backup-settings', [SystemController::class, 'getBackupSettings'])->name('backup-settings.show');
        Route::put('backup-settings', [SystemController::class, 'updateBackupSettings'])->name('backup-settings.update');
        Route::get('queue/status', [SystemController::class, 'queueStatus'])->name('queue.status');
        Route::post('queue/restart', [SystemController::class, 'restartQueue'])->name('queue.restart');
        Route::post('queue/flush', [SystemController::class, 'flushFailedJobs'])->name('queue.flush');
        Route::post('queue/retry', [SystemController::class, 'retryFailedJobs'])->name('queue.retry');
        Route::post('storage/migrate', [SystemController::class, 'migrateStorage'])->name('storage.migrate');
        Route::post('storage/test-s3', [SystemController::class, 'testS3Connection'])->name('storage.test-s3');
    });

    /* Drivers */
    Route::prefix('drivers')->name('drivers.')->group(function () {
        Route::get('/', [DriverController::class, 'index'])->name('index');
        Route::post('/', [DriverController::class, 'store'])->name('store');

        // Static routes BEFORE {driver} wildcard
        Route::get('available/chauffeur', [DriverController::class, 'availableForChauffeur'])->name('available.chauffeur');
        Route::get('available/airport', [DriverController::class, 'availableForAirport'])->name('available.airport');
        Route::patch('{driver}/status', [DriverController::class, 'updateStatus'])->name('updateStatus');
        Route::post('{driver}/media/photo', [DriverController::class, 'uploadPhoto'])->name('media.photo');
        Route::post('{driver}/media/id-document', [DriverController::class, 'uploadIdDocument'])->name('media.id-document');
        Route::post('{driver}/media/license-photo', [DriverController::class, 'uploadLicensePhoto'])->name('media.license-photo');

        Route::get('{driver}', [DriverController::class, 'show'])->name('show');
        Route::put('{driver}', [DriverController::class, 'update'])->name('update');
        Route::delete('{driver}', [DriverController::class, 'destroy'])->name('destroy');
    });

    /* Fleet Vehicles */
    Route::prefix('fleet-vehicles')->name('fleet-vehicles.')->group(function () {
        Route::get('/', [FleetVehicleController::class, 'index'])->name('index');
        Route::post('/', [FleetVehicleController::class, 'store'])->name('store');

        // Static routes BEFORE {fleetVehicle} wildcard
        Route::get('available/airport', [FleetVehicleController::class, 'availableForAirport'])->name('available.airport');
        Route::get('available/chauffeur', [FleetVehicleController::class, 'availableForChauffeur'])->name('available.chauffeur');

        Route::patch('{fleetVehicle}/status', [FleetVehicleController::class, 'updateStatus'])->name('status');
        Route::patch('{fleetVehicle}/toggle', [FleetVehicleController::class, 'toggleActive'])->name('toggle');
        Route::patch('{fleetVehicle}/services', [FleetVehicleController::class, 'assignServices'])->name('services');
        Route::post('{fleetVehicle}/photos', [FleetVehicleController::class, 'uploadPhoto'])->name('photos.upload');
        Route::patch('{fleetVehicle}/photos/{mediaId}/primary', [FleetVehicleController::class, 'setPrimaryPhoto'])->name('photos.primary');
        Route::delete('{fleetVehicle}/photos/{mediaId}', [FleetVehicleController::class, 'deletePhoto'])->name('photos.delete');

        Route::get('{fleetVehicle}', [FleetVehicleController::class, 'show'])->name('show');
        Route::put('{fleetVehicle}', [FleetVehicleController::class, 'update'])->name('update');
        Route::delete('{fleetVehicle}', [FleetVehicleController::class, 'destroy'])->name('destroy');
    });

    /* Airports */
    Route::get('airports/active', [AirportController::class, 'active'])->name('airports.active');
    Route::patch('airports/{airport}/toggle-active', [AirportController::class, 'toggleActive'])->name('airports.toggle-active');
    Route::patch('airports/{airport}/set-as-default', [AirportController::class, 'setAsDefault'])->name('airports.set-default');
    Route::apiResource('airports', AirportController::class);

    /* Airport Locations */
    Route::get('airport-locations/terminals', [AirportLocationController::class, 'terminals'])->name('airport-locations.terminals');
    Route::get('airport-locations/areas', [AirportLocationController::class, 'areas'])->name('airport-locations.areas');
    Route::patch('airport-locations/{airportLocation}/toggle-active', [AirportLocationController::class, 'toggleActive'])->name('airport-locations.toggle-active');
    Route::apiResource('airport-locations', AirportLocationController::class);

    /* Airport Packages */
    Route::get('airport-packages/for-pickup', [AirportPackageController::class, 'forPickup'])->name('airport-packages.for-pickup');
    Route::get('airport-packages/for-dropoff', [AirportPackageController::class, 'forDropoff'])->name('airport-packages.for-dropoff');
    Route::patch('airport-packages/{airportPackage}/toggle-active', [AirportPackageController::class, 'toggleActive'])->name('airport-packages.toggle-active');
    Route::post('airport-packages/{airportPackage}/photo', [AirportPackageController::class, 'uploadPhoto'])->name('airport-packages.upload-photo');
    Route::apiResource('airport-packages', AirportPackageController::class);

    /* Airport Package Assignments */
    Route::get('airport-package-assignments/by-airport/{airport}', [AirportPackageAssignmentController::class, 'byAirport'])->name('airport-package-assignments.by-airport');
    Route::patch('airport-package-assignments/{airportPackageAssignment}/toggle-active', [AirportPackageAssignmentController::class, 'toggleActive'])->name('airport-package-assignments.toggle-active');
    Route::apiResource('airport-package-assignments', AirportPackageAssignmentController::class);

    /* Airport Cancellation Settings */
    Route::get('airport-cancellation-settings', [AirportCancellationSettingsController::class, 'show'])->name('airport-cancellation-settings.show');
    Route::put('airport-cancellation-settings', [AirportCancellationSettingsController::class, 'update'])->name('airport-cancellation-settings.update');

    /* Airport Customers */
    Route::get('airport-customers/lookup', [AirportCustomerController::class, 'lookup'])->name('airport-customers.lookup');
    Route::apiResource('airport-customers', AirportCustomerController::class);

    /* Airport Bookings */
    Route::get('airport-bookings/blocked-dates', [AirportBookingController::class, 'blockedDates'])->name('airport-bookings.blocked-dates');
    Route::patch('airport-bookings/{airportBooking}/confirm', [AirportBookingController::class, 'confirm'])->name('airport-bookings.confirm');
    Route::patch('airport-bookings/{airportBooking}/assign-driver', [AirportBookingController::class, 'assignDriver'])->name('airport-bookings.assign-driver');
    Route::patch('airport-bookings/{airportBooking}/remove-driver', [AirportBookingController::class, 'removeDriver'])->name('airport-bookings.remove-driver');
    Route::patch('airport-bookings/{airportBooking}/start-trip', [AirportBookingController::class, 'startTrip'])->name('airport-bookings.start-trip');
    Route::patch('airport-bookings/{airportBooking}/complete-trip', [AirportBookingController::class, 'completeTrip'])->name('airport-bookings.complete-trip');
    Route::patch('airport-bookings/{airportBooking}/cancel', [AirportBookingController::class, 'cancel'])->name('airport-bookings.cancel');
    Route::patch('airport-bookings/{airportBooking}/no-show', [AirportBookingController::class, 'noShow'])->name('airport-bookings.no-show');
    Route::post('airport-bookings/{airportBooking}/payment', [AirportBookingController::class, 'recordPayment'])->name('airport-bookings.record-payment');
    Route::patch('airport-bookings/{airportBooking}/refund', [AirportBookingController::class, 'refund'])->name('airport-bookings.refund');
    Route::post('airport-bookings/{airportBooking}/send-payment-link', [AirportBookingController::class, 'sendPaymentLink'])->name('airport-bookings.send-payment-link');
    Route::apiResource('airport-bookings', AirportBookingController::class);

    /* Quote Requests */
    Route::prefix('quote-requests')->name('quote-requests.')->group(function () {
        Route::get('/', [QuoteRequestController::class, 'index'])->name('index');
        Route::post('/', [QuoteRequestController::class, 'store'])->name('store');

        // Static action routes BEFORE {quoteRequest} wildcard
        Route::patch('{quoteRequest}/contact', [QuoteRequestController::class, 'markContacted'])->name('contact');
        Route::patch('{quoteRequest}/generate', [QuoteRequestController::class, 'generateQuote'])->name('generate');
        Route::patch('{quoteRequest}/send', [QuoteRequestController::class, 'sendQuote'])->name('send');
        Route::patch('{quoteRequest}/convert', [QuoteRequestController::class, 'convert'])->name('convert');
        Route::patch('{quoteRequest}/mark-converted', [QuoteRequestController::class, 'markConverted'])->name('mark-converted');
        Route::post('{quoteRequest}/resolve', [QuoteRequestController::class, 'resolve'])->name('resolve');
        Route::get('{quoteRequest}/email-preview', [QuoteRequestController::class, 'emailPreview'])->name('email-preview');

        Route::get('{quoteRequest}', [QuoteRequestController::class, 'show'])->name('show');
        Route::delete('{quoteRequest}', [QuoteRequestController::class, 'destroy'])->name('destroy');
    });

    /* Chauffeur Settings */
    Route::get('chauffeur-settings', [ChauffeurSettingsController::class, 'show'])->name('chauffeur-settings.show');
    Route::put('chauffeur-settings', [ChauffeurSettingsController::class, 'update'])->name('chauffeur-settings.update');

    /* Chauffeur Customers */
    Route::get('chauffeur-customers/lookup', [ChauffeurCustomerController::class, 'lookup'])->name('chauffeur-customers.lookup');
    Route::apiResource('chauffeur-customers', ChauffeurCustomerController::class);

    /* Chauffeur Locations */
    Route::apiResource('chauffeur-locations', ChauffeurLocationController::class);

    /* Chauffeur Bookings */
    Route::get('chauffeur-bookings/vehicle/{vehicle}/booked-dates', [ChauffeurBookingController::class, 'vehicleBookedDates'])->name('chauffeur-bookings.vehicle.booked-dates');
    Route::patch('chauffeur-bookings/{chauffeurBooking}/confirm', [ChauffeurBookingController::class, 'confirm'])->name('chauffeur-bookings.confirm');
    Route::patch('chauffeur-bookings/{chauffeurBooking}/assign-driver', [ChauffeurBookingController::class, 'assignDriver'])->name('chauffeur-bookings.assign-driver');
    Route::patch('chauffeur-bookings/{chauffeurBooking}/remove-driver', [ChauffeurBookingController::class, 'removeDriver'])->name('chauffeur-bookings.remove-driver');
    Route::patch('chauffeur-bookings/{chauffeurBooking}/start-trip', [ChauffeurBookingController::class, 'startTrip'])->name('chauffeur-bookings.start-trip');
    Route::patch('chauffeur-bookings/{chauffeurBooking}/complete-trip', [ChauffeurBookingController::class, 'completeTrip'])->name('chauffeur-bookings.complete-trip');
    Route::patch('chauffeur-bookings/{chauffeurBooking}/cancel', [ChauffeurBookingController::class, 'cancel'])->name('chauffeur-bookings.cancel');
    Route::patch('chauffeur-bookings/{chauffeurBooking}/no-show', [ChauffeurBookingController::class, 'noShow'])->name('chauffeur-bookings.no-show');
    Route::post('chauffeur-bookings/{chauffeurBooking}/payment', [ChauffeurBookingController::class, 'recordPayment'])->name('chauffeur-bookings.record-payment');
    Route::patch('chauffeur-bookings/{chauffeurBooking}/refund', [ChauffeurBookingController::class, 'refund'])->name('chauffeur-bookings.refund');
    Route::post('chauffeur-bookings/{chauffeurBooking}/pickup-log', [ChauffeurBookingController::class, 'logPickup'])->name('chauffeur-bookings.pickup-log');
    Route::post('chauffeur-bookings/{chauffeurBooking}/return-log', [ChauffeurBookingController::class, 'logReturn'])->name('chauffeur-bookings.return-log');
    Route::post('chauffeur-bookings/{chauffeurBooking}/send-payment-link', [ChauffeurBookingController::class, 'sendPaymentLink'])->name('chauffeur-bookings.send-payment-link');
    Route::apiResource('chauffeur-bookings', ChauffeurBookingController::class);

    /* Email Templates */
    Route::prefix('email-templates')->name('email-templates.')->group(function () {
        Route::get('/', [EmailTemplateController::class, 'index'])->name('index');
        Route::get('{key}', [EmailTemplateController::class, 'show'])->name('show');
        Route::put('{key}', [EmailTemplateController::class, 'update'])->name('update');
        Route::post('{key}/reset', [EmailTemplateController::class, 'reset'])->name('reset');
    });

    /* WhatsApp Templates */
    Route::prefix('whatsapp-templates')->name('whatsapp-templates.')->group(function () {
        Route::get('/', [WhatsAppTemplateController::class, 'index'])->name('index');
        Route::get('{key}', [WhatsAppTemplateController::class, 'show'])->name('show');
        Route::put('{key}', [WhatsAppTemplateController::class, 'update'])->name('update');
        Route::post('{key}/reset', [WhatsAppTemplateController::class, 'reset'])->name('reset');
    });

    /* Transactions */
    Route::get('transactions/trends', [TransactionController::class, 'trends'])->name('transactions.trends');
    Route::post('transactions/{transaction}/resolve', [TransactionController::class, 'resolve'])->name('transactions.resolve');
    Route::apiResource('transactions', TransactionController::class)->only(['index', 'show']);

    /* SMS Templates */
    Route::prefix('sms-templates')->name('sms-templates.')->group(function () {
        Route::get('/', [SmsTemplateController::class, 'index'])->name('index');
        Route::get('{key}', [SmsTemplateController::class, 'show'])->name('show');
        Route::put('{key}', [SmsTemplateController::class, 'update'])->name('update');
        Route::post('{key}/reset', [SmsTemplateController::class, 'reset'])->name('reset');
    });

});
