<?php

namespace App\Http\Middleware;

use App\Enums\RoleEnum;
use Closure;
use Illuminate\Http\Request;
use Spatie\Activitylog\ActivityLogStatus;
use Symfony\Component\HttpFoundation\Response;

class DisableActivityLogForSuperAdmin
{
    /**
     * Disable activity logging for super admin users.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->hasRole(RoleEnum::SUPER_ADMIN->value)) {
            app(ActivityLogStatus::class)->disable();
        }

        return $next($request);
    }
}
