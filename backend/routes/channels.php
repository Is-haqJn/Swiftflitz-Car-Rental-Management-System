<?php

use App\Models\Rental;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. Given a channel name and a callback, Laravel will
| call the callback when an authenticated user tries to listen to the channel.
|
*/

// ? Default user presence channel - used for auth model binding
Broadcast::channel('App.Models.User.{id}', function (User $user, int|string $id): bool {
    return (string) $user->id === (string) $id;
});

// ? Per-user notifications channel - streams AppNotification events
Broadcast::channel('notifications.{userId}', function (User $user, string $userId): bool {
    return (string) $user->id === $userId;
});

// ? Per-user exports channel - streams ExportReady events when async export jobs complete
Broadcast::channel('exports.{userId}', function (User $user, string $userId): bool {
    return (string) $user->id === $userId;
});

// ? Per-rental status channel - streams rental lifecycle updates
Broadcast::channel('rental.{rentalId}', function (User $user, string $rentalId): bool {
    $rental = Rental::find($rentalId);

    if (! $rental) {
        return false;
    }

    // ? Accessible to the assigned manager, or any user who can view all rentals
    return (string) $user->id === (string) $rental->manager_id
        || $user->hasPermissionTo('rentals.view_all');
});

// ? Global admin dashboard channel - streams aggregated stats and payment updates
Broadcast::channel('dashboard', function (User $user): bool {
    return $user->hasPermissionTo('dashboard.view');
});
