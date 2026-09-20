<?php

namespace App\Models;

use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Contracts\Role as RoleInterface;
use Spatie\Permission\Exceptions\RoleDoesNotExist;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use LogsActivity;

    public $fillable = [
        'name',
        'guard_name',
        'description',
        'is_default',
    ];

    /**
     * Find a role by name, always defaulting to the 'web' guard.
     * This prevents guard resolution issues when the Sanctum middleware
     * changes the runtime default guard to 'sanctum' during requests.
     */
    public static function findByName(string $name, $guard = null): RoleInterface
    {
        $guard ??= 'web';

        $role = static::where('name', $name)->where('guard_name', $guard)->first();

        if (! $role) {
            throw RoleDoesNotExist::named($name, $guard);
        }

        return $role;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('role')
            ->setDescriptionForEvent(fn (string $eventName) => "Role {$this->name} was {$eventName}");
    }

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }
}
